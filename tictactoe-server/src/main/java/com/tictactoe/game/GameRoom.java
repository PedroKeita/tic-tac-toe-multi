package com.tictactoe.game;

import com.tictactoe.shared.interfaces.IGameRoom;
import java.util.UUID;
import java.util.logging.Logger;

public class GameRoom implements IGameRoom {

    private static final Logger LOGGER = Logger.getLogger(GameRoom.class.getName());

    public static final int EMPTY  = 0;
    public static final int PLAYER_X = 1;
    public static final int PLAYER_O = 2;

    private static final int[][] WIN_CONDITIONS = {
        {0, 1, 2}, 
        {3, 4, 5}, 
        {6, 7, 8},
        {0, 3, 6}, 
        {1, 4, 7}, 
        {2, 5, 8},
        {0, 4, 8}, 
        {2, 4, 6}
    };

    public enum GameResult { PLAYER_X_WIN, PLAYER_O_WIN, DRAW, FORFEIT }

    private final String gameId;
    private final String playerX;
    private final String playerO;
    private final int[] board;

    private String currentTurn;
    private String winner;
    private boolean gameOver;
    private GameResult result;

    public GameRoom(String playerX, String playerO) {
        this.gameId      = UUID.randomUUID().toString();
        this.playerX     = playerX;
        this.playerO     = playerO;
        this.board       = new int[9];
        this.currentTurn = playerX;
        this.gameOver    = false;

        LOGGER.info("[GAME] Sala criada: " + gameId + " | " + playerX + "(X) vs " + playerO + "(O)");
    }

    @Override
    public boolean makeMove(String username, int position) {
        if (gameOver) {
            LOGGER.warning("[GAME] Jogada recusada - jogo encerrado");
            return false;
        }
        if (!currentTurn.equals(username)) {
            LOGGER.warning("[GAME] Jogada recusada - não é a vez de: " + username);
            return false;
        }
        if (position < 0 || position > 8) {
            LOGGER.warning("[GAME] Posição inválida: " + position);
            return false;
        }
        if (board[position] != EMPTY) {
            LOGGER.warning("[GAME] Posição ocupada: " + position);
            return false;
        }

        int symbol = username.equals(playerX) ? PLAYER_X : PLAYER_O;
        board[position] = symbol;

        LOGGER.info("[GAME] " + username + " jogou na posição " + position);

        checkGameOver(username, symbol);

        if (!gameOver) {
            currentTurn = currentTurn.equals(playerX) ? playerO : playerX;
        }

        return true;
    }

    private void checkGameOver(String username, int symbol) {
        for (int[] combo : WIN_CONDITIONS) {
            if (board[combo[0]] == symbol &&
                board[combo[1]] == symbol &&
                board[combo[2]] == symbol) {

                gameOver = true;
                winner   = username;
                result   = (symbol == PLAYER_X) ? GameResult.PLAYER_X_WIN : GameResult.PLAYER_O_WIN;

                LOGGER.info("[GAME] Vencedor: " + username + " | Jogo: " + gameId);
                return;
            }
        }

        if (isBoardFull()) {
            gameOver = true;
            winner   = null;
            result   = GameResult.DRAW;
            LOGGER.info("[GAME] Empate! Jogo: " + gameId);
        }
    }

    public void forfeit(String username) {
        if (gameOver) return;
        gameOver = true;
        winner   = username.equals(playerX) ? playerO : playerX;
        result   = GameResult.FORFEIT;
        LOGGER.info("[GAME] Forfeit de: " + username + " | Vencedor: " + winner);
    }

    private boolean isBoardFull() {
        for (int cell : board) {
            if (cell == EMPTY) return false;
        }
        return true;
    }

    @Override 
    public boolean isFull() { 
        return isBoardFull(); 
    }
    
    @Override 
    public boolean isGameOver() { 
        return gameOver; 
    }
    
    @Override 
    public String getWinner() { 
        return winner; 
    }

    @Override 
    public int[] getBoard() { 
        return board.clone(); 
    }

    // Getters
    public String getGameId() { 
        return gameId; 
    }

    public String getPlayerX() { 
        return playerX; 
    }

    public String getPlayerO() {
        return playerO; 
    }

    public String getCurrentTurn() {
        return currentTurn; 
    }

    public GameResult getResult() { 
        return result; 
    }

    public String getOpponent(String username) {
        if (username.equals(playerX)) return playerO;
        if (username.equals(playerO)) return playerX;
        return null;
    }

    public boolean hasPlayer(String username) {
        return username.equals(playerX) || username.equals(playerO);
    }

    public String getBoardAsString() {
        StringBuilder sb = new StringBuilder();
        for (int cell : board) {
            if (cell == EMPTY)         sb.append('-');
            else if (cell == PLAYER_X) sb.append('X');
            else                       sb.append('O');
        }
        return sb.toString();
    }
}