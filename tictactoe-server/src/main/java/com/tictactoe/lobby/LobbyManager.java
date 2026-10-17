package com.tictactoe.lobby;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.game.GameRoom;
import com.tictactoe.server.ClientHandler;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Gerenciador do Lobby e presenca em tempo real (RF02).
 * Responsavel pelo rastreamento de usuarios conectados, status (AVAILABLE/IN_GAME),
 * roteamento e validacao de convites pendentes e confirmacao de partidas.
 */
public class LobbyManager {

    private static final Logger LOGGER = Logger.getLogger(LobbyManager.class.getName());
    private static final String SERVER_SENDER = "SERVER";

    public enum PlayerStatus {
        AVAILABLE,
        IN_GAME
    }

    private final Map<String, ClientHandler> players = new ConcurrentHashMap<>();
    private final Map<String, PlayerStatus>  playerStatuses = new ConcurrentHashMap<>();
    private final Map<String, Set<String>>   pendingInvites = new ConcurrentHashMap<>();

    private final Gson gson = new Gson();
    private EventBus eventBus;

    // Integração com o EventBus
    public void registerEventHandlers(EventBus eventBus) {
        this.eventBus = eventBus;

        eventBus.subscribe(EventType.USER_LOGGED_IN,
            e -> addPlayer(e.getSource(), (ClientHandler) e.getData()));

        eventBus.subscribe(EventType.USER_LOGGED_OUT,
            e -> removePlayer(e.getSource(), (ClientHandler) e.getData()));

        eventBus.subscribe(EventType.LIST_ONLINE_USERS,
            e -> sendOnlineUsersTo(e.getSource()));

        eventBus.subscribe(EventType.INVITE_SENT, this::handleInvite);
        eventBus.subscribe(EventType.INVITE_ACCEPTED, this::handleInviteAccepted);
        eventBus.subscribe(EventType.INVITE_REJECTED, this::handleInviteRejected);

        // Notificacoes de ciclo de vida de partidas para atualizacao de status (RF02.3)
        eventBus.subscribe(EventType.GAME_STARTED, this::handleGameStartedEvent);
        eventBus.subscribe(EventType.GAME_OVER,    this::handleGameOverEvent);
    }

    // Gerenciamento de estado e presença
    public void addPlayer(String username, ClientHandler session) {
        if (username == null || session == null) {
            return;
        }
        players.put(username, session);
        playerStatuses.put(username, PlayerStatus.AVAILABLE);

        LOGGER.info(String.format("event=PLAYER_JOINED_LOBBY details=\"Entrou: %s | Online: %s\"",
                username, players.keySet()));
        broadcastOnlineUsers();
    }

    public void removePlayer(String username, ClientHandler session) {
        if (username == null || !players.remove(username, session)) {
            return;
        }
        playerStatuses.remove(username);
        clearPendingInvites(username);

        LOGGER.info(String.format("event=PLAYER_LEFT_LOBBY details=\"Saiu: %s | Online: %s\"",
                username, players.keySet()));
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

    public PlayerStatus getPlayerStatus(String username) {
        if (username == null) return null;
        return playerStatuses.get(username);
    }

    public void setPlayerStatus(String username, PlayerStatus status) {
        if (username != null && players.containsKey(username)) {
            playerStatuses.put(username, status);
        }
    }

    // Broadcast da lista de usuários com status (RF02.3)
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
        JsonArray usersArray = new JsonArray();

        List<String> names = new ArrayList<>(players.keySet());
        Collections.sort(names);

        for (String name : names) {
            JsonObject userObj = new JsonObject();
            userObj.addProperty("username", name);
            PlayerStatus status = playerStatuses.getOrDefault(name, PlayerStatus.AVAILABLE);
            userObj.addProperty("status", status.name());
            usersArray.add(userObj);
        }

        payload.add("users", usersArray);
        return new Message(MessageType.ONLINE_USERS_UPDATE, SERVER_SENDER, gson.toJson(payload));
    }

    // Roteamento e controle de convites
    public void handleInvite(GameEvent event) {
        String from = event.getSource();
        String to = readTargetOrFrom(event);

        if (!validateTarget(from, to)) {
            return;
        }

        if (getPlayerStatus(from) == PlayerStatus.IN_GAME) {
            sendErrorTo(from, "Você já está em uma partida");
            return;
        }
        if (getPlayerStatus(to) == PlayerStatus.IN_GAME) {
            sendErrorTo(from, "Usuário " + to + " já está em uma partida");
            return;
        }

        // Registra convite pendente: convidado -> set de convites recebidos
        pendingInvites.computeIfAbsent(to, k -> ConcurrentHashMap.newKeySet()).add(from);

        LOGGER.info(String.format("event=INVITE_FORWARDED details=\"Convite enviado de %s para %s\"", from, to));
        forward(to, MessageType.INVITE_RECEIVED, from);
    }

