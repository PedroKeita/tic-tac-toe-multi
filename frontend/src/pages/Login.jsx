import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, setError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [localErrors, setLocalErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Insira um e-mail válido.';
    }

    if (!formData.password) {
      errors.password = 'A senha é obrigatória.';
    }

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (localErrors[id]) {
      setLocalErrors((prev) => ({ ...prev, [id]: null }));
    }
    if (authError) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(formData.email, formData.password);
      navigate('/game-mode');
    } catch (err) {
      console.error('Falha no login:', err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card>
        {/* Cabeçalho com título estilizado e barra bipartida */}
        <HeaderBar title="LOGIN" />

        {/* Formulário Centralizado */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center space-y-4 my-auto">
          {/* Label de seção sutil conforme o layout Figma */}
          <div className="w-full text-left">
            <span className="text-xs font-semibold text-neutral-400">Frame</span>
          </div>

          {/* Campo Email */}
          <div className="w-full">
            <Input
              id="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              error={localErrors.email}
              isActive={true}
              autoComplete="email"
            />
          </div>

          {/* Campo Senha */}
          <div className="w-full">
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              error={localErrors.password}
              autoComplete="current-password"
            />
          </div>

          {/* Mensagem de Erro Geral da Autenticação */}
          {authError && (
            <div className="w-full p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          {/* Botão de Envio (Continue) */}
          <div className="w-full pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="py-3 text-base shadow-lg"
            >
              Continue
            </Button>
          </div>

          {/* Botão Secundário para Cadastro (Criar uma conta) */}
          <div className="w-full pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/register')}
              className="py-2.5 text-sm"
            >
              Criar uma conta
            </Button>
          </div>
        </form>

        {/* Rodapé / Espaçador para manter alinhamento do card */}
        <div className="h-6" />
      </Card>
    </div>
  );
}
