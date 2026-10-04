package com.tictactoe.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Database {

    private static final Logger LOGGER = Logger.getLogger(Database.class.getName());
    private static final String DEFAULT_DB_URL = "jdbc:sqlite:tictactoe.db";

    private static volatile Database instance;
    private final String dbUrl;
    private final boolean inMemory;
    private Connection sharedConnection; 

    // Recupera a instância Singleton usando o banco padrão.
    private Database(String dbUrl) {
        this.dbUrl = (dbUrl != null && !dbUrl.trim().isEmpty()) ? dbUrl : DEFAULT_DB_URL;
        this.inMemory = this.dbUrl.contains(":memory:");
        loadDriver();
        if (inMemory) {
            initSharedConnection();
        }
    }

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
            // fecha conexão anterior se existir
            if (instance != null && instance.sharedConnection != null) {
                try {
                    instance.sharedConnection.close();
                } catch (SQLException e) {
                    LOGGER.warning("Erro ao fechar conexão anterior: " + e.getMessage());
                }
            }
            instance = new Database(dbUrl);
            return instance;
        }
    }

    private void initSharedConnection() {
        try {
            sharedConnection = DriverManager.getConnection(dbUrl);
            LOGGER.info("Conexão compartilhada em memória criada");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Falha ao criar conexão em memória", e);
            throw new RuntimeException("Não foi possível criar conexão em memória", e);
        }
    }

    private void loadDriver() {
        try {
            Class.forName("org.sqlite.JDBC");
        } catch (ClassNotFoundException e) {
            LOGGER.log(Level.SEVERE, "SQLite JDBC Driver não encontrado", e);
            throw new IllegalStateException("SQLite JDBC Driver indisponível", e);
        }
    }

    // Obtém uma nova conexão com o banco SQLite.
    // Deve ser fechada pelo chamador (preferencialmente via try-with-resources).
    public Connection getConnection() throws SQLException {
        if (inMemory && sharedConnection != null) {
            return sharedConnection; 
        }
        return DriverManager.getConnection(dbUrl);
    }

    public String getDbUrl() {
        return dbUrl;
    }

    public boolean isInMemory() {
        return inMemory;
    }
}