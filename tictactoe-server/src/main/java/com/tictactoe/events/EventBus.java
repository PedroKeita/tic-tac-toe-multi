package com.tictactoe.events;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;
import com.tictactoe.shared.interfaces.IEventBus;

public class EventBus implements IEventBus {

    private static final Logger LOGGER = Logger.getLogger(EventBus.class.getName());

    // Map de eventType para lista de handlers
    private final Map<String, List<EventHandler>> subscribers;

    // Thread pool para processar eventos de forma assíncrona
    private final ExecutorService executor;

    public EventBus() {
        this.subscribers = new ConcurrentHashMap<>();
        this.executor = Executors.newSingleThreadExecutor();
    }

    // Inscreve um handler para um tipo de evento
    @Override
    public void subscribe(String eventType, EventHandler handler) {
        subscribers
            .computeIfAbsent(eventType, k -> new ArrayList<>())
            .add(handler);

        LOGGER.info("Handler inscrito para evento: " + eventType);
    }

    // Publica um evento onde todos os handlers inscritos são notificados
    @Override
    public void publish(GameEvent event) {
        if (event == null) {
            LOGGER.warning("Tentativa de publicar evento nulo ignorada");
            return;
        }

        executor.submit(() -> dispatch(event));
    }

    private void dispatch(GameEvent event) {
        List<EventHandler> handlers = subscribers.get(event.getType());

        if (handlers == null || handlers.isEmpty()) {
            LOGGER.warning("Nenhum handler inscrito para evento: " + event.getType());
            return;
        }

        for (EventHandler handler : handlers) {
            try {
                handler.handle(event);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE,
                    "Erro ao processar evento " + event.getType(), e);
            }
        }
    }

    // Encerra o executor ao desligar o servidor
    public void shutdown() {
        executor.shutdown();
        LOGGER.info("EventBus encerrado");
    }
}