package com.tictactoe.server;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.auth.AuthService;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;
import org.java_websocket.WebSocket;

import java.util.logging.Level;
import java.util.logging.Logger;

public class ClientHandler {

    private static final Logger LOGGER = Logger.getLogger(ClientHandler.class.getName());

    private final WebSocket connection;
    private final EventBus eventBus;
    private final AuthService authService;
    private final Gson gson;

    // Estado do cliente
    private String username;
    private boolean authenticated;

    public ClientHandler(WebSocket connection, EventBus eventBus, AuthService authService) {
        this.connection = connection;
        this.eventBus = eventBus;
        this.authService = authService;
        this.gson = new Gson();
        this.authenticated = false;
    }

    public void handleMessage(String rawMessage) {
        try {
            Message message = gson.fromJson(rawMessage, Message.class);

            if (message == null || message.getType() == null) {
                sendError("Mensagem inválida");
                return;
            }

            LOGGER.info(String.format("event=WS_MESSAGE_RECEIVED details=\"Mensagem recebida [%s] de: %s\"",
                message.getType(), connection.getRemoteSocketAddress()));

            route(message);

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "event=WS_MESSAGE_PROCESS_ERROR details=\"Erro ao processar mensagem\"", e);
            sendError("Erro interno ao processar mensagem");
        }
    }

    private void route(Message message) {
        switch (message.getType()) {
            case REGISTER:
                handleRegister(message);
                break;
            case LOGIN:
                handleLogin(message);
                break;
            case DISCONNECT:
                onDisconnect();
                break;
            default:
                // Rotas autenticadas
                if (!authenticated) {
                    sendError("Não autenticado");
                    return;
                }
                handleAuthenticatedMessage(message);
        }
    }

    private void handleAuthenticatedMessage(Message message) {
        switch (message.getType()) {
            case LIST_ONLINE_USERS:

                eventBus.publish(new GameEvent(
                    EventType.LIST_ONLINE_USERS, username, null));

                break;

            case INVITE:

                eventBus.publish(new GameEvent(
                    EventType.INVITE_SENT, username, message.getPayload()));

                break;

            case INVITE_ACCEPTED:

                eventBus.publish(new GameEvent(
                    EventType.INVITE_ACCEPTED, username, message.getPayload()));

                break;

            case INVITE_REJECTED:

                eventBus.publish(new GameEvent(
                    EventType.INVITE_REJECTED, username, message.getPayload()));

                break;

            case MAKE_MOVE:

                eventBus.publish(new GameEvent(
                    EventType.MOVE_MADE, username, message.getPayload()));

                break;

            case FORFEIT:

                eventBus.publish(new GameEvent(
                    EventType.PLAYER_FORFEIT, username, message.getPayload()));

                break;
                
            default:
                sendError("Tipo de mensagem desconhecido: " + message.getType());
        }
    }

    private void handleRegister(Message message) {
        JsonObject payload = gson.fromJson(message.getPayload(), JsonObject.class);
        String username = payload.get("username").getAsString();
        String password = payload.get("password").getAsString();

        Message response = authService.register(username, password);
        send(response);
    }

    private void handleLogin(Message message) {
        JsonObject payload = gson.fromJson(message.getPayload(), JsonObject.class);
        String username = payload.get("username").getAsString();
        String password = payload.get("password").getAsString();

        Message response = authService.login(username, password);

        if (response.getType() == MessageType.LOGIN_SUCCESS) {
            this.username = username;
            this.authenticated = true;

            eventBus.publish(new GameEvent(
                EventType.USER_LOGGED_IN, username, this));
        }

        send(response);
    }

    public void onDisconnect() {
        if (authenticated && username != null) {
            eventBus.publish(new GameEvent(
                EventType.USER_LOGGED_OUT, username, this));
        }
        LOGGER.info(String.format("event=CLIENT_DISCONNECTED details=\"Cliente desconectado: %s\"",
            (username != null ? username : connection.getRemoteSocketAddress())));
    }

    public void send(Message message) {
        if (connection.isOpen()) {
            connection.send(gson.toJson(message));
        }
    }

    public void sendError(String errorMessage) {
        JsonObject payload = new JsonObject();
        payload.addProperty("message", errorMessage);
        send(new Message(MessageType.ERROR, "SERVER", gson.toJson(payload)));
    }

    // Getters
    public String getUsername() { 
        return username; 
    }

    public boolean isAuthenticated() { 
        return authenticated; 
    }

    public WebSocket getConnection() { 
        return connection; 
    }

}