import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { safeParsePayload } from '../utils/safeJson';
import Card from '../components/Card';
import ChalkBoard from '../components/ChalkBoard';
import PlayerGameCard from '../components/PlayerGameCard';

function boardIntToDisplay(intBoard) {
  if (!Array.isArray(intBoard)) return Array(9).fill(null);
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
  const [gameReason, setGameReason] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [rematchStatus, setRematchStatus] = useState(null); // 'sent' | 'received' | null
  const [rematchFrom, setRematchFrom] = useState(null);

  const isGameOverRef = useRef(false);
  const activatedRef = useRef(false);
  const gameIdRef = useRef(gameId);

  useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (!gameId) {
      navigate('/lobby');
      return;
    }

    const handleBoardUpdate = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      if (payload.gameId !== gameIdRef.current) return;
      if (payload.board) setBoard(boardIntToDisplay(payload.board));
      setIsMyTurn(payload.currentTurn === user?.username);
    };

    const handleGameOver = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      if (payload.gameId !== gameIdRef.current) return;
      if (payload.board) setBoard(boardIntToDisplay(payload.board));
      setIsGameOver(true);
      setGameReason(payload.reason || null);
      setRematchStatus(null);
      setRematchFrom(null);

      if (payload.result === 'DRAW') {
        setGameResult('draw');
      } else if (payload.winner === user?.username) {
        setGameResult('win');
      } else {
        setGameResult('defeat');
      }
    };

    const handleGameStarted = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      setGameId(payload.gameId);
      setMySymbol(payload.symbol);
      setOpponent(payload.opponent);
      setBoard(boardIntToDisplay(payload.board));
      setIsMyTurn(payload.yourTurn);
      setIsGameOver(false);
      setGameResult(null);
      setGameReason(null);
      setRematchStatus(null);
      setRematchFrom(null);
      setErrorMessage(null);
    };

    const handleRematchWaiting = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      if (payload.from && payload.from !== user?.username) {
        setRematchStatus('received');
        setRematchFrom(payload.from);
      } else if (payload.message) {
        setRematchStatus('sent');
      }
    };

    const handleRematchDeclined = () => {
      setRematchStatus(null);
      setRematchFrom(null);
      setErrorMessage('Oponente recusou a revanche.');
    };

    const handleError = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      setErrorMessage(payload.message || 'Erro durante a partida.');
    };

    on('BOARD_UPDATE', handleBoardUpdate);
    on('GAME_OVER', handleGameOver);
    on('GAME_STARTED', handleGameStarted);
    on('REMATCH_WAITING', handleRematchWaiting);
    on('REMATCH_DECLINED', handleRematchDeclined);
    on('ERROR', handleError);

    const activateTimer = setTimeout(() => { activatedRef.current = true; }, 100);

    return () => {
      clearTimeout(activateTimer);
      off('BOARD_UPDATE', handleBoardUpdate);
      off('GAME_OVER', handleGameOver);
      off('GAME_STARTED', handleGameStarted);
      off('REMATCH_WAITING', handleRematchWaiting);
      off('REMATCH_DECLINED', handleRematchDeclined);
      off('ERROR', handleError);

      if (activatedRef.current && !isGameOverRef.current && gameIdRef.current) {
        send('FORFEIT', { gameId: gameIdRef.current });
        activatedRef.current = false;
      }
    };
  }, [on, off, user, navigate, send]);

  const handleCellClick = useCallback((index) => {
    if (board[index] !== null || !isMyTurn || isGameOver) return;
    send('MAKE_MOVE', { position: index });
  }, [board, isMyTurn, isGameOver, send]);

  const handleForfeit = useCallback(() => {
    if (!isGameOver && gameId) {
      send('FORFEIT', { gameId });
    }
    navigate('/lobby');
  }, [isGameOver, gameId, send, navigate]);

  const handleRematchRequest = useCallback(() => {
    send('REMATCH_REQUEST', {});
    setRematchStatus('sent');
  }, [send]);

  const handleAcceptRematch = useCallback(() => {
    send('REMATCH_REQUEST', {});
    setRematchStatus('sent');
  }, [send]);

  const handleDeclineRematch = useCallback(() => {
    send('REMATCH_DECLINED', {});
    setRematchStatus(null);
    setRematchFrom(null);
    navigate('/lobby');
  }, [send, navigate]);

  const handleExit = useCallback(() => {
    if (isGameOver) {
      send('REMATCH_DECLINED', {});
    }
    navigate('/lobby');
  }, [isGameOver, send, navigate]);

  const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card className="min-h-[620px] max-w-[920px] justify-between">
        <div className="w-full flex justify-center mb-4">
          <div className="w-full max-w-xl h-2 flex items-center rounded-full overflow-hidden shadow-sm">
            <div className="w-1/2 h-full bg-[#22a6fe]" />
            <div className="w-1/2 h-full bg-[#f25b2a]" />
          </div>
        </div>

        {errorMessage && (
          <div className="w-full max-w-md mx-auto mb-2 p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs text-center font-medium shadow-sm transition-all animate-fadeIn">
            {errorMessage}
          </div>
        )}

        {/* Banner de rematch recebido */}
        {isGameOver && rematchStatus === 'received' && rematchFrom && (
          <div className="w-full max-w-md mx-auto mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between shadow-sm animate-fadeIn">
            <span className="text-xs font-semibold text-amber-900">
              {rematchFrom} quer jogar novamente!
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAcceptRematch}
                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Aceitar
              </button>
              <button
                type="button"
                onClick={handleDeclineRematch}
                className="bg-red-400 hover:bg-red-500 active:scale-95 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Recusar
              </button>
            </div>
          </div>
        )}

        {/* Banner de aguardando rematch */}
        {isGameOver && rematchStatus === 'sent' && (
          <div className="w-full max-w-md mx-auto mb-3 p-3 rounded-xl bg-blue-50 border border-blue-300 text-blue-800 text-xs text-center font-medium shadow-sm animate-pulse">
            Aguardando oponente aceitar revanche...
          </div>
        )}

        <div className="w-full flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 my-auto px-2">
          <PlayerGameCard
            type="player"
            name={user?.username || 'Você'}
            symbol={mySymbol || 'O'}
            isTurn={isMyTurn && !isGameOver}
            isThinking={false}
          />

          <div className="flex flex-col items-center">
            <ChalkBoard
              board={board}
              onCellClick={handleCellClick}
              disabled={!isMyTurn || isGameOver}
              isGameOver={isGameOver}
              gameResult={gameResult}
              reason={gameReason}
              playerSymbol={mySymbol}
              onPlayAgain={handleRematchRequest}
              onExit={handleExit}
            />

            {!isGameOver && (
              <button
                type="button"
                onClick={handleForfeit}
                className="mt-4 bg-red-500/85 hover:bg-red-600 active:scale-95 text-white text-xs font-semibold py-1.5 px-5 rounded-lg shadow transition-all cursor-pointer border border-red-400/40"
              >
                Abandonar Partida
              </button>
            )}
          </div>

          <PlayerGameCard
            type="player"
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
