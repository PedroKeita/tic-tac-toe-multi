import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import ChalkBoard from '../components/ChalkBoard';
import PlayerGameCard from '../components/PlayerGameCard';
import WaitingPlayerCard from '../components/WaitingPlayerCard';

function boardIntToDisplay(intBoard) {
  return intBoard.map((cell) => {
    if (cell === 1) return 'X';
    if (cell === 2) return 'O';
    return null;
  });
}

export default function MultiplayerGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { send, on, off } = useGameSocket();

  const gameInfo = location.state || {};

  const [gameId, setGameId] = useState(gameInfo.gameId || null);
  const [mySymbol, setMySymbol] = useState(gameInfo.symbol || null);
  const [opponent, setOpponent] = useState(gameInfo.opponent || null);
  const [board, setBoard] = useState(
    gameInfo.board ? boardIntToDisplay(gameInfo.board) : Array(9).fill(null)
  );
  const [isMyTurn, setIsMyTurn] = useState(gameInfo.yourTurn || false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (!gameId) {
      navigate('/lobby');
      return;
    }

    const handleBoardUpdate = (msg) => {
      const payload = JSON.parse(msg.payload);
      if (payload.gameId !== gameId) return;

      setBoard(boardIntToDisplay(payload.board));
      setIsMyTurn(payload.currentTurn === user?.username);
    };

    const handleGameOver = (msg) => {
      const payload = JSON.parse(msg.payload);
      if (payload.gameId !== gameId) return;

      setBoard(boardIntToDisplay(payload.board));
      setIsGameOver(true);

      if (payload.result === 'DRAW') {
        setGameResult('draw');
      } else if (payload.winner === user?.username) {
        setGameResult('win');
      } else {
        setGameResult('defeat');
      }
    };

    const handleError = (msg) => {
      const payload = JSON.parse(msg.payload);
      console.warn('[Game] Error:', payload.message);
    };

    on('BOARD_UPDATE', handleBoardUpdate);
    on('GAME_OVER', handleGameOver);
    on('ERROR', handleError);

    return () => {
      off('BOARD_UPDATE', handleBoardUpdate);
      off('GAME_OVER', handleGameOver);
      off('ERROR', handleError);
    };
  }, [gameId, on, off, user, navigate]);

  const handleCellClick = useCallback((index) => {
    if (board[index] !== null || !isMyTurn || isGameOver) return;

    send('MAKE_MOVE', { position: index });
  }, [board, isMyTurn, isGameOver, send]);

  const handleExit = useCallback(() => {
    if (!isGameOver) {
      send('FORFEIT', {});
    }
    navigate('/lobby');
  }, [isGameOver, send, navigate]);

  const handlePlayAgain = useCallback(() => {
    navigate('/lobby');
  }, [navigate]);

  const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card className="min-h-[620px] max-w-[920px] justify-between">
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-xl h-2 flex items-center rounded-full overflow-hidden shadow-sm">
            <div className="w-1/2 h-full bg-[#22a6fe]" />
            <div className="w-1/2 h-full bg-[#f25b2a]" />
          </div>
        </div>

        <div className="w-full flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 my-auto px-2">
          <PlayerGameCard
            type="player"
            name={user?.username || 'Voce'}
            symbol={mySymbol || 'O'}
            isTurn={isMyTurn && !isGameOver}
            isThinking={false}
          />

          <ChalkBoard
            board={board}
            onCellClick={handleCellClick}
            disabled={!isMyTurn || isGameOver}
            isGameOver={isGameOver}
            gameResult={gameResult}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />

          <PlayerGameCard
            type="bot"
            name={opponent || 'Oponente'}
            symbol={opponentSymbol || 'X'}
            isTurn={!isMyTurn && !isGameOver}
            isThinking={!isMyTurn && !isGameOver}
          />
        </div>

        <div className="h-4" />
      </Card>
    </div>
  );
}
