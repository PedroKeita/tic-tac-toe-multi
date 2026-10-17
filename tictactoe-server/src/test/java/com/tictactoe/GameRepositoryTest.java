package com.tictactoe;

import com.tictactoe.database.Database;
import com.tictactoe.database.GameRepository;
import com.tictactoe.database.SchemaInitializer;
import com.tictactoe.game.GameRoom;
import org.junit.Before;
import org.junit.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.junit.Assert.*;

public class GameRepositoryTest {

    private Database testDatabase;
    private GameRepository gameRepository;

    @Before
    public void setUp() {
        testDatabase = Database.init("jdbc:sqlite::memory:");
        new SchemaInitializer(testDatabase).initialize();
        gameRepository = new GameRepository(testDatabase);
    }

    @Test
    public void testRecordGameStartAndEnd() throws SQLException {
        GameRoom room = new GameRoom("playerX", "playerO");
        gameRepository.recordGameStart(room);

        // Verifica insercao inicial em games
        try (Connection conn = testDatabase.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM games WHERE id = ?")) {
            stmt.setString(1, room.getGameId());
            try (ResultSet rs = stmt.executeQuery()) {
                assertTrue("Partida deve existir na tabela games", rs.next());
                assertEquals("playerX", rs.getString("player1"));
                assertEquals("playerO", rs.getString("player2"));
                assertEquals("IN_PROGRESS", rs.getString("status"));
            }
        }

        // Simula vitoria de playerX e finaliza
        room.makeMove("playerX", 0);
        room.makeMove("playerO", 3);
        room.makeMove("playerX", 1);
        room.makeMove("playerO", 4);
        room.makeMove("playerX", 2); // Linha superior completa -> Vitoria de playerX

        assertTrue("Jogo deve estar finalizado", room.isGameOver());
        assertEquals("playerX", room.getWinner());

        gameRepository.recordGameEnd(room);

        // Verifica atualizacao em games
        try (Connection conn = testDatabase.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM games WHERE id = ?")) {
            stmt.setString(1, room.getGameId());
            try (ResultSet rs = stmt.executeQuery()) {
                assertTrue(rs.next());
                assertEquals("playerX", rs.getString("winner"));
                assertEquals("PLAYER_X_WIN", rs.getString("result"));
                assertEquals("FINISHED", rs.getString("status"));
                assertNotNull(rs.getString("finished_at"));
            }
        }
    }

    @Test
    public void testLogEvent() throws SQLException {
        gameRepository.logEvent("TEST_EVENT", "testUser", "testGameId", "Mensagem de teste");

        try (Connection conn = testDatabase.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM server_logs WHERE event_type = ?")) {
            stmt.setString(1, "TEST_EVENT");
            try (ResultSet rs = stmt.executeQuery()) {
                assertTrue("Log deve existir na tabela server_logs", rs.next());
                assertEquals("testUser", rs.getString("username"));
                assertEquals("testGameId", rs.getString("game_id"));
                assertEquals("Mensagem de teste", rs.getString("message"));
                assertNotNull(rs.getString("created_at"));
            }
        }
    }
}

