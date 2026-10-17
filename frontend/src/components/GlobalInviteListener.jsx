import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../hooks/useGameSocket';
import { safeParsePayload } from '../utils/safeJson';

export default function GlobalInviteListener() {
  const { isAuthenticated } = useAuth();
  const { send, on, off, isConnected } = useGameSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingInvite, setPendingInvite] = useState(null);

  const isInLobby = location.pathname === '/lobby';

  useEffect(() => {
    if (!isAuthenticated || !isConnected || isInLobby) {
      setPendingInvite(null);
      return;
    }

    const handleInviteReceived = (msg) => {
      const payload = safeParsePayload(msg.payload, {});
      if (payload.from) {
        setPendingInvite(payload.from);
      }
    };

    on('INVITE_RECEIVED', handleInviteReceived);
    return () => off('INVITE_RECEIVED', handleInviteReceived);
  }, [isAuthenticated, isConnected, isInLobby, on, off]);

  useEffect(() => {
    if (!pendingInvite) return;
    const timer = setTimeout(() => setPendingInvite(null), 30000);
    return () => clearTimeout(timer);
  }, [pendingInvite]);

  const handleAccept = useCallback(() => {
    if (!pendingInvite) return;
    send('INVITE_ACCEPTED', { to: pendingInvite, from: pendingInvite });
    setPendingInvite(null);
    navigate('/lobby');
  }, [pendingInvite, send, navigate]);

  const handleReject = useCallback(() => {
    if (!pendingInvite) return;
    send('INVITE_REJECTED', { to: pendingInvite, from: pendingInvite });
    setPendingInvite(null);
  }, [pendingInvite, send]);

  if (!pendingInvite || isInLobby) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md p-4 rounded-2xl bg-amber-50 border border-amber-300 shadow-xl flex flex-col items-center gap-3 animate-fadeIn">
      <p className="text-sm font-semibold text-amber-900 text-center">
        🎮 <strong>{pendingInvite}</strong> te convidou para jogar!
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold px-5 py-2 rounded-xl shadow transition-all cursor-pointer"
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="bg-red-400 hover:bg-red-500 active:scale-95 text-white text-xs font-bold px-5 py-2 rounded-xl shadow transition-all cursor-pointer"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
