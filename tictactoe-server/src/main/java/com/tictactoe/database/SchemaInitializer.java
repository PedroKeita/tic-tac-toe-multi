package com.tictactoe.database;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Level;
import java.util.logging.Logger;

public class SchemaInitializer {

    private static final Logger LOGGER = Logger.getLogger(SchemaInitializer.class.getName());

    private final Database database;

    public SchemaInitializer(Database database) {
        this.database = database;
    }

    public void initialize() {
        try (Connection conn = database.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.execute(createUsersTable());
            stmt.execute(createGamesTable());
            stmt.execute(createServerLogsTable());

            LOGGER.info("event=SCHEMA_INITIALIZED details=\"Schema inicializado com sucesso\"");

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "event=SCHEMA_INIT_ERROR details=\"Falha ao inicializar schema\"", e);
            throw new RuntimeException("Não foi possível inicializar o banco de dados", e);
        }
    }

    private String createUsersTable() {
        return "CREATE TABLE IF NOT EXISTS users ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "username TEXT UNIQUE NOT NULL, "
                + "password_hash TEXT NOT NULL, "
                + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
                + ");";
    }

    private String createGamesTable() {
        return "CREATE TABLE IF NOT EXISTS games ("
                + "id TEXT PRIMARY KEY, "
                + "player1 TEXT NOT NULL, "
                + "player2 TEXT NOT NULL, "
                + "winner TEXT, "
                + "result TEXT CHECK(result IN ('PLAYER_X_WIN', 'PLAYER_O_WIN', 'DRAW', 'FORFEIT')), "
                + "board TEXT NOT NULL DEFAULT '---------', "
                + "status TEXT CHECK(status IN ('WAITING', 'IN_PROGRESS', 'FINISHED')), "
                + "started_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
                + "finished_at DATETIME, "
                + "FOREIGN KEY (player1) REFERENCES users(username), "
                + "FOREIGN KEY (player2) REFERENCES users(username)"
                + ");";
    }

    private String createServerLogsTable() {
        return "CREATE TABLE IF NOT EXISTS server_logs ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "event_type TEXT NOT NULL, "
                + "username TEXT, "
                + "game_id TEXT, "
                + "message TEXT, "
                + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
                + "FOREIGN KEY (username) REFERENCES users(username), "
                + "FOREIGN KEY (game_id) REFERENCES games(id)"
                + ");";
    }
}