package com.tictactoe.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Database {

    private static final Logger LOGGER = Logger.getLogger(Database.class.getName());
    private static final String DEFAULT_DB_URL = "jdbc:sqlite:tictactoe.db";

    private static volatile Database instance;
    private final String dbUrl;

    // Construtor privado para evitar instanciação direta.
    
    private Database(String dbUrl) {
        this.dbUrl = (dbUrl != null && !dbUrl.trim().isEmpty()) ? dbUrl : DEFAULT_DB_URL;
        loadDriver();
        initSchema();
    }

    // Recupera a instância Singleton usando o banco padrão.
    public static Database getInstance() {
        if (instance == null) {
            synchronized (Database.class) {
                if (instance == null) {
                    instance = new Database(DEFAULT_DB_URL);
                }
            }
        }
        return instance;
    }

    // Inicializa o banco com URL customizada (útil para testes em memória).
    public static Database init(String dbUrl) {
        synchronized (Database.class) {
            instance = new Database(dbUrl);
            return instance;
        }
    }

    // Helper estático para inicialização do schema padrão.
    public static void init() {
        getInstance();
    }

    private void loadDriver() {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            LOGGER.log(Level.SEVERE, "SQLite JDBC Driver não encontrado no classpath", e);
            throw new IllegalStateException("SQLite JDBC Driver indisponível", e);
        }
    }

    // Garante a criação da tabela users caso não exista.
    private void initSchema() {
        String createUsersTableSql = "CREATE TABLE IF NOT EXISTS users ("
                + "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                + "username TEXT UNIQUE NOT NULL, "
                + "password_hash TEXT NOT NULL"
                + ");";

        try (Connection conn = getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(createUsersTableSql);
            LOGGER.info("Database schema inicializado com sucesso (" + dbUrl + ")");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Falha ao inicializar o schema do banco", e);
            throw new RuntimeException("Não foi possível inicializar o banco de dados", e);
        }
    }

    // Obtém uma nova conexão com o banco SQLite.
    // Deve ser fechada pelo chamador (preferencialmente via try-with-resources).
    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dbUrl);
    }

    public String getDbUrl() {
        return dbUrl;
    }
}
