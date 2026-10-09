import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import ChalkBoard from '../components/ChalkBoard';
import PlayerGameCard from '../components/PlayerGameCard';
import WaitingPlayerCard from '../components/WaitingPlayerCard';

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function MultiplayerGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { emit, on, off } = useGameSocket();

  // Parâmetros da rota
  const initialStatus = searchParams.get('status') || 'waiting';
  const initialRoomId = searchParams.get('roomId');
  const initialOpponent = searchParams.get('opponent');

  // Estados principais do Multiplayer
  const [gameState, setGameState] = useState(initialRoomId ? 'playing' : initialStatus); // 'waiting' | 'playing'
  const [roomId, setRoomId] = useState(initialRoomId || null);
  const [opponent, setOpponent] = useState(
    initialOpponent ? { name: initialOpponent, symbol: 'X' } : null
  );

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('O'); // 'O' = Jogador local, 'X' = Oponente
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win' | 'draw' | 'defeat'
  const [rematchStatus, setRematchStatus] = useState(null);

  /**
   * Avalia vitória
   */
  const checkWinner = (currentBoard) => {
    for (const [a, b, c] of WINNING_LINES) {
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return currentBoard[a];
      }
    }
    return null;
  };

  /**
   * Avalia empate
   */
  const checkDraw = (currentBoard) => {
    return currentBoard.every((cell) => cell !== null);
  };

  // 1. Ciclo de Conexão e Eventos WebSocket
  useEffect(() => {
    // Quando uma sala é criada
    const handleRoomCreated = ({ roomId: newId }) => {
      setRoomId(newId);
    };

    // Quando um oponente entra na sala de espera
    const handlePlayerJoined = ({ opponent: oppData }) => {
      setOpponent(oppData);
      setGameState('playing');
    };

    // Quando o jogador entrou em uma sala existente
    const handleJoinedRoom = ({ roomId: joinedId, opponent: oppData }) => {
      setRoomId(joinedId);
      setOpponent(oppData);
      setGameState('playing');
    };

    // Quando o oponente faz uma jogada
    const handleOpponentMove = ({ cellIndex, symbol }) => {
      setBoard((prev) => {
        if (prev[cellIndex] !== null) return prev;
        const nextBoard = [...prev];
        nextBoard[cellIndex] = symbol || 'X';

        const winner = checkWinner(nextBoard);
        if (winner === 'X') {
          setIsGameOver(true);
          setGameResult('defeat');
        } else if (checkDraw(nextBoard)) {
          setIsGameOver(true);
          setGameResult('draw');
        } else {
          setTurn('O');
        }

        return nextBoard;
      });
    };

    // Quando a revanche é aceita
    const handleRematchAccepted = () => {
      setBoard(Array(9).fill(null));
      setTurn('O');
      setIsGameOver(false);
      setGameResult(null);
      setRematchStatus(null);
    };

    on('room_created', handleRoomCreated);
    on('player_joined', handlePlayerJoined);
    on('joined_room', handleJoinedRoom);
    on('opponent_move', handleOpponentMove);
    on('rematch_accepted', handleRematchAccepted);

    // Inicialização do fluxo de acordo com os parâmetros da URL
    if (initialRoomId) {
      emit('join_room', { roomId: initialRoomId, player: user });
    } else {
      emit('create_room', { hostId: user?.id, hostName: user?.name || 'Você' });
    }

    return () => {
      off('room_created', handleRoomCreated);
      off('player_joined', handlePlayerJoined);
      off('joined_room', handleJoinedRoom);
      off('opponent_move', handleOpponentMove);
      off('rematch_accepted', handleRematchAccepted);
    };
  }, [emit, on, off, initialRoomId, user]);

  /**
   * Clique do jogador local em uma célula do tabuleiro
   */
  const handleCellClick = (index) => {
    if (
      board[index] !== null ||
      turn !== 'O' ||
      gameState !== 'playing' ||
      isGameOver
    ) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = 'O';
    setBoard(nextBoard);

    const winner = checkWinner(nextBoard);
    if (winner === 'O') {
      setIsGameOver(true);
      setGameResult('win');
      emit('make_move', { roomId, cellIndex: index, symbol: 'O', board: nextBoard });
      return;
    }

    if (checkDraw(nextBoard)) {
      setIsGameOver(true);
      setGameResult('draw');
      emit('make_move', { roomId, cellIndex: index, symbol: 'O', board: nextBoard });
      return;
    }

    setTurn('X');
    emit('make_move', { roomId, cellIndex: index, symbol: 'O', board: nextBoard });
  };

  /**
   * Solicitar Revanche
   */
  const handlePlayAgain = () => {
    setRematchStatus('Aguardando oponente aceitar...');
    emit('request_rematch', { roomId, by: 'You' });
  };

  /**
   * Sair da Partida
   */
  const handleExit = () => {
    emit('leave_room', { roomId });
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card className="min-h-[620px] max-w-[920px] justify-between">
        {/* Cabeçalho condicional: no estado 'waiting' mostra 'ESPERANDO O OUTRO JOGADOR..' com barra */}
        {gameState === 'waiting' ? (
          <HeaderBar title="ESPERANDO O OUTRO JOGADOR.." />
        ) : (
          <div className="w-full flex justify-center mb-6">
            <div className="w-full max-w-xl h-2 flex items-center rounded-full overflow-hidden shadow-sm">
              <div className="w-1/2 h-full bg-[#22a6fe]" />
              <div className="w-1/2 h-full bg-[#f25b2a]" />
            </div>
          </div>
        )}

        {/* Feedback visual discreto de revanche se ativado */}
        {rematchStatus && (
          <div className="text-center -mt-2 mb-2">
            <span className="text-xs font-semibold text-blue-600 animate-pulse bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              {rematchStatus}
            </span>
          </div>
        )}

        {/* Área Central: Jogador - Tabuleiro - Oponente (ou Card de Espera) */}
        <div className="w-full flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 my-auto px-2">
          {/* Card Esquerdo: Jogador Local (Sempre 'You' e 'O') */}
          <PlayerGameCard
            type="player"
            name="You"
            symbol="O"
            isTurn={gameState === 'playing' && turn === 'O' && !isGameOver}
            isThinking={false}
          />

          {/* Centro: Quadro de Giz (Tabuleiro ou Overlays de Fim de Jogo) */}
          <ChalkBoard
            board={board}
            onCellClick={handleCellClick}
            disabled={gameState !== 'playing' || turn !== 'O' || isGameOver}
            isGameOver={isGameOver}
            gameResult={gameResult}
            onPlayAgain={handlePlayAgain}
            onExit={handleExit}
          />

          {/* Card Direito: Se estiver esperando exibe WaitingPlayerCard, senão PlayerGameCard do Oponente */}
          {gameState === 'waiting' ? (
            <WaitingPlayerCard message="..." />
          ) : (
            <PlayerGameCard
              type="bot"
              name={opponent?.name || 'Jogador 2'}
              symbol="X"
              isTurn={turn === 'X' && !isGameOver}
              isThinking={turn === 'X'}
            />
          )}
        </div>

        {/* Rodapé equilibrado */}
        <div className="h-4" />
      </Card>
    </div>
  );
}
