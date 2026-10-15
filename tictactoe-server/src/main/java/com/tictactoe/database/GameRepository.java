package com.tictactoe.database;

import com.tictactoe.game.GameRoom;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Repositorio de persistencia direta para partidas e auditoria de eventos em server_logs.
 * Implementa padrao KISS e DRY com try-with-resources.
 */
public class GameRepository {

    private static final Logger LOGGER = Logger.getLogger(GameRepository.class.getName());
    private final Database database;

    public GameRepository() {
        this(Database.getInstance());
    }

    public GameRepository(Database database) {
        this.database = database != null ? database : Database.getInstance();
    }

    /**
     * Registra o inicio de uma partida no banco de dados.
     */
    public void recordGameStart(GameRoom room) {
        if (room == null) return;

        String sql = "INSERT INTO games (id, player1, player2, status, board) VALUES (?, ?, ?, 'IN_PROGRESS', ?);";
        try (Connection conn = database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, room.getGameId());
            stmt.setString(2, room.getPlayerX());
            stmt.setString(3, room.getPlayerO());
            stmt.setString(4, room.getBoardAsString());
            stmt.executeUpdate();

            logEvent("GAME_STARTED", room.getPlayerX(), room.getGameId(),
                    String.format("Partida iniciada: %s (X) vs %s (O)", room.getPlayerX(), room.getPlayerO()));

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, String.format("event=DB_RECORD_START_ERROR details=\"Falha ao registrar inicio da partida %s\"", room.getGameId()), e);
        }
    }

    /**
     * Atualiza o registro da partida ao encerrar, gravando vencedor, resultado e estado final do tabuleiro.
     */
    public void recordGameEnd(GameRoom room) {
        if (room == null) return;

        String updateSql = "UPDATE games SET winner = ?, result = ?, board = ?, status = 'FINISHED', finished_at = CURRENT_TIMESTAMP WHERE id = ?;";
        try (Connection conn = database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(updateSql)) {

            String resultStr = room.getResult() != null ? room.getResult().name() : "DRAW";
            stmt.setString(1, room.getWinner());
            stmt.setString(2, resultStr);
            stmt.setString(3, room.getBoardAsString());
            stmt.setString(4, room.getGameId());

            int updated = stmt.executeUpdate();
            if (updated == 0) {
                // Caso a partida nao tenha sido persistida no start por qualquer motivo
                String insertSql = "INSERT INTO games (id, player1, player2, winner, result, board, status, finished_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, 'FINISHED', CURRENT_TIMESTAMP);";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setString(1, room.getGameId());
                    insertStmt.setString(2, room.getPlayerX());
                    insertStmt.setString(3, room.getPlayerO());
                    insertStmt.setString(4, room.getWinner());
                    insertStmt.setString(5, resultStr);
                    insertStmt.setString(6, room.getBoardAsString());
                    insertStmt.executeUpdate();
                }
            }

            logEvent("GAME_OVER", room.getWinner(), room.getGameId(),
                    String.format("Partida finalizada. Resultado: %s, Vencedor: %s", resultStr, room.getWinner()));

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, String.format("event=DB_RECORD_END_ERROR details=\"Falha ao registrar fim da partida %s\"", room.getGameId()), e);
        }
    }

    /**
     * Grava um evento padronizado na tabela server_logs.
     */
    public void logEvent(String eventType, String username, String gameId, String message) {
        String sql = "INSERT INTO server_logs (event_type, username, game_id, message) VALUES (?, ?, ?, ?);";
        try (Connection conn = database.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, eventType);
            stmt.setString(2, username);
            stmt.setString(3, gameId);
            stmt.setString(4, message);
            stmt.executeUpdate();

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, String.format("event=DB_LOG_EVENT_ERROR details=\"Falha ao registrar log de evento: %s\"", eventType), e);
        }
    }
}

