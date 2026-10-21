package com.tictactoe.events;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;
import com.tictactoe.shared.interfaces.IEventBus;

/**
 * Barramento de eventos assincrono para desacoplar as mensagens recebidas
 * pela camada de rede das acoes de dominio do jogo e lobby.
 *
 * <p><strong>IMPORTANTE - THREAD-SAFETY DO DOMINIO:</strong><br>
 * O processamento e despacho de todos os eventos e realizado sequencialmente atraves
 * de um {@link java.util.concurrent.Executors#newSingleThreadExecutor()}.
 * Essa fila FIFO serializada e a garantia arquitetural de thread-safety para as regras
 * de negocio de salas (GameRoom) e gerenciamento de estado (LobbyManager e GameManager),
 * eliminando condicoes de corrida entre acoes e jogadas concorrentes sem a necessidade
 * de sincronizacao bloqueante distribuida por todo o dominio.
 * </p>
 */
public class EventBus implements IEventBus {

    private static final Logger LOGGER = Logger.getLogger(EventBus.class.getName());

    // Map de eventType para lista thread-safe de handlers
    private final Map<String, List<EventHandler>> subscribers;

    // Thread pool para processar eventos de forma assincrona e serializada
    private final ExecutorService executor;

    public EventBus() {
        this.subscribers = new ConcurrentHashMap<>();
        this.executor = Executors.newSingleThreadExecutor();
    }

    // Inscreve um handler para um tipo de evento
    @Override
    public void subscribe(String eventType, EventHandler handler) {
        subscribers
            .computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
            .add(handler);

        LOGGER.info(String.format("event=EVENT_SUBSCRIBED details=\"Handler inscrito para evento: %s\"", eventType));
    }

    // Publica um evento onde todos os handlers inscritos são notificados
    @Override
    public void publish(GameEvent event) {
        if (event == null) {
            LOGGER.warning("event=EVENT_PUBLISH_IGNORED details=\"Tentativa de publicar evento nulo ignorada\"");
            return;
        }

        executor.submit(() -> dispatch(event));
    }

    private void dispatch(GameEvent event) {
        List<EventHandler> handlers = subscribers.get(event.getType());

        if (handlers == null || handlers.isEmpty()) {
            LOGGER.warning(String.format("event=EVENT_NO_HANDLERS details=\"Nenhum handler inscrito para evento: %s\"", event.getType()));
            return;
        }

        for (EventHandler handler : handlers) {
            try {
                handler.handle(event);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE,
                    String.format("event=EVENT_PROCESS_ERROR details=\"Erro ao processar evento %s\"", event.getType()), e);
            }
        }
    }

    // Encerra o executor ao desligar o servidor
    public void shutdown() {
        executor.shutdown();
        LOGGER.info("event=EVENT_BUS_SHUTDOWN details=\"EventBus encerrado\"");
    }
}