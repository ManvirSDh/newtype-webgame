package com.newtype;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.net.URI;
import java.util.*;

public class LobbyHandler {

    private final DynamoDbClient dynamoDb = DynamoDbClient.builder()
            .region(Region.US_EAST_1)
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public APIGatewayV2WebSocketResponse createLobby(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        String domainName = event.getRequestContext().getDomainName();
        String stage = event.getRequestContext().getStage();

        try {
            JsonNode body = objectMapper.readTree(event.getBody());
            String roomName = body.path("roomName").asText("New Lobby");
            String hostName = body.path("username").asText("Commander");

            String roomId = "rm-" + UUID.randomUUID().toString().substring(0, 8);
            String tableName = System.getenv("LOBBIES_TABLE");

            Map<String, AttributeValue> item = new HashMap<>();
            item.put("roomId", AttributeValue.builder().s(roomId).build());
            item.put("roomName", AttributeValue.builder().s(roomName).build());
            item.put("hostConnectionId", AttributeValue.builder().s(connectionId).build());
            item.put("hostUsername", AttributeValue.builder().s(hostName).build());
            item.put("status", AttributeValue.builder().s("OPEN").build());
            item.put("createdAt", AttributeValue.builder().n(String.valueOf(System.currentTimeMillis())).build());
            item.put("ttl", AttributeValue.builder().n(String.valueOf((System.currentTimeMillis() / 1000) + 86400)).build());

            dynamoDb.putItem(PutItemRequest.builder()
                    .tableName(tableName)
                    .item(item)
                    .build());

            broadcastLobbyList(domainName, stage, context);

        } catch (Exception e) {
            context.getLogger().log("Error in createLobby: " + e.getMessage());
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }

    public APIGatewayV2WebSocketResponse joinLobby(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        String domainName = event.getRequestContext().getDomainName();
        String stage = event.getRequestContext().getStage();

        try {
            JsonNode body = objectMapper.readTree(event.getBody());
            String roomId = body.path("roomId").asText();
            String guestName = body.path("username").asText("Player2");
            String tableName = System.getenv("LOBBIES_TABLE");

            Map<String, AttributeValue> key = new HashMap<>();
            key.put("roomId", AttributeValue.builder().s(roomId).build());

            GetItemResponse getItem = dynamoDb.getItem(GetItemRequest.builder()
                    .tableName(tableName)
                    .key(key)
                    .build());

            if (getItem.hasItem()) {
                Map<String, AttributeValue> item = getItem.item();
                String hostConnectionId = item.get("hostConnectionId").s();

                // Update room to FULL
                Map<String, AttributeValueUpdate> updates = new HashMap<>();
                updates.put("guestConnectionId", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s(connectionId).build())
                        .action(AttributeAction.PUT)
                        .build());
                updates.put("guestUsername", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s(guestName).build())
                        .action(AttributeAction.PUT)
                        .build());
                updates.put("status", AttributeValueUpdate.builder()
                        .value(AttributeValue.builder().s("FULL").build())
                        .action(AttributeAction.PUT)
                        .build());

                dynamoDb.updateItem(UpdateItemRequest.builder()
                        .tableName(tableName)
                        .key(key)
                        .attributeUpdates(updates)
                        .build());

                // Notify host that player joined
                URI endpoint = new URI("https://" + domainName + "/" + stage);
                ApiGatewayManagementApiClient client = ApiGatewayManagementApiClient.builder()
                        .endpointOverride(endpoint)
                        .region(Region.US_EAST_1)
                        .build();

                Map<String, Object> notifyHost = new HashMap<>();
                notifyHost.put("action", "PLAYER_JOINED");
                notifyHost.put("guestConnectionId", connectionId);
                notifyHost.put("guestUsername", guestName);

                client.postToConnection(PostToConnectionRequest.builder()
                        .connectionId(hostConnectionId)
                        .data(SdkBytes.fromByteArray(objectMapper.writeValueAsString(notifyHost).getBytes()))
                        .build());

                // Notify guest of success
                Map<String, Object> notifyGuest = new HashMap<>();
                notifyGuest.put("action", "JOINED_LOBBY");
                notifyGuest.put("hostConnectionId", hostConnectionId);
                notifyGuest.put("roomId", roomId);

                client.postToConnection(PostToConnectionRequest.builder()
                        .connectionId(connectionId)
                        .data(SdkBytes.fromByteArray(objectMapper.writeValueAsString(notifyGuest).getBytes()))
                        .build());

                broadcastLobbyList(domainName, stage, context);
            }

        } catch (Exception e) {
            context.getLogger().log("Error in joinLobby: " + e.getMessage());
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }

    public APIGatewayV2WebSocketResponse closeLobby(APIGatewayV2WebSocketEvent event, Context context) {
        String domainName = event.getRequestContext().getDomainName();
        String stage = event.getRequestContext().getStage();

        try {
            JsonNode body = objectMapper.readTree(event.getBody());
            String roomId = body.path("roomId").asText();
            String tableName = System.getenv("LOBBIES_TABLE");

            Map<String, AttributeValue> key = new HashMap<>();
            key.put("roomId", AttributeValue.builder().s(roomId).build());

            dynamoDb.deleteItem(DeleteItemRequest.builder()
                    .tableName(tableName)
                    .key(key)
                    .build());

            broadcastLobbyList(domainName, stage, context);

        } catch (Exception e) {
            context.getLogger().log("Error in closeLobby: " + e.getMessage());
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }

    public APIGatewayV2WebSocketResponse getLobbies(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        String domainName = event.getRequestContext().getDomainName();
        String stage = event.getRequestContext().getStage();

        try {
            sendLobbiesToConnection(connectionId, domainName, stage, context);
        } catch (Exception e) {
            context.getLogger().log("Error in getLobbies: " + e.getMessage());
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }

    private void broadcastLobbyList(String domainName, String stage, Context context) {
        String connTableName = System.getenv("CONNECTIONS_TABLE");
        if (connTableName == null) return;

        try {
            ScanResponse scanRes = dynamoDb.scan(ScanRequest.builder().tableName(connTableName).build());
            for (Map<String, AttributeValue> item : scanRes.items()) {
                String connId = item.get("connectionId").s();
                sendLobbiesToConnection(connId, domainName, stage, context);
            }
        } catch (Exception e) {
            context.getLogger().log("Error broadcasting lobby list: " + e.getMessage());
        }
    }

    private void sendLobbiesToConnection(String connectionId, String domainName, String stage, Context context) throws Exception {
        String lobbiesTableName = System.getenv("LOBBIES_TABLE");
        ScanResponse scanRes = dynamoDb.scan(ScanRequest.builder().tableName(lobbiesTableName).build());

        List<Map<String, Object>> lobbies = new ArrayList<>();
        for (Map<String, AttributeValue> item : scanRes.items()) {
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

        URI endpoint = new URI("https://" + domainName + "/" + stage);
        ApiGatewayManagementApiClient client = ApiGatewayManagementApiClient.builder()
                .endpointOverride(endpoint)
                .region(Region.US_EAST_1)
                .build();

        client.postToConnection(PostToConnectionRequest.builder()
                .connectionId(connectionId)
                .data(SdkBytes.fromByteArray(objectMapper.writeValueAsString(payload).getBytes()))
                .build());
    }
}
