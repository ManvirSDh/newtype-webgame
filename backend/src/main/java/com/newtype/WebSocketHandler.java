package com.newtype;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;

public class WebSocketHandler {

    public APIGatewayV2WebSocketResponse handleConnect(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        context.getLogger().log("New WebSocket client connected: " + connectionId);

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        response.setBody("Connected successfully: " + connectionId);
        return response;
    }

    public APIGatewayV2WebSocketResponse handleDisconnect(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        context.getLogger().log("WebSocket client disconnected: " + connectionId);

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        response.setBody("Disconnected: " + connectionId);
        return response;
    }
}
