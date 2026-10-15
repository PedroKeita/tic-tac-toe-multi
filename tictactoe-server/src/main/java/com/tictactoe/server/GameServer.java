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
        setReuseAddr(true);
        setConnectionLostTimeout(10);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
        LOGGER.info(String.format("event=WS_CLIENT_CONNECTED details=\"Nova conexao de %s\"",
                conn != null ? conn.getRemoteSocketAddress() : "desconhecido"));

        ClientHandler handler = new ClientHandler(conn, eventBus, authService);
        clients.put(conn, handler);
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        ClientHandler handler = clients.get(conn);

        if (handler == null) {
            LOGGER.warning(String.format("event=WS_MESSAGE_ORPHAN details=\"Mensagem recebida de conexao sem handler: %s\"",
                    conn != null ? conn.getRemoteSocketAddress() : "desconhecido"));
            return;
        }

        handler.handleMessage(message);
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
        LOGGER.info(String.format("event=WS_CLIENT_CLOSED details=\"Conexao encerrada: %s (codigo=%d, motivo=%s, remote=%s)\"",
                conn != null ? conn.getRemoteSocketAddress() : "desconhecido", code, reason, remote));

        ClientHandler handler = clients.remove(conn);
        if (handler != null) {
            handler.onDisconnect();
        }
    }

    @Override
    public void onError(WebSocket conn, Exception e) {
        LOGGER.log(Level.SEVERE, String.format("event=WS_ERROR details=\"Erro na conexao: %s\"",
                conn != null ? conn.getRemoteSocketAddress() : "desconhecido"), e);
    }

    @Override
    public void onStart() {
        LOGGER.info(String.format("event=WS_SERVER_STARTED details=\"Servidor WebSocket escutando na porta %d (connectionLostTimeout=10s, reuseAddr=true)\"", getPort()));
    }

    public int getClientCount() {
        return clients.size();
    }
}