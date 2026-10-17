package com.tictactoe.auth;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.tictactoe.database.Database;
import com.tictactoe.database.GameRepository;
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
    private final GameRepository gameRepository;
    private final Gson gson;

    public AuthService() {
        this(Database.getInstance());
    }

    public AuthService(Database database) {
        this.database = database != null ? database : Database.getInstance();
        this.gameRepository = new GameRepository(this.database);
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

            LOGGER.info(String.format("event=USER_REGISTERED details=\"Usuario registrado com sucesso: %s\"", trimmedUsername));
            gameRepository.logEvent("REGISTER_SUCCESS", trimmedUsername, null, "Usuario registrado com sucesso");

            JsonObject payload = new JsonObject();
            payload.addProperty("username", trimmedUsername);
            payload.addProperty("message", "User registered successfully");

            return new Message(MessageType.REGISTER_SUCCESS, SERVER_SENDER, gson.toJson(payload));

        } catch (SQLException e) {
            if (isDuplicateConstraintViolation(e)) {
                LOGGER.warning(String.format("event=REGISTER_DUPLICATE details=\"Registro recusado - username duplicado: %s\"", trimmedUsername));
                return createErrorResponse(MessageType.REGISTER_ERROR, "Username already exists");
            }
            LOGGER.log(Level.SEVERE, String.format("event=REGISTER_DB_ERROR details=\"Erro inesperado ao registrar usuario: %s\"", trimmedUsername), e);
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
                LOGGER.warning(String.format("event=LOGIN_FAILED details=\"Login falhou - usuario inexistente: %s\"", trimmedUsername));
                gameRepository.logEvent("LOGIN_FAILED", trimmedUsername, null, "Tentativa de login para usuario inexistente");
                return createErrorResponse(MessageType.LOGIN_ERROR, "Invalid username or password");
            }

            String storedPasswordHash = rs.getString("password_hash");

            if (!PasswordUtils.verifyPassword(password, storedPasswordHash)) {
                LOGGER.warning(String.format("event=LOGIN_FAILED details=\"Login falhou - senha incorreta para: %s\"", trimmedUsername));
                gameRepository.logEvent("LOGIN_FAILED", trimmedUsername, null, "Tentativa de login com senha incorreta");
                return createErrorResponse(MessageType.LOGIN_ERROR, "Invalid username or password");
            }

            String sessionToken = UUID.randomUUID().toString();
            LOGGER.info(String.format("event=LOGIN_SUCCESS details=\"Usuario autenticado com sucesso: %s\"", trimmedUsername));
            gameRepository.logEvent("LOGIN_SUCCESS", trimmedUsername, null, "Login realizado com sucesso");

            JsonObject payload = new JsonObject();
            payload.addProperty("username", trimmedUsername);
            payload.addProperty("token", sessionToken);

            return new Message(MessageType.LOGIN_SUCCESS, SERVER_SENDER, gson.toJson(payload));

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, String.format("event=LOGIN_DB_ERROR details=\"Erro de banco durante login: %s\"", trimmedUsername), e);
            gameRepository.logEvent("LOGIN_ERROR", trimmedUsername, null, "Erro de banco de dados durante login");
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