package com.tictactoe.server;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.auth.AuthService;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.lobby.LobbyManager;
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
    private final LobbyManager lobbyManager;
    private final Gson gson;

    // Estado do cliente
    private volatile String username;
    private volatile boolean authenticated;

    public ClientHandler(WebSocket connection, EventBus eventBus, AuthService authService) {
        this(connection, eventBus, authService, null);
    }

    public ClientHandler(WebSocket connection, EventBus eventBus, AuthService authService, LobbyManager lobbyManager) {
        this.connection = connection;
        this.eventBus = eventBus;
        this.authService = authService;
        this.lobbyManager = lobbyManager;
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
                handleDisconnectCommand();
                break;
            default:
                // Rotas autenticadas (RNF02.3)
                if (!authenticated) {
                    sendError("Acesso não autorizado. Faça login primeiro.");
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
        String payloadStr = message.getPayload();
        if (payloadStr == null || payloadStr.trim().isEmpty()) {
            sendAuthError(MessageType.REGISTER_ERROR, "Payload de registro não fornecido");
            return;
        }

        JsonObject payload;
        try {
            payload = gson.fromJson(payloadStr, JsonObject.class);
        } catch (Exception e) {
            sendAuthError(MessageType.REGISTER_ERROR, "Payload JSON inválido");
            return;
        }

        if (payload == null || !payload.has("username") || payload.get("username").isJsonNull()
                || !payload.has("password") || payload.get("password").isJsonNull()) {
            sendAuthError(MessageType.REGISTER_ERROR, "Campos 'username' e 'password' são obrigatórios");
            return;
        }

        String rawUsername = payload.get("username").getAsString();
        String rawPassword = payload.get("password").getAsString();

        if (rawUsername.trim().isEmpty() || rawPassword.trim().isEmpty()) {
            sendAuthError(MessageType.REGISTER_ERROR, "Username e password não podem ser vazios");
            return;
        }

        Message response = authService.register(rawUsername.trim(), rawPassword);
        send(response);
    }

    private void handleLogin(Message message) {
        if (authenticated) {
            sendAuthError(MessageType.LOGIN_ERROR, "Usuário já está autenticado nesta sessão");
            return;
        }

        String payloadStr = message.getPayload();
        if (payloadStr == null || payloadStr.trim().isEmpty()) {
            sendAuthError(MessageType.LOGIN_ERROR, "Payload de login não fornecido");
            return;
        }

        JsonObject payload;
        try {
            payload = gson.fromJson(payloadStr, JsonObject.class);
        } catch (Exception e) {
            sendAuthError(MessageType.LOGIN_ERROR, "Payload JSON inválido");
            return;
        }

        if (payload == null || !payload.has("username") || payload.get("username").isJsonNull()
                || !payload.has("password") || payload.get("password").isJsonNull()) {
            sendAuthError(MessageType.LOGIN_ERROR, "Campos 'username' e 'password' são obrigatórios");
            return;
        }

        String rawUsername = payload.get("username").getAsString();
        String rawPassword = payload.get("password").getAsString();

        if (rawUsername.trim().isEmpty() || rawPassword.trim().isEmpty()) {
            sendAuthError(MessageType.LOGIN_ERROR, "Username e password não podem ser vazios");
            return;
        }

        String normalizedUsername = rawUsername.trim();

        if (lobbyManager != null && lobbyManager.isOnline(normalizedUsername)) {
            LOGGER.warning(String.format("event=LOGIN_REJECTED_ONLINE details=\"Tentativa de login recusada - usuario ja esta online: %s\"", normalizedUsername));
            sendAuthError(MessageType.LOGIN_ERROR, "Usuário já está online");
            return;
        }

        Message response = authService.login(normalizedUsername, rawPassword);

        if (response.getType() == MessageType.LOGIN_SUCCESS) {
            this.username = normalizedUsername;
            this.authenticated = true;

            eventBus.publish(new GameEvent(
                EventType.USER_LOGGED_IN, normalizedUsername, this));
        }

        send(response);
    }

    private void handleDisconnectCommand() {
        onDisconnect();
        if (connection != null && connection.isOpen()) {
            connection.close();
        }
    }

    public void onDisconnect() {
        if (authenticated && username != null) {
            String user = this.username;
            this.authenticated = false;
            this.username = null;

            eventBus.publish(new GameEvent(
                EventType.USER_LOGGED_OUT, user, this));
            LOGGER.info(String.format("event=CLIENT_DISCONNECTED details=\"Cliente desconectado: %s\"", user));
        }
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

    private void sendAuthError(MessageType errorType, String errorMessage) {
        JsonObject payload = new JsonObject();
        payload.addProperty("message", errorMessage);
        send(new Message(errorType, "SERVER", gson.toJson(payload)));
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