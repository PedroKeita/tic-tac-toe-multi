package com.tictactoe.events;

public class GameEvent {
    private final String type;
    private final String source;
    private final Object data;
    private final long timestamp;

    public GameEvent(String type, String source, Object data) {
        this.type = type;
        this.source = source;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    // Getters
    public String getType() { 
        return type; 
    }

    public String getSource() { 
        return source; 
    }

    public Object getData() { 
        return data; 
    }

    public long getTimestamp() { 
        return timestamp; 
    }

}