    public void handleInviteAccepted(GameEvent event) {
        String accepter = event.getSource();
        String inviter = readTargetOrFrom(event);

        if (inviter == null) {
            sendErrorTo(accepter, "Payload deve conter o campo 'from' ou 'to'");
            return;
        }

        if (inviter.equals(accepter)) {
            sendErrorTo(accepter, "Você não pode aceitar um convite de si mesmo");
            return;
        }

        Set<String> inviters = pendingInvites.get(accepter);
        if (inviters == null || !inviters.contains(inviter)) {
            sendErrorTo(accepter, "Convite inexistente ou expirado");
            LOGGER.warning(String.format("event=INVITE_ACCEPT_FAILED details=\"Tentativa de aceitar convite inexistente de %s por %s\"", inviter, accepter));
            return;
        }

        if (!isOnline(inviter)) {
            sendErrorTo(accepter, "Usuário " + inviter + " não está online");
            inviters.remove(inviter);
            LOGGER.warning(String.format("event=INVITE_ACCEPT_FAILED details=\"Convidante %s offline ao ser aceito por %s\"", inviter, accepter));
            return;
        }

        if (getPlayerStatus(accepter) == PlayerStatus.IN_GAME) {
            sendErrorTo(accepter, "Você já está em uma partida");
            return;
        }

        if (getPlayerStatus(inviter) == PlayerStatus.IN_GAME) {
            sendErrorTo(accepter, "Usuário " + inviter + " já está em uma partida");
            inviters.remove(inviter);
            return;
        }

        // Remove convites pendentes e limpa solicitacoes cruzadas
        inviters.remove(inviter);
        clearPendingInvites(accepter);
        clearPendingInvites(inviter);

        // Atualiza status de ambos para IN_GAME
        setPlayerStatus(accepter, PlayerStatus.IN_GAME);
        setPlayerStatus(inviter, PlayerStatus.IN_GAME);
        broadcastOnlineUsers();

        LOGGER.info(String.format("event=INVITE_ACCEPTED details=\"Partida confirmada entre %s (X) e %s (O)\"", inviter, accepter));

        // Notifica o convidante original
        forward(inviter, MessageType.INVITE_ACCEPTED, accepter);

        // Desacoplamento arquitetural (EB-5): publica MATCH_CONFIRMED para o GameManager criar a GameRoom
        if (eventBus != null) {
            JsonObject matchPayload = new JsonObject();
            matchPayload.addProperty("inviter", inviter);
            matchPayload.addProperty("accepter", accepter);
            eventBus.publish(new GameEvent(EventType.MATCH_CONFIRMED, accepter, gson.toJson(matchPayload)));
        }
    }

    public void handleInviteRejected(GameEvent event) {
        String accepter = event.getSource();
        String inviter = readTargetOrFrom(event);

        if (inviter != null) {
            Set<String> inviters = pendingInvites.get(accepter);
            if (inviters != null) {
                inviters.remove(inviter);
            }
            LOGGER.info(String.format("event=INVITE_REJECTED details=\"%s rejeitou convite de %s\"", accepter, inviter));
            forward(inviter, MessageType.INVITE_REJECTED, accepter);
        }
    }

    private void handleGameStartedEvent(GameEvent event) {
        Object data = event.getData();
        if (data instanceof GameRoom) {
            GameRoom room = (GameRoom) data;
            setPlayerStatus(room.getPlayerX(), PlayerStatus.IN_GAME);
            setPlayerStatus(room.getPlayerO(), PlayerStatus.IN_GAME);
            broadcastOnlineUsers();
        }
    }

    private void handleGameOverEvent(GameEvent event) {
        Object data = event.getData();
        if (data instanceof GameRoom) {
            GameRoom room = (GameRoom) data;
            if (isOnline(room.getPlayerX())) {
                setPlayerStatus(room.getPlayerX(), PlayerStatus.AVAILABLE);
            }
            if (isOnline(room.getPlayerO())) {
                setPlayerStatus(room.getPlayerO(), PlayerStatus.AVAILABLE);
            }
            broadcastOnlineUsers();
        }
    }

    private void clearPendingInvites(String username) {
        if (username == null) return;
        pendingInvites.remove(username);
        for (Set<String> inviters : pendingInvites.values()) {
            inviters.remove(username);
        }
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
            sendErrorTo(from, "Usuário " + to + " não está online");
            return;
        }
        JsonObject payload = new JsonObject();
        payload.addProperty("from", from);
        target.send(new Message(type, from, gson.toJson(payload)));
    }

    private String readTargetOrFrom(GameEvent event) {
        Object data = event.getData();
        if (!(data instanceof String)) {
            return null;
        }
        try {
            JsonObject json = gson.fromJson((String) data, JsonObject.class);
            if (json == null) return null;
            if (json.has("to") && !json.get("to").isJsonNull()) {
                String to = json.get("to").getAsString().trim();
                if (!to.isEmpty()) return to;
            }
            if (json.has("from") && !json.get("from").isJsonNull()) {
                String from = json.get("from").getAsString().trim();
                if (!from.isEmpty()) return from;
            }
            return null;
        } catch (Exception e) {
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
