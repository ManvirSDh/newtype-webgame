package com.newtype;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import java.util.HashMap;
import java.util.Map;

public class LobbyHandler {

    public APIGatewayProxyResponseEvent getLobbies(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Fetching active game lobbies...");

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(headers);
        response.setStatusCode(200);
        response.setBody("[{\"id\":\"rm-101\",\"name\":\"Alpha Sector 1v1 Blitz\",\"host\":\"ZeroTwo\",\"players\":1,\"maxPlayers\":2,\"status\":\"Open\",\"mode\":\"1v1 Blitz\"}]");
        return response;
    }

    public APIGatewayProxyResponseEvent createRoom(APIGatewayProxyRequestEvent request, Context context) {
        context.getLogger().log("Creating new game room: " + request.getBody());

        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("Access-Control-Allow-Origin", "*");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setHeaders(headers);
        response.setStatusCode(201);
        response.setBody("{\"status\":\"success\",\"message\":\"Room created successfully\"}");
        return response;
    }
}
