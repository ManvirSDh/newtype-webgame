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

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

public class SignalingHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public APIGatewayV2WebSocketResponse sendSignal(APIGatewayV2WebSocketEvent event, Context context) {
        String senderId = event.getRequestContext().getConnectionId();
        String domainName = event.getRequestContext().getDomainName();
        String stage = event.getRequestContext().getStage();

        try {
            JsonNode body = objectMapper.readTree(event.getBody());
            String targetConnectionId = body.path("targetConnectionId").asText();
            JsonNode signal = body.path("signal");

            context.getLogger().log("Relaying WebRTC signal from " + senderId + " to " + targetConnectionId);

            URI endpoint = new URI("https://" + domainName + "/" + stage);
            ApiGatewayManagementApiClient client = ApiGatewayManagementApiClient.builder()
                    .endpointOverride(endpoint)
                    .region(Region.US_EAST_1)
                    .build();

            Map<String, Object> payload = new HashMap<>();
            payload.put("action", "SIGNAL_RECEIVED");
            payload.put("senderConnectionId", senderId);
            payload.put("signal", signal);

            byte[] messageBytes = objectMapper.writeValueAsString(payload).getBytes();

            client.postToConnection(PostToConnectionRequest.builder()
                    .connectionId(targetConnectionId)
                    .data(SdkBytes.fromByteArray(messageBytes))
                    .build());

        } catch (Exception e) {
            context.getLogger().log("Error in sendSignal: " + e.getMessage());
        }

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }
}
