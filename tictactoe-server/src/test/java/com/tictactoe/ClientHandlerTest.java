package com.tictactoe;

import com.google.gson.Gson;
import com.tictactoe.auth.AuthService;
import com.tictactoe.database.Database;
import com.tictactoe.database.SchemaInitializer;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.lobby.LobbyManager;
import com.tictactoe.server.ClientHandler;
import com.tictactoe.shared.Message;
import com.tictactoe.shared.MessageType;
import org.java_websocket.WebSocket;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import java.lang.reflect.Proxy;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.Assert.*;

public class ClientHandlerTest {

    private EventBus eventBus;
    private LobbyManager lobbyManager;
    private AuthService authService;
    private Gson gson;

    @Before
    public void setUp() {
        eventBus = new EventBus();
        lobbyManager = new LobbyManager();
        lobbyManager.registerEventHandlers(eventBus);

        Database db = Database.init("jdbc:sqlite::memory:");
        new SchemaInitializer(db).initialize();
        authService = new AuthService(db);
        gson = new Gson();
    }

    @After
    public void tearDown() {
        if (eventBus != null) {
            eventBus.shutdown();
        }
    }

    private WebSocket createFakeWebSocket(List<String> messageLog, AtomicBoolean openRef) {
        return (WebSocket) Proxy.newProxyInstance(
            WebSocket.class.getClassLoader(),
            new Class<?>[]{WebSocket.class},
            (proxy, method, args) -> {
                String name = method.getName();
                if ("isOpen".equals(name)) return openRef.get();
                if ("send".equals(name) && args != null && args.length == 1) {
                    messageLog.add((String) args[0]);
                    return null;
                }
                if ("close".equals(name)) {
                    openRef.set(false);
                    return null;
                }
                if ("getRemoteSocketAddress".equals(name)) {
                    return new InetSocketAddress("127.0.0.1", 9090);
                }
                if ("toString".equals(name)) return "FakeWebSocket";
                if ("hashCode".equals(name)) return 1;
                if ("equals".equals(name)) return proxy == (args != null && args.length > 0 ? args[0] : null);
                return null;
            }
        );
    }

    @Test
    public void testRegisterValidationFailures() {
        List<String> log = new CopyOnWriteArrayList<>();
        AtomicBoolean open = new AtomicBoolean(true);
        ClientHandler handler = new ClientHandler(createFakeWebSocket(log, open), eventBus, authService, lobbyManager);

        // Payload nulo
        Message msgNull = new Message(MessageType.REGISTER, null, null);
        handler.handleMessage(gson.toJson(msgNull));

        Message last = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.REGISTER_ERROR, last.getType());

        // Username faltando
        Message msgMissing = new Message(MessageType.REGISTER, null, "{\"password\":\"123\"}");
        handler.handleMessage(gson.toJson(msgMissing));

