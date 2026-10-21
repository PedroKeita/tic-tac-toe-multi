package com.tictactoe.shared;

public class Message {
    
    private MessageType type;
    private String sender;
    private String payload;
    private long timestamp;

    public Message() {}

    public Message(MessageType type, String sender, String payload) {
        this.type = type;
        this.sender = sender;
        this.payload = payload;
        this.timestamp = System.currentTimeMillis();
    }

    // Getters
    public MessageType getType() {
         return type; 
    }

    public String getSender() { 
        return sender; 
    }

    public String getPayload() { 
        return payload; 
    }

    public long getTimestamp() { 
        return timestamp; 
    }

    // Setters
    public void setType(MessageType type) { 
        this.type = type; 
    }

    public void setSender(String sender) { 
        this.sender = sender; 
    }

    public void setPayload(String payload) { 
        this.payload = payload; 
    }

}
