package com.tictactoe.shared.interfaces;

public interface IGameRoom {
    boolean makeMove(String username, int position);
    boolean isFull();
    boolean isGameOver();
    String getWinner();
    int[] getBoard();
}
