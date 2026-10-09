import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
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

  useEffect(() => {
    const handleOnlineUsers = (msg) => {
      const payload = JSON.parse(msg.payload);
      const users = (payload.users || []).filter((u) => u !== user?.username);
      setOnlineUsers(users);
      setIsLoading(false);
    };

    const handleInviteReceived = (msg) => {
      const payload = JSON.parse(msg.payload);
      setPendingInvite(payload.from);
    };

    const handleGameStarted = (msg) => {
      const payload = JSON.parse(msg.payload);
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

    const handleInviteRejected = () => {
      setSentInviteTo(null);
    };

    const handleError = (msg) => {
      const payload = JSON.parse(msg.payload);
      console.warn('[Lobby] Error:', payload.message);
      setSentInviteTo(null);
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
                    Aguarde alguem entrar para convidar!
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-3.5 my-auto">
                  {onlineUsers.map((username) => (
                    <div
                      key={username}
                      className="w-full flex items-center justify-between py-2 px-3 sm:px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="font-serif text-[#38bdf8] text-sm sm:text-base font-semibold tracking-wide drop-shadow-sm">
                        {username}
                      </span>

                      {sentInviteTo === username ? (
                        <span className="text-amber-300 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider animate-pulse">
                          Convite enviado...
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInvite(username)}
                          disabled={!!sentInviteTo}
                          className="bg-[#22a6fe] hover:bg-[#1395ea] active:scale-95 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-[0_2px_8px_rgba(34,166,254,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
