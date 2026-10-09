import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ChalkBoard from '../components/ChalkBoard';
import PlayerGameCard from '../components/PlayerGameCard';

// 8 Combinações vitoriosas no Jogo da Velha
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

export default function SinglePlayerGame() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('O'); // 'O' é o Jogador, 'X' é o Bot
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win' | 'draw' | 'defeat'

  /**
   * Avalia o vencedor atual do tabuleiro
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
   * Verifica se houve empate
   */
  const checkDraw = (currentBoard) => {
    return currentBoard.every((cell) => cell !== null);
  };

  /**
   * IA do Bot: Inteligência com tomada de decisão tática
   */
  const calculateBotMove = (currentBoard) => {
    // 1. O Bot pode ganhar nesta jogada?
    for (const [a, b, c] of WINNING_LINES) {
      const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (line.filter((v) => v === 'X').length === 2 && line.includes(null)) {
        if (currentBoard[a] === null) return a;
        if (currentBoard[b] === null) return b;
        if (currentBoard[c] === null) return c;
      }
    }

    // 2. O Jogador vai ganhar na próxima? Bloquear!
    for (const [a, b, c] of WINNING_LINES) {
      const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (line.filter((v) => v === 'O').length === 2 && line.includes(null)) {
        if (currentBoard[a] === null) return a;
        if (currentBoard[b] === null) return b;
        if (currentBoard[c] === null) return c;
      }
    }

    // 3. Tentar o centro (posição mais vantajosa)
    if (currentBoard[4] === null) return 4;

    // 4. Tentar os cantos disponíveis
    const corners = [0, 2, 6, 8].filter((i) => currentBoard[i] === null);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Pegar qualquer célula restante
    const emptyCells = currentBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((v) => v !== null);

    if (emptyCells.length > 0) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    return null;
  };

  /**
   * Execução do turno do Bot com delay humanizado
   */
  const executeBotTurn = useCallback(
    (currentBoard) => {
      setIsBotThinking(true);

      const delay = Math.floor(Math.random() * 300) + 600; // 600ms a 900ms
      const timer = setTimeout(() => {
        const botMove = calculateBotMove(currentBoard);

        if (botMove !== null) {
          const newBoard = [...currentBoard];
          newBoard[botMove] = 'X';
          setBoard(newBoard);

          const winner = checkWinner(newBoard);
          if (winner === 'X') {
            setIsGameOver(true);
            setGameResult('defeat');
            setIsBotThinking(false);
            return;
          }

          if (checkDraw(newBoard)) {
            setIsGameOver(true);
            setGameResult('draw');
            setIsBotThinking(false);
            return;
          }

          setTurn('O');
        }

        setIsBotThinking(false);
      }, delay);

      return () => clearTimeout(timer);
    },
    []
  );

  /**
   * Clique do jogador humano ('O') em uma célula
   */
  const handleCellClick = (index) => {
    if (board[index] !== null || turn !== 'O' || isBotThinking || isGameOver) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = 'O';
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner === 'O') {
      setIsGameOver(true);
      setGameResult('win');
      return;
    }

    if (checkDraw(newBoard)) {
      setIsGameOver(true);
      setGameResult('draw');
      return;
    }

    setTurn('X');
    executeBotTurn(newBoard);
  };

  /**
   * Reiniciar a partida
   */
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('O');
    setIsBotThinking(false);
    setIsGameOver(false);
    setGameResult(null);
  };

  /**
   * Retornar para a seleção de modos
   */
  const handleExit = () => {
    navigate('/game-mode');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card className="min-h-[620px] max-w-[920px] justify-between">
        {/* Barra Bipartida Superior conforme Figma */}
        <div className="w-full flex justify-center mb-6">
          <div className="w-full max-w-xl h-2 flex items-center rounded-full overflow-hidden shadow-sm">
            <div className="w-1/2 h-full bg-[#22a6fe]" />
            <div className="w-1/2 h-full bg-[#f25b2a]" />
          </div>
        </div>

        {/* Área Central do Jogo: Jogador - Quadro de Giz - Bot */}
        <div className="w-full flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-10 my-auto px-2">
          {/* Card Esquerdo: Jogador Humano (sempre 'You' como no Figma) */}
          <PlayerGameCard
            type="player"
            name="You"
            symbol="O"
            isTurn={turn === 'O' && !isGameOver}
            isThinking={false}
          />

          {/* Centro: Quadro de Giz com Tabuleiro e Overlays de Fim de Jogo */}
          <ChalkBoard
            board={board}
            onCellClick={handleCellClick}
            disabled={turn === 'X' || isBotThinking || isGameOver}
            isGameOver={isGameOver}
            gameResult={gameResult}
            onPlayAgain={resetGame}
            onExit={handleExit}
          />

          {/* Card Direito: Computador / Bot */}
          <PlayerGameCard
            type="bot"
            name="Computer"
            symbol="X"
            isTurn={turn === 'X' && !isGameOver}
            isThinking={isBotThinking}
          />
        </div>

        {/* Rodapé mantendo equilíbrio visual */}
        <div className="h-4" />
      </Card>
    </div>
  );
}
