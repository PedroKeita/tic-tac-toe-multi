import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Lobby from '../pages/Lobby';
import GameMode from '../pages/GameMode';
import SinglePlayerGame from '../pages/SinglePlayerGame';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Seleção de Modos de Jogo */}
      <Route
        path="/game-mode"
        element={
          <ProtectedRoute>
            <GameMode />
          </ProtectedRoute>
        }
      />

      {/* Partida Single Player contra o Bot */}
      <Route
        path="/game/singleplayer"
        element={
          <ProtectedRoute>
            <SinglePlayerGame />
          </ProtectedRoute>
        }
      />

      {/* Lobby / Multiplayer */}
      <Route
        path="/lobby"
        element={
          <ProtectedRoute>
            <Lobby />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
