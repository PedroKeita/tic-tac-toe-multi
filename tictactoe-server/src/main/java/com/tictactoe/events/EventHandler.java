package com.tictactoe.events;

@FunctionalInterface
public interface EventHandler {
    void handle(GameEvent event);
}
