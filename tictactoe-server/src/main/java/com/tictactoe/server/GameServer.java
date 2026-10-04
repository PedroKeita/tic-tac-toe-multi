package com.tictactoe.server;

import com.tictactoe.events.EventBus;
import com.tictactoe.auth.AuthService;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

public class GameServer extends WebSocketServer {

    private static final Logger LOGGER = Logger.getLogger(GameServer.class.getName());

    private final EventBus eventBus;
    private final AuthService authService;

    // Mapa de conexão --> handler do cliente
    private final Map<WebSocket, ClientHandler> clients;

    public GameServer(int port, EventBus eventBus, AuthService authService) {
        super(new InetSocketAddress(port));
        this.eventBus = eventBus;
        this.authService = authService;
        this.clients = new ConcurrentHashMap<>();
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        LOGGER.info("Nova conexão: " + conn.getRemoteSocketAddress());

        ClientHandler handler = new ClientHandler(conn, eventBus, authService);
        clients.put(conn, handler);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        ClientHandler handler = clients.get(conn);

        if (handler == null) {
            LOGGER.warning("Mensagem recebida de conexão sem handler: " + conn.getRemoteSocketAddress());
            return;
        }

        handler.handleMessage(message);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        LOGGER.info("Conexão encerrada: " + conn.getRemoteSocketAddress() + " — " + reason);

        ClientHandler handler = clients.remove(conn);
        if (handler != null) {
            handler.onDisconnect();
        }
    }

    @Override
    public void onError(WebSocket conn, Exception e) {
        LOGGER.log(Level.SEVERE, "Erro na conexão: " + 
            (conn != null ? conn.getRemoteSocketAddress() : "desconhecido"), e);
    }

    @Override
    public void onStart() {
        LOGGER.info("Servidor WebSocket iniciado na porta " + getPort());
    }

    public int getClientCount() {
        return clients.size();
    }
}