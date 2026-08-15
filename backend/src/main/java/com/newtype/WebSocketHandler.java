package com.newtype;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.net.URI;
import java.util.*;

public class WebSocketHandler {

    private final DynamoDbClient dynamoDb = DynamoDbClient.builder()
            .region(Region.US_EAST_1)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public APIGatewayV2WebSocketResponse handleConnect(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        context.getLogger().log("New WebSocket client connected: " + connectionId);

        String tableName = System.getenv("CONNECTIONS_TABLE");
        if (tableName != null) {
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("connectionId", AttributeValue.builder().s(connectionId).build());
            item.put("connectedAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());

            dynamoDb.putItem(PutItemRequest.builder()
                    .tableName(tableName)
                    .item(item)
                    .build());
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        response.setBody("Connected: " + connectionId);
        return response;
    }

    public APIGatewayV2WebSocketResponse handleDisconnect(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        String domainName = event.getRequestContext().getDomainName();
        String stage = event.getRequestContext().getStage();
        context.getLogger().log("WebSocket client disconnected: " + connectionId);

        // 1. Remove connection from ConnectionsTable
        String connTableName = System.getenv("CONNECTIONS_TABLE");
        if (connTableName != null) {
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("connectionId", AttributeValue.builder().s(connectionId).build());

            dynamoDb.deleteItem(DeleteItemRequest.builder()
                    .tableName(connTableName)
                    .key(key)
                    .build());
        }

        // 2. Scan and remove any lobbies associated with this connection (host or guest)
        String lobbiesTableName = System.getenv("LOBBIES_TABLE");
        if (lobbiesTableName != null) {
            try {
                ScanResponse scanRes = dynamoDb.scan(ScanRequest.builder().tableName(lobbiesTableName).build());
                boolean lobbyRemoved = false;

                for (Map<String, AttributeValue> item : scanRes.items()) {
                    String hostId = item.containsKey("hostConnectionId") ? item.get("hostConnectionId").s() : "";
                    String guestId = item.containsKey("guestConnectionId") ? item.get("guestConnectionId").s() : "";

                    if (connectionId.equals(hostId) || connectionId.equals(guestId)) {
                        String roomId = item.get("roomId").s();
                        context.getLogger().log("Removing lobby " + roomId + " due to client disconnect: " + connectionId);

                        Map<String, AttributeValue> key = new HashMap<>();
                        key.put("roomId", AttributeValue.builder().s(roomId).build());

                        dynamoDb.deleteItem(DeleteItemRequest.builder()
                                .tableName(lobbiesTableName)
                                .key(key)
                                .build());
                        lobbyRemoved = true;
                    }
                }

                // If a lobby was removed, broadcast updated list to remaining connected clients
                if (lobbyRemoved && domainName != null && stage != null) {
                    broadcastLobbyList(domainName, stage, context);
                }

            } catch (Exception e) {
                context.getLogger().log("Error cleaning up lobbies on disconnect: " + e.getMessage());
            }
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        response.setBody("Disconnected: " + connectionId);
        return response;
    }

    private void broadcastLobbyList(String domainName, String stage, Context context) {
        String connTableName = System.getenv("CONNECTIONS_TABLE");
        String lobbiesTableName = System.getenv("LOBBIES_TABLE");
        if (connTableName == null || lobbiesTableName == null) return;

        try {
            ScanResponse lobbiesScan = dynamoDb.scan(ScanRequest.builder().tableName(lobbiesTableName).build());
            List<Map<String, Object>> lobbies = new ArrayList<>();
            for (Map<String, AttributeValue> item : lobbiesScan.items()) {
                Map<String, Object> room = new HashMap<>();
                room.put("roomId", item.get("roomId").s());
                room.put("roomName", item.get("roomName").s());
                room.put("hostConnectionId", item.get("hostConnectionId").s());
                room.put("hostUsername", item.get("hostUsername").s());
                room.put("status", item.get("status").s());
                lobbies.add(room);
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "LOBBY_LIST");
            payload.put("lobbies", lobbies);

            byte[] messageBytes = objectMapper.writeValueAsString(payload).getBytes();
            URI endpoint = new URI("https://" + domainName + "/" + stage);
            ApiGatewayManagementApiClient client = ApiGatewayManagementApiClient.builder()
                    .endpointOverride(endpoint)
                    .region(Region.US_EAST_1)
                    .build();

            ScanResponse connScan = dynamoDb.scan(ScanRequest.builder().tableName(connTableName).build());
            for (Map<String, AttributeValue> item : connScan.items()) {
                String connId = item.get("connectionId").s();
                try {
                    client.postToConnection(PostToConnectionRequest.builder()
                            .connectionId(connId)
                            .data(SdkBytes.fromByteArray(messageBytes))
                            .build());
                } catch (Exception e) {
                    // Ignore stale socket post failures
                }
            }
        } catch (Exception e) {
            context.getLogger().log("Error broadcasting lobby list on disconnect: " + e.getMessage());
        }
    }
}
