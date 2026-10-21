import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { safeParsePayload } from '../utils/safeJson';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import ChalkBoard from '../components/ChalkBoard';
import Button from '../components/Button';

export default function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { send, on, off } = useGameSocket();

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [sentInviteTo, setSentInviteTo] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'error' | 'warning' | 'info', message: string }

  // Auto-limpeza do feedback após 5 segundos
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => {
      setFeedback(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Timeout de 30 segundos para convites pendentes sem resposta
  useEffect(() => {
    if (!sentInviteTo) return;
    const timer = setTimeout(() => {
      setSentInviteTo(null);
      setFeedback({
        type: 'info',
        message: 'O convite enviado expirou sem resposta do jogador.',
      });
    }, 30000);
    return () => clearTimeout(timer);
  }, [sentInviteTo]);

  useEffect(() => {
    const handleOnlineUsers = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      const rawUsers = Array.isArray(payload.users) ? payload.users : [];
      const normalized = rawUsers.map((u) => {
        if (typeof u === 'string') {
          return { username: u, status: 'AVAILABLE' };
        }
        return { username: u.username, status: u.status || 'AVAILABLE' };
      });
      const filtered = normalized.filter((u) => u.username !== user?.username);
      setOnlineUsers(filtered);
      setIsLoading(false);
    };

    const handleInviteReceived = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      if (payload.from) {
        setPendingInvite(payload.from);
      }
    };

    const handleGameStarted = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      navigate('/game/multiplayer', {
        state: {
          gameId: payload.gameId,
          symbol: payload.symbol,
          opponent: payload.opponent,
          yourTurn: payload.yourTurn,
          board: payload.board,
        },
      });
    };

    const handleInviteAccepted = () => {
      setSentInviteTo(null);
    };

    const handleInviteRejected = (msg) => {
      setSentInviteTo(null);
      const payload = safeParsePayload(msg?.payload, {});
      const target = payload.from || payload.to || 'O jogador';
      setFeedback({
        type: 'warning',
        message: `${target} recusou seu convite para jogar.`,
      });
    };

    const handleError = (msg) => {
      setSentInviteTo(null);
      const payload = safeParsePayload(msg.payload, {});
      const errorMessage = payload.message || 'Ocorreu um erro ao processar a ação.';
      setFeedback({
        type: 'error',
        message: errorMessage,
      });
    };

    on('ONLINE_USERS_UPDATE', handleOnlineUsers);
    on('INVITE_RECEIVED', handleInviteReceived);
    on('GAME_STARTED', handleGameStarted);
    on('INVITE_ACCEPTED', handleInviteAccepted);
    on('INVITE_REJECTED', handleInviteRejected);
    on('ERROR', handleError);

    send('LIST_ONLINE_USERS');

    return () => {
      off('ONLINE_USERS_UPDATE', handleOnlineUsers);
      off('INVITE_RECEIVED', handleInviteReceived);
      off('GAME_STARTED', handleGameStarted);
      off('INVITE_ACCEPTED', handleInviteAccepted);
      off('INVITE_REJECTED', handleInviteRejected);
      off('ERROR', handleError);
    };
  }, [send, on, off, user, navigate]);

  const handleInvite = useCallback((targetUsername) => {
    setSentInviteTo(targetUsername);
    send('INVITE', { to: targetUsername });
  }, [send]);

  const handleCancelSentInvite = useCallback(() => {
    setSentInviteTo(null);
  }, []);

  const handleAcceptInvite = useCallback(() => {
    if (!pendingInvite) return;
    send('INVITE_ACCEPTED', { to: pendingInvite, from: pendingInvite });
    setPendingInvite(null);
  }, [pendingInvite, send]);

  const handleRejectInvite = useCallback(() => {
    if (!pendingInvite) return;
    send('INVITE_REJECTED', { to: pendingInvite, from: pendingInvite });
    setPendingInvite(null);
  }, [pendingInvite, send]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card className="min-h-[620px] max-w-[920px] justify-between">
        <HeaderBar title="JOGADORES ONLINE" />

        {/* Banner de Feedback (Alerta/Erro/Aviso) */}
        {feedback && (
          <div
            className={`w-full max-w-md mx-auto mb-3 p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all shadow-sm ${
              feedback.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="ml-3 font-bold text-neutral-500 hover:text-neutral-800 cursor-pointer p-0.5"
              title="Fechar"
            >
              ×
            </button>
          </div>
        )}

        {/* Modal de Convite Recebido */}
        {pendingInvite && (
          <div className="w-full max-w-md mx-auto mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-md flex flex-col items-center gap-3 animate-fadeIn">
            <p className="text-sm font-semibold text-amber-900 text-center">
              <span className="text-amber-600">{pendingInvite}</span> te convidou para jogar!
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptInvite}
                className="bg-green-500 hover:bg-green-600 active:scale-95 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow transition-all cursor-pointer"
              >
                Aceitar
              </button>
              <button
                onClick={handleRejectInvite}
                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow transition-all cursor-pointer"
              >
                Recusar
              </button>
            </div>
          </div>
        )}

        <div className="my-auto flex flex-col items-center">
          <ChalkBoard>
            <div className="w-full h-full p-6 md:p-8 flex flex-col justify-start overflow-y-auto custom-scrollbar select-none">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                  <span className="w-6 h-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                  <p className="font-serif text-white/80 text-xs tracking-wider">
                    Buscando jogadores online...
                  </p>
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <p className="font-serif text-neutral-300 text-sm tracking-wide mb-1">
                    Nenhum outro jogador online no momento.
                  </p>
                  <p className="text-white/50 text-xs">
                    Aguarde alguém entrar para convidar!
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-3.5 my-auto">
                  {onlineUsers.map((userObj) => (
                    <div
                      key={userObj.username}
                      className="w-full flex items-center justify-between py-2 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="font-serif text-[#38bdf8] text-sm sm:text-base font-semibold tracking-wide drop-shadow-sm">
                          {userObj.username}
                        </span>

                        {/* Badges de Status (RF02.3) */}
                        {userObj.status === 'AVAILABLE' ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full">
                            Disponível
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full">
                            Em partida
                          </span>
                        )}
                      </div>

                      {sentInviteTo === userObj.username ? (
                        <div className="flex items-center gap-2">
                          <span className="text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                            Convite enviado...
                          </span>
                          <button
                            type="button"
                            onClick={handleCancelSentInvite}
                            className="bg-neutral-700 hover:bg-neutral-600 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer"
                            title="Cancelar convite"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInvite(userObj.username)}
                          disabled={userObj.status === 'IN_GAME' || !!sentInviteTo}
                          className="bg-[#22a6fe] hover:bg-[#1395ea] active:scale-95 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-[0_2px_8px_rgba(34,166,254,0.4)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={userObj.status === 'IN_GAME' ? 'Jogador já está em partida' : 'Convidar para jogar'}
                        >
                          Convidar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChalkBoard>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <Button
              variant="secondary"
              onClick={() => navigate('/game-mode')}
              className="py-2.5 px-6 text-sm"
            >
              Voltar aos Modos
            </Button>
          </div>
        </div>

        <div className="h-4" />
      </Card>
    </div>
  );
}
