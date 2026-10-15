package com.tictactoe;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.tictactoe.auth.AuthService;
import com.tictactoe.database.Database;
import com.tictactoe.database.SchemaInitializer;
import com.tictactoe.events.EventBus;
import com.tictactoe.events.EventType;
import com.tictactoe.events.GameEvent;
import com.tictactoe.game.GameRoom;
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
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.Assert.*;

public class LobbyManagerTest {

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

    private WebSocket createFakeWebSocket(List<String> messageLog) {
        AtomicBoolean open = new AtomicBoolean(true);
        return (WebSocket) Proxy.newProxyInstance(
            WebSocket.class.getClassLoader(),
            new Class<?>[]{WebSocket.class},
            (proxy, method, args) -> {
                String name = method.getName();
                if ("isOpen".equals(name)) return open.get();
                if ("send".equals(name) && args != null && args.length == 1) {
                    messageLog.add((String) args[0]);
                    return null;
                }
                if ("close".equals(name)) {
                    open.set(false);
                    return null;
                }
                if ("getRemoteSocketAddress".equals(name)) {
                    return new InetSocketAddress("127.0.0.1", 8080);
                }
                if ("toString".equals(name)) return "FakeWebSocket";
                if ("hashCode".equals(name)) return 1;
                if ("equals".equals(name)) return proxy == (args != null && args.length > 0 ? args[0] : null);
                return null;
            }
        );
    }

    @Test
    public void testAddAndRemovePlayer() {
        List<String> log1 = new CopyOnWriteArrayList<>();
        WebSocket ws1 = createFakeWebSocket(log1);
        ClientHandler handler1 = new ClientHandler(ws1, eventBus, authService, lobbyManager);

        lobbyManager.addPlayer("player1", handler1);

        assertTrue(lobbyManager.isOnline("player1"));
        assertEquals(LobbyManager.PlayerStatus.AVAILABLE, lobbyManager.getPlayerStatus("player1"));
        assertEquals(Collections.singletonList("player1"), lobbyManager.getOnlineUsernames());

        lobbyManager.removePlayer("player1", handler1);

        assertFalse(lobbyManager.isOnline("player1"));
        assertNull(lobbyManager.getPlayerStatus("player1"));
        assertTrue(lobbyManager.getOnlineUsernames().isEmpty());
    }

    @Test
    public void testBroadcastOnlineUsersPayloadFormat() {
        List<String> log1 = new CopyOnWriteArrayList<>();
        WebSocket ws1 = createFakeWebSocket(log1);
        ClientHandler handler1 = new ClientHandler(ws1, eventBus, authService, lobbyManager);

        lobbyManager.addPlayer("player1", handler1);

        assertFalse(log1.isEmpty());
        String lastMsg = log1.get(log1.size() - 1);
        Message msg = gson.fromJson(lastMsg, Message.class);

        assertEquals(MessageType.ONLINE_USERS_UPDATE, msg.getType());
        JsonObject payload = gson.fromJson(msg.getPayload(), JsonObject.class);
        assertTrue(payload.has("users"));

        JsonArray users = payload.getAsJsonArray("users");
        assertEquals(1, users.size());
        JsonObject u0 = users.get(0).getAsJsonObject();
        assertEquals("player1", u0.get("username").getAsString());
        assertEquals("AVAILABLE", u0.get("status").getAsString());
    }

    @Test
    public void testInviteFlowAndMatchConfirmed() throws InterruptedException {
        List<String> log1 = new CopyOnWriteArrayList<>();
        List<String> log2 = new CopyOnWriteArrayList<>();
        ClientHandler h1 = new ClientHandler(createFakeWebSocket(log1), eventBus, authService, lobbyManager);
        ClientHandler h2 = new ClientHandler(createFakeWebSocket(log2), eventBus, authService, lobbyManager);

        lobbyManager.addPlayer("alice", h1);
        lobbyManager.addPlayer("bob", h2);

        CountDownLatch matchLatch = new CountDownLatch(1);
        List<GameEvent> matchEvents = new CopyOnWriteArrayList<>();
        eventBus.subscribe(EventType.MATCH_CONFIRMED, e -> {
            matchEvents.add(e);
            matchLatch.countDown();
        });

        // alice envia convite para bob
        JsonObject invitePayload = new JsonObject();
        invitePayload.addProperty("to", "bob");
        eventBus.publish(new GameEvent(EventType.INVITE_SENT, "alice", invitePayload.toString()));

        // Aguarda propagação no executor do EventBus
        Thread.sleep(150);

        // bob deve ter recebido INVITE_RECEIVED
        boolean receivedInvite = false;
        for (String m : log2) {
            Message parsed = gson.fromJson(m, Message.class);
            if (parsed.getType() == MessageType.INVITE_RECEIVED) {
                JsonObject p = gson.fromJson(parsed.getPayload(), JsonObject.class);
                assertEquals("alice", p.get("from").getAsString());
                receivedInvite = true;
                break;
            }
        }
        assertTrue("Bob deveria receber INVITE_RECEIVED", receivedInvite);

        // bob aceita o convite
        JsonObject acceptPayload = new JsonObject();
        acceptPayload.addProperty("from", "alice");
        eventBus.publish(new GameEvent(EventType.INVITE_ACCEPTED, "bob", acceptPayload.toString()));

        assertTrue("MATCH_CONFIRMED deveria ser disparado", matchLatch.await(1, TimeUnit.SECONDS));
        assertEquals(1, matchEvents.size());
        JsonObject matchData = gson.fromJson((String) matchEvents.get(0).getData(), JsonObject.class);
        assertEquals("alice", matchData.get("inviter").getAsString());
        assertEquals("bob", matchData.get("accepter").getAsString());

        // Ambos devem estar IN_GAME
        assertEquals(LobbyManager.PlayerStatus.IN_GAME, lobbyManager.getPlayerStatus("alice"));
        assertEquals(LobbyManager.PlayerStatus.IN_GAME, lobbyManager.getPlayerStatus("bob"));
    }

