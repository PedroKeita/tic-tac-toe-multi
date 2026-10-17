import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import GlobalInviteListener from './components/GlobalInviteListener';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalInviteListener />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
