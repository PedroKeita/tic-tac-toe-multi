package com.tictactoe;

import com.tictactoe.auth.AuthService;
import com.tictactoe.database.Database;
import com.tictactoe.database.GameRepository;
import com.tictactoe.database.SchemaInitializer;
import com.tictactoe.events.EventBus;
import com.tictactoe.game.GameManager;
import com.tictactoe.lobby.LobbyManager;
import com.tictactoe.logging.StructuredLogFormatter;
import com.tictactoe.server.GameServer;

import java.util.logging.Logger;

public class App {

    private static final Logger LOGGER = Logger.getLogger(App.class.getName());
    private static final int DEFAULT_PORT = 8080;

    public static void main(String[] args) {
        // Inicializa logs estruturados em linha unica conforme RNF04.3
        StructuredLogFormatter.install();

        int port = resolvePort(args);
        LOGGER.info(String.format("event=SERVER_STARTING details=\"Iniciando TicTacToe Server na porta %d...\"", port));

        // Banco de dados e schema
        Database database = Database.getInstance();
        new SchemaInitializer(database).initialize();
        LOGGER.info("event=DATABASE_READY details=\"Banco de dados SQLite pronto\"");

        // Repositorio e Services
        GameRepository gameRepository = new GameRepository(database);
        EventBus     eventBus    = new EventBus();
        AuthService  authService = new AuthService(database);
        LobbyManager lobby       = new LobbyManager();
        GameManager  gameManager = new GameManager(lobby, gameRepository);

        // Lobby e GameManager: escutam os eventos publicados pelo EventBus
        lobby.registerEventHandlers(eventBus);
        gameManager.registerEventHandlers(eventBus);
        LOGGER.info("event=SERVICES_INITIALIZED details=\"Services inicializados com sucesso\"");

        // Servidor WebSocket com timeout e reuseAddr
        GameServer server = new GameServer(port, eventBus, authService);
        server.start();
        LOGGER.info(String.format("event=SERVER_RUNNING details=\"Servidor rodando e pronto para conexoes na porta %d\"", port));

        // Shutdown gracioso: encerra o servidor e o EventBus
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOGGER.info("event=SERVER_SHUTDOWN_START details=\"Encerrando servidor graciosa e ordenadamente...\"");
            try {
                server.stop();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                LOGGER.warning("event=SERVER_SHUTDOWN_INTERRUPTED details=\"" + e.getMessage() + "\"");
            }
            eventBus.shutdown();
            LOGGER.info("event=SERVER_STOPPED details=\"Servidor encerrado\"");
        }));
    }

    private static int resolvePort(String[] args) {
        if (args != null && args.length > 0 && args[0] != null && !args[0].trim().isEmpty()) {
            try {
                return Integer.parseInt(args[0].trim());
            } catch (NumberFormatException e) {
                LOGGER.warning(String.format("event=INVALID_PORT_ARG details=\"Argumento de porta invalido: %s. Usando padrao.\" ", args[0]));
            }
        }
        String envPort = System.getenv("PORT");
        if (envPort != null && !envPort.trim().isEmpty()) {
            try {
                return Integer.parseInt(envPort.trim());
            } catch (NumberFormatException e) {
                LOGGER.warning(String.format("event=INVALID_PORT_ENV details=\"Variavel de ambiente PORT invalida: %s. Usando padrao.\" ", envPort));
            }
        }
        return DEFAULT_PORT;
    }
}