    @Test
    public void testCannotInviteSelf() throws InterruptedException {
        List<String> log1 = new CopyOnWriteArrayList<>();
        ClientHandler h1 = new ClientHandler(createFakeWebSocket(log1), eventBus, authService, lobbyManager);
        lobbyManager.addPlayer("alice", h1);

        JsonObject invitePayload = new JsonObject();
        invitePayload.addProperty("to", "alice");
        eventBus.publish(new GameEvent(EventType.INVITE_SENT, "alice", invitePayload.toString()));

        Thread.sleep(150);

        boolean gotError = false;
        for (String m : log1) {
            Message parsed = gson.fromJson(m, Message.class);
            if (parsed.getType() == MessageType.ERROR) {
                gotError = true;
                break;
            }
        }
        assertTrue("Deveria receber erro ao tentar convidar a si mesmo", gotError);
    }

    @Test
    public void testCannotInviteWhenInGame() throws InterruptedException {
        List<String> log1 = new CopyOnWriteArrayList<>();
        List<String> log2 = new CopyOnWriteArrayList<>();
        ClientHandler h1 = new ClientHandler(createFakeWebSocket(log1), eventBus, authService, lobbyManager);
        ClientHandler h2 = new ClientHandler(createFakeWebSocket(log2), eventBus, authService, lobbyManager);

        lobbyManager.addPlayer("alice", h1);
        lobbyManager.addPlayer("bob", h2);
        lobbyManager.setPlayerStatus("bob", LobbyManager.PlayerStatus.IN_GAME);

        JsonObject invitePayload = new JsonObject();
        invitePayload.addProperty("to", "bob");
        eventBus.publish(new GameEvent(EventType.INVITE_SENT, "alice", invitePayload.toString()));

        Thread.sleep(150);

        boolean gotError = false;
        for (String m : log1) {
            Message parsed = gson.fromJson(m, Message.class);
            if (parsed.getType() == MessageType.ERROR) {
                gotError = true;
                break;
            }
        }
        assertTrue("Deveria receber erro ao tentar convidar jogador IN_GAME", gotError);
    }

    @Test
    public void testCannotAcceptNonExistentInvite() throws InterruptedException {
        List<String> log1 = new CopyOnWriteArrayList<>();
        List<String> log2 = new CopyOnWriteArrayList<>();
        ClientHandler h1 = new ClientHandler(createFakeWebSocket(log1), eventBus, authService, lobbyManager);
        ClientHandler h2 = new ClientHandler(createFakeWebSocket(log2), eventBus, authService, lobbyManager);

        lobbyManager.addPlayer("alice", h1);
        lobbyManager.addPlayer("bob", h2);

        // bob tenta aceitar sem alice ter convidado
        JsonObject acceptPayload = new JsonObject();
        acceptPayload.addProperty("from", "alice");
        eventBus.publish(new GameEvent(EventType.INVITE_ACCEPTED, "bob", acceptPayload.toString()));

        Thread.sleep(150);

        boolean gotError = false;
        for (String m : log2) {
            Message parsed = gson.fromJson(m, Message.class);
            if (parsed.getType() == MessageType.ERROR) {
                gotError = true;
                break;
            }
        }
        assertTrue("Deveria receber erro ao tentar aceitar convite inexistente", gotError);
    }

    @Test
    public void testGameLifecycleStatusTransitions() {
        List<String> log1 = new CopyOnWriteArrayList<>();
        List<String> log2 = new CopyOnWriteArrayList<>();
        ClientHandler h1 = new ClientHandler(createFakeWebSocket(log1), eventBus, authService, lobbyManager);
        ClientHandler h2 = new ClientHandler(createFakeWebSocket(log2), eventBus, authService, lobbyManager);

        lobbyManager.addPlayer("alice", h1);
        lobbyManager.addPlayer("bob", h2);

        GameRoom room = new GameRoom("alice", "bob");

        // Dispara GAME_STARTED
        eventBus.publish(new GameEvent(EventType.GAME_STARTED, "GAME_MANAGER", room));
        try { Thread.sleep(150); } catch (InterruptedException ignored) {}

        assertEquals(LobbyManager.PlayerStatus.IN_GAME, lobbyManager.getPlayerStatus("alice"));
        assertEquals(LobbyManager.PlayerStatus.IN_GAME, lobbyManager.getPlayerStatus("bob"));

        // Dispara GAME_OVER
        eventBus.publish(new GameEvent(EventType.GAME_OVER, "GAME_MANAGER", room));
        try { Thread.sleep(150); } catch (InterruptedException ignored) {}

        assertEquals(LobbyManager.PlayerStatus.AVAILABLE, lobbyManager.getPlayerStatus("alice"));
        assertEquals(LobbyManager.PlayerStatus.AVAILABLE, lobbyManager.getPlayerStatus("bob"));
    }
}
