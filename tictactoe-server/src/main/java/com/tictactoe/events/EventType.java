package com.tictactoe.events;

public final class EventType {

    private EventType() {}

    // Conexão
    public static final String USER_CONNECTED    = "USER_CONNECTED";
    public static final String USER_DISCONNECTED = "USER_DISCONNECTED";

    // Autenticação
    public static final String USER_LOGGED_IN    = "USER_LOGGED_IN";
    public static final String USER_LOGGED_OUT   = "USER_LOGGED_OUT";

    // Convites
    public static final String INVITE_SENT       = "INVITE_SENT";
    public static final String INVITE_ACCEPTED   = "INVITE_ACCEPTED";
    public static final String INVITE_REJECTED   = "INVITE_REJECTED";

    // Jogo
    public static final String MATCH_CONFIRMED   = "MATCH_CONFIRMED";
    public static final String GAME_STARTED      = "GAME_STARTED";
    public static final String MOVE_MADE         = "MOVE_MADE";
    public static final String GAME_OVER         = "GAME_OVER";
    public static final String PLAYER_FORFEIT    = "PLAYER_FORFEIT";


    // Consulta
     public static final String LIST_ONLINE_USERS      = "LIST_ONLINE_USERS";
}