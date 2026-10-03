package com.tictactoe;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.auth.AuthService;
import com.tictactoe.auth.PasswordUtils;
import com.tictactoe.database.Database;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;
import org.junit.Before;
import org.junit.Test;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.junit.Assert.*;

public class AuthServiceTest {

    private Database testDatabase;
    private AuthService authService;
    private Gson gson;

    @Before
    public void setUp() {
        String testDbUrl = "jdbc:sqlite:file:testdb_" + System.nanoTime() + "?mode=memory&cache=shared";
        testDatabase = Database.init(testDbUrl);
        authService = new AuthService(testDatabase);
        gson = new Gson();
    }

    @Test
    public void testPasswordUtilsHashingAndVerification() {
        String plainPassword = "SecretPassword123!";
        String hash = PasswordUtils.hashPassword(plainPassword);

        assertNotNull(hash);
        assertEquals(64, hash.length());
        assertTrue(PasswordUtils.verifyPassword(plainPassword, hash));
        assertFalse(PasswordUtils.verifyPassword("WrongPassword", hash));
        assertFalse(PasswordUtils.verifyPassword(null, hash));
        assertFalse(PasswordUtils.verifyPassword(plainPassword, null));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testPasswordUtilsNullPasswordThrows() {
        PasswordUtils.hashPassword(null);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testPasswordUtilsEmptyPasswordThrows() {
        PasswordUtils.hashPassword("");
    }

    @Test
    public void testRegisterSuccess() throws SQLException {
        Message response = authService.register("player1", "pass123");

        assertEquals(MessageType.REGISTER_SUCCESS, response.getType());
        assertEquals("SERVER", response.getSender());

        JsonObject payload = gson.fromJson(response.getPayload(), JsonObject.class);
        assertEquals("player1", payload.get("username").getAsString());

        try (Connection conn = testDatabase.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE username = ?")) {
            stmt.setString(1, "player1");
            try (ResultSet rs = stmt.executeQuery()) {
                assertTrue(rs.next());
                assertEquals("player1", rs.getString("username"));
                assertNotEquals("pass123", rs.getString("password_hash"));
                assertTrue(PasswordUtils.verifyPassword("pass123", rs.getString("password_hash")));
            }
        }
    }

    @Test
    public void testRegisterDuplicateUsernameFails() {
        Message first = authService.register("uniqueUser", "passwordOne");
        assertEquals(MessageType.REGISTER_SUCCESS, first.getType());

        Message duplicate = authService.register("uniqueUser", "passwordTwo");
        assertEquals(MessageType.REGISTER_ERROR, duplicate.getType());

        JsonObject payload = gson.fromJson(duplicate.getPayload(), JsonObject.class);
        assertEquals("Username already exists", payload.get("message").getAsString());
    }

    @Test
    public void testRegisterInvalidInputs() {
        Message response1 = authService.register("", "pass");
        assertEquals(MessageType.REGISTER_ERROR, response1.getType());

        Message response2 = authService.register("user", "  ");
        assertEquals(MessageType.REGISTER_ERROR, response2.getType());

        Message response3 = authService.register(null, "pass");
        assertEquals(MessageType.REGISTER_ERROR, response3.getType());
    }

    @Test
    public void testLoginSuccess() {
        authService.register("gamer42", "superSecret");

        Message response = authService.login("gamer42", "superSecret");
        assertEquals(MessageType.LOGIN_SUCCESS, response.getType());

        JsonObject payload = gson.fromJson(response.getPayload(), JsonObject.class);
        assertEquals("gamer42", payload.get("username").getAsString());
        assertTrue(payload.has("token"));
        assertFalse(payload.get("token").getAsString().isEmpty());
    }

    @Test
    public void testLoginWrongPassword() {
        authService.register("gamer42", "superSecret");

        Message response = authService.login("gamer42", "wrongPass");
        assertEquals(MessageType.LOGIN_ERROR, response.getType());

        JsonObject payload = gson.fromJson(response.getPayload(), JsonObject.class);
        assertEquals("Invalid username or password", payload.get("message").getAsString());
    }

    @Test
    public void testLoginNonExistentUser() {
        Message response = authService.login("ghostUser", "anyPassword");
        assertEquals(MessageType.LOGIN_ERROR, response.getType());

        JsonObject payload = gson.fromJson(response.getPayload(), JsonObject.class);
        assertEquals("Invalid username or password", payload.get("message").getAsString());
    }
}

