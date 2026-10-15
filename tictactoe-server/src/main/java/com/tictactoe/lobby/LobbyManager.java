package com.tictactoe.lobby;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.server.ClientHandler;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

// ClientHandler já publica eventos no EventBus, este manager apenas se inscreve neles

public class LobbyManager {

    private static final Logger LOGGER = Logger.getLogger(LobbyManager.class.getName());
    private static final String SERVER_SENDER = "SERVER";

    private final Map<String, ClientHandler> players = new ConcurrentHashMap<>();

    private final Gson gson = new Gson();

    // Integração com o EventBus
    public void registerEventHandlers(EventBus eventBus) {
        eventBus.subscribe(EventType.USER_LOGGED_IN,
            e -> addPlayer(e.getSource(), (ClientHandler) e.getData()));

        eventBus.subscribe(EventType.USER_LOGGED_OUT,
            e -> removePlayer(e.getSource(), (ClientHandler) e.getData()));

        eventBus.subscribe(EventType.LIST_ONLINE_USERS,
            e -> sendOnlineUsersTo(e.getSource()));

        eventBus.subscribe(EventType.INVITE_SENT, this::handleInvite);
        eventBus.subscribe(EventType.INVITE_ACCEPTED,
            e -> handleInviteResponse(e, MessageType.INVITE_ACCEPTED));
        eventBus.subscribe(EventType.INVITE_REJECTED,
            e -> handleInviteResponse(e, MessageType.INVITE_REJECTED));
    }

    // Gerenciamento de estado
    public void addPlayer(String username, ClientHandler session) {
        if (username == null || session == null) {
            return;
        }
        players.put(username, session);
        LOGGER.info(String.format("event=PLAYER_JOINED_LOBBY details=\"Entrou: %s | Online: %s\"", username, players.keySet()));
        broadcastOnlineUsers();
    }

    public void removePlayer(String username, ClientHandler session) {
        if (username == null || !players.remove(username, session)) {
            return;
        }
        LOGGER.info(String.format("event=PLAYER_LEFT_LOBBY details=\"Saiu: %s | Online: %s\"", username, players.keySet()));
        broadcastOnlineUsers();
    }

    public List<String> getOnlineUsernames() {
        List<String> names = new ArrayList<>(players.keySet());
        Collections.sort(names);
        return names;
    }

    public boolean isOnline(String username) {
        return username != null && players.containsKey(username);
    }

    // Broadcast da lista de usuários (ONLINE_USERS_UPDATE)
    public void broadcastOnlineUsers() {
        Message update = buildOnlineUsersMessage();
        for (ClientHandler session : players.values()) {
            session.send(update);
        }
    }

    // Responde a um LIST_ONLINE_USERS enviando a lista apenas para quem pediu
    public void sendOnlineUsersTo(String username) {
        ClientHandler session = players.get(username);
        if (session != null) {
            session.send(buildOnlineUsersMessage());
        }
    }

    private Message buildOnlineUsersMessage() {
        JsonObject payload = new JsonObject();
        payload.add("users", gson.toJsonTree(getOnlineUsernames()));
        return new Message(MessageType.ONLINE_USERS_UPDATE, SERVER_SENDER, gson.toJson(payload));
    }

    // Roteamento de convites
    public void handleInvite(GameEvent event) {
        String from = event.getSource();
        String to = readTarget(event);

        if (!validateTarget(from, to)) {
            return;
        }

        LOGGER.info(String.format("event=INVITE_FORWARDED details=\"Convite enviado de %s para %s\"", from, to));
        forward(to, MessageType.INVITE_RECEIVED, from);
    }

    public void handleInviteResponse(GameEvent event, MessageType responseType) {
        String from = event.getSource();
        String to = readTarget(event);

        if (!validateTarget(from, to)) {
            return;
        }

        LOGGER.info(String.format("event=INVITE_RESPONSE_FORWARDED details=\"Resposta %s enviada de %s para %s\"", responseType, from, to));
        forward(to, responseType, from);
    }

    // Garante que o destino existe, está online e não é o próprio remetente
    private boolean validateTarget(String from, String to) {
        if (to == null) {
            sendErrorTo(from, "Payload deve conter o campo \"to\"");
            return false;
        }
        if (to.equals(from)) {
            sendErrorTo(from, "Você não pode convidar a si mesmo");
            return false;
        }
        if (!isOnline(to)) {
            sendErrorTo(from, "Usuário " + to + " não está online");
            LOGGER.warning(String.format("event=INVITE_TARGET_OFFLINE details=\"Destino offline: %s -> %s\"", from, to));
            return false;
        }
        return true;
    }

    private void forward(String to, MessageType type, String from) {
        ClientHandler target = players.get(to);
        if (target == null) {
            // Destino saiu entre a validação e o envio
            sendErrorTo(from, "Usuário " + to + " não está online");
            return;
        }
        JsonObject payload = new JsonObject();
        payload.addProperty("from", from);
        target.send(new Message(type, from, gson.toJson(payload)));
    }

    private String readTarget(GameEvent event) {
        Object data = event.getData();
        if (!(data instanceof String)) {
            return null;
        }
        try {
            JsonObject json = gson.fromJson((String) data, JsonObject.class);
            if (json == null || !json.has("to") || json.get("to").isJsonNull()) {
                return null;
            }
            String to = json.get("to").getAsString().trim();
            return to.isEmpty() ? null : to;
        } catch (JsonSyntaxException | IllegalStateException | UnsupportedOperationException e) {
            return null;
        }
    }

    private void sendErrorTo(String username, String errorMessage) {
        ClientHandler session = players.get(username);
        if (session != null) {
            session.sendError(errorMessage);
        }
    }

    public ClientHandler getHandler(String username) {
    return players.get(username);
    }
}
