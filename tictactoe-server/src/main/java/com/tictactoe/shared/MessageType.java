package com.tictactoe.shared;

public enum MessageType {

    // Auth
    REGISTER,
    REGISTER_SUCCESS,
    REGISTER_ERROR,
    LOGIN,
    LOGIN_SUCCESS,
    LOGIN_ERROR,

    // Lobby
    LIST_ONLINE_USERS,
    ONLINE_USERS_UPDATE,

    // Invite
    INVITE,
    INVITE_RECEIVED,
    INVITE_ACCEPTED,
    INVITE_REJECTED,

    // Game
    MAKE_MOVE,
    BOARD_UPDATE,
    GAME_STARTED,
    GAME_OVER,
    FORFEIT,

    // Rematch
    REMATCH_REQUEST,
    REMATCH_WAITING,
    REMATCH_DECLINED,

    // System
    ERROR,
    DISCONNECT
}
