package com.tictactoe.shared.interfaces;

import com.tictactoe.events.EventHandler;
import com.tictactoe.events.GameEvent;

public interface IEventBus {
    void publish(GameEvent event);
    void subscribe(String eventType, EventHandler handler);
}