        last = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.REGISTER_ERROR, last.getType());
    }

    @Test
    public void testLoginValidationFailures() {
        List<String> log = new CopyOnWriteArrayList<>();
        AtomicBoolean open = new AtomicBoolean(true);
        ClientHandler handler = new ClientHandler(createFakeWebSocket(log, open), eventBus, authService, lobbyManager);

        // Payload vazio
        Message msgEmpty = new Message(MessageType.LOGIN, null, "   ");
        handler.handleMessage(gson.toJson(msgEmpty));

        Message last = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.LOGIN_ERROR, last.getType());

        // Password faltando
        Message msgMissing = new Message(MessageType.LOGIN, null, "{\"username\":\"alice\"}");
        handler.handleMessage(gson.toJson(msgMissing));

        last = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.LOGIN_ERROR, last.getType());
    }

    @Test
    public void testLoginSuccessAndDuplicateLoginRejection() {
        // Registra alice
        authService.register("alice", "pass123");

        List<String> log = new CopyOnWriteArrayList<>();
        AtomicBoolean open = new AtomicBoolean(true);
        ClientHandler handler = new ClientHandler(createFakeWebSocket(log, open), eventBus, authService, lobbyManager);

        // Login inicial
        Message loginMsg = new Message(MessageType.LOGIN, null, "{\"username\":\"  alice  \",\"password\":\"pass123\"}");
        handler.handleMessage(gson.toJson(loginMsg));

        Message response = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.LOGIN_SUCCESS, response.getType());
        assertTrue(handler.isAuthenticated());
        assertEquals("alice", handler.getUsername());

        // Segunda tentativa de login na MESMA conexão
        handler.handleMessage(gson.toJson(loginMsg));
        Message dupResponse = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.LOGIN_ERROR, dupResponse.getType());
        assertTrue(dupResponse.getPayload().contains("já está autenticado nesta sessão"));
    }

    @Test
    public void testRejectLoginWhenAlreadyOnlineInLobby() {
        authService.register("alice", "pass123");

        // Alice entra no Lobby
        List<String> log1 = new CopyOnWriteArrayList<>();
        AtomicBoolean open1 = new AtomicBoolean(true);
        ClientHandler h1 = new ClientHandler(createFakeWebSocket(log1, open1), eventBus, authService, lobbyManager);
        lobbyManager.addPlayer("alice", h1);

        // Outra conexão tenta autenticar com o mesmo username "alice"
        List<String> log2 = new CopyOnWriteArrayList<>();
        AtomicBoolean open2 = new AtomicBoolean(true);
        ClientHandler h2 = new ClientHandler(createFakeWebSocket(log2, open2), eventBus, authService, lobbyManager);

        Message loginMsg = new Message(MessageType.LOGIN, null, "{\"username\":\"alice\",\"password\":\"pass123\"}");
        h2.handleMessage(gson.toJson(loginMsg));

        Message response = gson.fromJson(log2.get(log2.size() - 1), Message.class);
        assertEquals(MessageType.LOGIN_ERROR, response.getType());
        assertTrue(response.getPayload().contains("já está online"));
        assertFalse(h2.isAuthenticated());
    }

    @Test
    public void testUnauthenticatedActionsBlocked() {
        List<String> log = new CopyOnWriteArrayList<>();
        AtomicBoolean open = new AtomicBoolean(true);
        ClientHandler handler = new ClientHandler(createFakeWebSocket(log, open), eventBus, authService, lobbyManager);

        Message inviteMsg = new Message(MessageType.INVITE, null, "{\"to\":\"bob\"}");
        handler.handleMessage(gson.toJson(inviteMsg));

        Message response = gson.fromJson(log.get(log.size() - 1), Message.class);
        assertEquals(MessageType.ERROR, response.getType());
        assertTrue(response.getPayload().contains("Acesso não autorizado"));
    }

    @Test
    public void testDisconnectCleansStateWithoutDuplicateLogoutEvent() throws InterruptedException {
        authService.register("alice", "pass123");

        List<String> log = new CopyOnWriteArrayList<>();
        AtomicBoolean open = new AtomicBoolean(true);
        ClientHandler handler = new ClientHandler(createFakeWebSocket(log, open), eventBus, authService, lobbyManager);

        Message loginMsg = new Message(MessageType.LOGIN, null, "{\"username\":\"alice\",\"password\":\"pass123\"}");
        handler.handleMessage(gson.toJson(loginMsg));
        assertTrue(handler.isAuthenticated());

        CountDownLatch logoutLatch = new CountDownLatch(1);
        List<GameEvent> logoutEvents = new CopyOnWriteArrayList<>();
        eventBus.subscribe(EventType.USER_LOGGED_OUT, e -> {
            logoutEvents.add(e);
            logoutLatch.countDown();
        });

        // Executa DISCONNECT
        Message disconnectMsg = new Message(MessageType.DISCONNECT, null, null);
        handler.handleMessage(gson.toJson(disconnectMsg));

        assertTrue(logoutLatch.await(1, TimeUnit.SECONDS));
        assertFalse(handler.isAuthenticated());
        assertNull(handler.getUsername());
        assertFalse(open.get()); // Conexao foi fechada

        // Simula onClose disparado em seguida pela biblioteca websocket
        handler.onDisconnect();

        Thread.sleep(100);
        assertEquals("Não deve disparar evento de logout duplicado", 1, logoutEvents.size());
    }
}

