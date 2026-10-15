package com.tictactoe.game;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.database.GameRepository;
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
    private final GameRepository gameRepository;
    private final Gson gson;
    private EventBus eventBus;

    private final Map<String, GameRoom> activeGames   = new ConcurrentHashMap<>();
    private final Map<String, String>   playerGameMap = new ConcurrentHashMap<>();

    public GameManager(LobbyManager lobbyManager) {
        this(lobbyManager, new GameRepository());
    }

    public GameManager(LobbyManager lobbyManager, GameRepository gameRepository) {
        this.lobbyManager = lobbyManager;
        this.gameRepository = gameRepository != null ? gameRepository : new GameRepository();
        this.gson = new Gson();
    }

    public void registerEventHandlers(EventBus eventBus) {
        this.eventBus = eventBus;
        // Correcao EB-5: GameManager assina MATCH_CONFIRMED apos validacao no LobbyManager
        eventBus.subscribe(EventType.MATCH_CONFIRMED, this::handleMatchConfirmed);
        eventBus.subscribe(EventType.MOVE_MADE,       this::handleMove);
        eventBus.subscribe(EventType.PLAYER_FORFEIT,  this::handleForfeit);
        eventBus.subscribe(EventType.USER_LOGGED_OUT, this::handleDisconnect);
    }

    private void handleMatchConfirmed(GameEvent event) {
        String inviter = null;
        String accepter = null;

        try {
            JsonObject json = gson.fromJson((String) event.getData(), JsonObject.class);
            if (json != null) {
                inviter = json.get("inviter").getAsString();
                accepter = json.get("accepter").getAsString();
            }
        } catch (Exception e) {
            LOGGER.warning("event=MATCH_CONFIRMED_PARSE_ERROR details=\"Falha ao analisar payload de MATCH_CONFIRMED\"");
            return;
        }

        if (inviter == null || accepter == null) {
            LOGGER.warning("event=MATCH_CONFIRMED_DATA_ERROR details=\"MATCH_CONFIRMED sem inviter ou accepter\"");
            return;
        }

        GameRoom room = new GameRoom(inviter, accepter);

        activeGames.put(room.getGameId(), room);
        playerGameMap.put(inviter,  room.getGameId());
        playerGameMap.put(accepter, room.getGameId());

        gameRepository.recordGameStart(room);

        LOGGER.info(String.format("event=GAME_STARTED details=\"Partida iniciada: %s | %s (X) vs %s (O)\"",
                room.getGameId(), inviter, accepter));
        notifyGameStarted(room, inviter, accepter);

        if (eventBus != null) {
            eventBus.publish(new GameEvent(EventType.GAME_STARTED, room.getGameId(), room));
        }
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
        if (room == null) {
            sendErrorTo(username, "Você não está em nenhuma partida");
            return;
        }

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
            String reason = (room.getResult() == GameRoom.GameResult.DRAW) ? "DRAW" : "WIN";
            broadcastGameOver(room, reason);
            cleanupGame(room);
        }
    }

    private void handleForfeit(GameEvent event) {
        String username = event.getSource();
        GameRoom room   = getRoomOf(username);
        if (room == null) return;
        room.forfeit(username);
        broadcastGameOver(room, "FORFEIT");
        cleanupGame(room);
    }

    private void handleDisconnect(GameEvent event) {
        String username = event.getSource();
        GameRoom room   = getRoomOf(username);
        if (room == null) return;
        room.forfeit(username);
        broadcastGameOver(room, "OPPONENT_DISCONNECTED");
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

    private void broadcastGameOver(GameRoom room, String reason) {
        gameRepository.recordGameEnd(room);

        JsonObject p = new JsonObject();
        p.addProperty("gameId",  room.getGameId());
        p.addProperty("result",  room.getResult().name());
        p.addProperty("winner",  room.getWinner() != null ? room.getWinner() : "DRAW");
        p.addProperty("reason",  reason);
        p.add("board", gson.toJsonTree(room.getBoard()));

        Message msg = new Message(MessageType.GAME_OVER, SERVER, gson.toJson(p));
        sendTo(room.getPlayerX(), msg);
        sendTo(room.getPlayerO(), msg);
    }

    private void cleanupGame(GameRoom room) {
        activeGames.remove(room.getGameId());
        playerGameMap.remove(room.getPlayerX());
        playerGameMap.remove(room.getPlayerO());
        LOGGER.info(String.format("event=GAME_CLOSED details=\"Sala encerrada: %s\"", room.getGameId()));

        if (eventBus != null) {
            eventBus.publish(new GameEvent(EventType.GAME_OVER, room.getGameId(), room));
        }
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

    public int getActiveGameCount() { 
        return activeGames.size(); 
    }
}