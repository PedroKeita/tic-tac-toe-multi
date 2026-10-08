package com.tictactoe;

import com.tictactoe.auth.AuthService;
import com.tictactoe.database.Database;
import com.tictactoe.database.SchemaInitializer;
import com.tictactoe.events.EventBus;
import com.tictactoe.game.GameManager;
import com.tictactoe.lobby.LobbyManager;
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
        EventBus     eventBus    = new EventBus();
        AuthService  authService = new AuthService(database);
        LobbyManager lobby       = new LobbyManager();
        GameManager  gameManager = new GameManager(lobby);

         // Lobby: escuta os eventos de login/logout/convites publicados pelo ClientHandler
        lobby.registerEventHandlers(eventBus);
        gameManager.registerEventHandlers(eventBus);
        LOGGER.info("Services inicializados");

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