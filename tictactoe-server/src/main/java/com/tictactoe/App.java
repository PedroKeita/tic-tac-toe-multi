package com.tictactoe;

import com.tictactoe.auth.AuthService;
import com.tictactoe.database.Database;
import com.tictactoe.database.SchemaInitializer;
import com.tictactoe.events.EventBus;
import com.tictactoe.server.GameServer;

import java.util.logging.Logger;

public class App {

    private static final Logger LOGGER = Logger.getLogger(App.class.getName());
    private static final int PORT = 8080;

    public static void main(String[] args) {

        LOGGER.info("Iniciando TicTacToe Server...");

        // Banco de dados
        Database database = Database.getInstance();
        new SchemaInitializer(database).initialize();
        LOGGER.info("Banco de dados pronto");

        // Services
        AuthService authService = new AuthService(database);
        EventBus eventBus = new EventBus();
        LOGGER.info("Serviços inicializados");

        // Server WebSocket
        GameServer server = new GameServer(PORT, eventBus, authService);
        server.start();
        LOGGER.info("Servidor rodando na porta " + PORT);

        // Encerra o EventBus ao desligar
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            eventBus.shutdown();
            LOGGER.info("Servidor encerrado");
        }));
    }
}