package com.tictactoe.game;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.lobby.LobbyManager;
import com.tictactoe.server.ClientHandler;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

public class GameManager {

    private static final Logger LOGGER = Logger.getLogger(GameManager.class.getName());
    private static final String SERVER = "SERVER";

    private final LobbyManager lobbyManager;
    private final Gson gson;

    private final Map<String, GameRoom> activeGames   = new ConcurrentHashMap<>();
    private final Map<String, String>   playerGameMap = new ConcurrentHashMap<>();

    public GameManager(LobbyManager lobbyManager) {
        this.lobbyManager = lobbyManager;
        this.gson = new Gson();
    }

    public void registerEventHandlers(EventBus eventBus) {
        eventBus.subscribe(EventType.INVITE_ACCEPTED, this::handleGameStart);
        eventBus.subscribe(EventType.MOVE_MADE,       this::handleMove);
        eventBus.subscribe(EventType.PLAYER_FORFEIT,  this::handleForfeit);
        eventBus.subscribe(EventType.USER_LOGGED_OUT, this::handleDisconnect);
    }

    private void handleGameStart(GameEvent event) {
        String accepter = event.getSource();
        String inviter  = readFrom(event);

        if (inviter == null) return;

        GameRoom room = new GameRoom(inviter, accepter);

        activeGames.put(room.getGameId(), room);
        playerGameMap.put(inviter,  room.getGameId());
        playerGameMap.put(accepter, room.getGameId());

        LOGGER.info("[GAME MANAGER] Partida iniciada: " + room.getGameId());
        notifyGameStarted(room, inviter, accepter);
    }

    private void notifyGameStarted(GameRoom room, String inviter, String accepter) {
        ClientHandler inviterH  = lobbyManager.getHandler(inviter);
        ClientHandler accepterH = lobbyManager.getHandler(accepter);

        if (inviterH != null) {
            JsonObject p = new JsonObject();
            p.addProperty("gameId",   room.getGameId());
            p.addProperty("symbol",   "X");
            p.addProperty("opponent", accepter);
            p.addProperty("yourTurn", true);
            p.add("board", gson.toJsonTree(room.getBoard()));
            inviterH.send(new Message(MessageType.GAME_STARTED, SERVER, gson.toJson(p)));
        }

        if (accepterH != null) {
            JsonObject p = new JsonObject();
            p.addProperty("gameId",   room.getGameId());
            p.addProperty("symbol",   "O");
            p.addProperty("opponent", inviter);
            p.addProperty("yourTurn", false);
            p.add("board", gson.toJsonTree(room.getBoard()));
            accepterH.send(new Message(MessageType.GAME_STARTED, SERVER, gson.toJson(p)));
        }
    }

    private void handleMove(GameEvent event) {
        String username = event.getSource();
        GameRoom room   = getRoomOf(username);
        if (room == null) { sendErrorTo(username, "Você não está em nenhuma partida"); return; }

        int position;
        try {
            JsonObject p = gson.fromJson((String) event.getData(), JsonObject.class);
            position = p.get("position").getAsInt();
        } catch (Exception e) {
            sendErrorTo(username, "Payload inválido para MAKE_MOVE");
            return;
        }

        if (!room.makeMove(username, position)) {
            sendErrorTo(username, "Jogada inválida");
            return;
        }

        broadcastBoardUpdate(room, username);

        if (room.isGameOver()) {
            broadcastGameOver(room);
            cleanupGame(room);
        }
    }

    private void handleForfeit(GameEvent event) {
        String username = event.getSource();
        GameRoom room   = getRoomOf(username);
        if (room == null) return;
        room.forfeit(username);
        broadcastGameOver(room);
        cleanupGame(room);
    }

    private void handleDisconnect(GameEvent event) {
        String username = event.getSource();
        GameRoom room   = getRoomOf(username);
        if (room == null) return;
        room.forfeit(username);
        broadcastGameOver(room);
        cleanupGame(room);
    }

    private void broadcastBoardUpdate(GameRoom room, String lastPlayer) {
        JsonObject p = new JsonObject();
        p.addProperty("gameId",      room.getGameId());
        p.addProperty("currentTurn", room.getCurrentTurn());
        p.add("board", gson.toJsonTree(room.getBoard()));

        Message msg = new Message(MessageType.BOARD_UPDATE, SERVER, gson.toJson(p));
        sendTo(room.getPlayerX(), msg);
        sendTo(room.getPlayerO(), msg);
    }

    private void broadcastGameOver(GameRoom room) {
        JsonObject p = new JsonObject();
        p.addProperty("gameId",  room.getGameId());
        p.addProperty("result",  room.getResult().name());
        p.addProperty("winner",  room.getWinner() != null ? room.getWinner() : "DRAW");
        p.add("board", gson.toJsonTree(room.getBoard()));

        Message msg = new Message(MessageType.GAME_OVER, SERVER, gson.toJson(p));
        sendTo(room.getPlayerX(), msg);
        sendTo(room.getPlayerO(), msg);
    }

    private void cleanupGame(GameRoom room) {
        activeGames.remove(room.getGameId());
        playerGameMap.remove(room.getPlayerX());
        playerGameMap.remove(room.getPlayerO());
        LOGGER.info("[GAME MANAGER] Sala encerrada: " + room.getGameId());
    }

    private GameRoom getRoomOf(String username) {
        String gameId = playerGameMap.get(username);
        return gameId != null ? activeGames.get(gameId) : null;
    }

    private void sendTo(String username, Message message) {
        ClientHandler h = lobbyManager.getHandler(username);
        if (h != null) h.send(message);
    }

    private void sendErrorTo(String username, String error) {
        ClientHandler h = lobbyManager.getHandler(username);
        if (h != null) h.sendError(error);
    }

    private String readFrom(GameEvent event) {
        try {
            JsonObject json = gson.fromJson((String) event.getData(), JsonObject.class);
            return json.get("from").getAsString();
        } catch (Exception e) {
            return null;
        }
    }

    public int getActiveGameCount() { 
        return activeGames.size(); 
    }
}