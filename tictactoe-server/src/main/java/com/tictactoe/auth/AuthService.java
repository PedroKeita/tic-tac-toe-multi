package com.tictactoe.auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.database.Database;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;
import com.tictactoe.shared.interfaces.IAuthService;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AuthService implements IAuthService {

    private static final Logger LOGGER = Logger.getLogger(AuthService.class.getName());
    private static final String SERVER_SENDER = "SERVER";
    private static final int SQLITE_CONSTRAINT_ERROR_CODE = 19;

    private final Database database;
    private final Gson gson;

    public AuthService() {
        this(Database.getInstance());
    }

    public AuthService(Database database) {
        this.database = database != null ? database : Database.getInstance();
        this.gson = new Gson();
    }

    // Registro de novo usuário
    @Override
    public Message register(String username, String password) {
        if (!isValidCredentialInput(username, password)) {
            return createErrorResponse(MessageType.REGISTER_ERROR, "Username e password não podem ser vazios");
        }

        String trimmedUsername = username.trim();
        String passwordHash = PasswordUtils.hashPassword(password);
        String insertSql = "INSERT INTO users (username, password_hash) VALUES (?, ?);";

        Connection conn = null;
        PreparedStatement stmt = null;

        try {
            conn = database.getConnection();
            stmt = conn.prepareStatement(insertSql);
            stmt.setString(1, trimmedUsername);
            stmt.setString(2, passwordHash);
            stmt.executeUpdate();

            LOGGER.info("Usuário registrado com sucesso: " + trimmedUsername);

            JsonObject payload = new JsonObject();
            payload.addProperty("username", trimmedUsername);
            payload.addProperty("message", "User registered successfully");

            return new Message(MessageType.REGISTER_SUCCESS, SERVER_SENDER, gson.toJson(payload));

        } catch (SQLException e) {
            if (isDuplicateConstraintViolation(e)) {
                LOGGER.warning("Registro recusado - username duplicado: " + trimmedUsername);
                return createErrorResponse(MessageType.REGISTER_ERROR, "Username already exists");
            }
            LOGGER.log(Level.SEVERE, "Erro inesperado ao registrar usuário: " + trimmedUsername, e);
            return createErrorResponse(MessageType.REGISTER_ERROR, "Database error during registration");
        } finally {
            closeQuietly(stmt);
            closeConnectionIfNeeded(conn);
        }
    }

    // Autenticação de usuário
    @Override
    public Message login(String username, String password) {
        if (!isValidCredentialInput(username, password)) {
            return createErrorResponse(MessageType.LOGIN_ERROR, "Username e password não podem ser vazios");
        }

        String trimmedUsername = username.trim();
        String selectSql = "SELECT password_hash FROM users WHERE username = ?;";

        Connection conn = null;
        PreparedStatement stmt = null;
        ResultSet rs = null;

        try {
            conn = database.getConnection();
            stmt = conn.prepareStatement(selectSql);
            stmt.setString(1, trimmedUsername);
            rs = stmt.executeQuery();

            if (!rs.next()) {
                LOGGER.warning("Login falhou - usuário inexistente: " + trimmedUsername);
                return createErrorResponse(MessageType.LOGIN_ERROR, "Invalid username or password");
            }

            String storedPasswordHash = rs.getString("password_hash");

            if (!PasswordUtils.verifyPassword(password, storedPasswordHash)) {
                LOGGER.warning("Login falhou - senha incorreta para: " + trimmedUsername);
                return createErrorResponse(MessageType.LOGIN_ERROR, "Invalid username or password");
            }

            String sessionToken = UUID.randomUUID().toString();
            LOGGER.info("Usuário autenticado com sucesso: " + trimmedUsername);

            JsonObject payload = new JsonObject();
            payload.addProperty("username", trimmedUsername);
            payload.addProperty("token", sessionToken);

            return new Message(MessageType.LOGIN_SUCCESS, SERVER_SENDER, gson.toJson(payload));

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Erro de banco de dados durante o login: " + trimmedUsername, e);
            return createErrorResponse(MessageType.LOGIN_ERROR, "Database error during login");
        } finally {
            closeQuietly(rs);
            closeQuietly(stmt);
            closeConnectionIfNeeded(conn);
        }
    }

    // Só fecha a conexão se NÃO for in-memory
    private void closeConnectionIfNeeded(Connection conn) {
        if (conn != null && !database.isInMemory()) {
            try {
                conn.close();
            } catch (SQLException e) {
                LOGGER.warning("Erro ao fechar conexão: " + e.getMessage());
            }
        }
    }

    private void closeQuietly(AutoCloseable resource) {
        if (resource != null) {
            try {
                resource.close();
            } catch (Exception e) {
                LOGGER.warning("Erro ao fechar recurso: " + e.getMessage());
            }
        }
    }

    private boolean isDuplicateConstraintViolation(SQLException e) {
        return e.getErrorCode() == SQLITE_CONSTRAINT_ERROR_CODE
                || (e.getMessage() != null && e.getMessage().contains("UNIQUE"));
    }

    private boolean isValidCredentialInput(String username, String password) {
        return username != null && !username.trim().isEmpty()
                && password != null && !password.trim().isEmpty();
    }

    private Message createErrorResponse(MessageType errorType, String errorMessage) {
        JsonObject payload = new JsonObject();
        payload.addProperty("message", errorMessage);
        return new Message(errorType, SERVER_SENDER, gson.toJson(payload));
    }
}