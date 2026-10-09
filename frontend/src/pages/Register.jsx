import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError, setError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
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
    } else if (formData.password.length < 6) {
      errors.password = 'A senha deve ter no mínimo 6 caracteres.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirme sua senha.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.';
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
      await register({
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      navigate('/game-mode');
    } catch (err) {
      console.error('Falha no registro:', err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card>
        {/* Cabeçalho com título serifado e barra bipartida */}
        <HeaderBar title="REGISTRO" />

        {/* Formulário Centralizado */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center space-y-3.5 my-auto">
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
              autoComplete="new-password"
            />
          </div>

          {/* Campo Confirmar Senha */}
          <div className="w-full">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={localErrors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          {/* Mensagem de Erro Geral */}
          {authError && (
            <div className="w-full p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
              {authError}
            </div>
          )}

          {/* Botão de Envio (Continuar) */}
          <div className="w-full pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="py-3 text-base shadow-lg"
            >
              Continuar
            </Button>
          </div>

          {/* Opção de autenticação social (conforme layout do Figma) */}
          <div className="pt-2 flex flex-col items-center space-y-2">
            <span className="text-xs font-semibold text-blue-600">
              ou continuar com
            </span>
            <button
              type="button"
              onClick={() => alert('Login com Google simulado!')}
              className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition-all rounded-lg shadow-sm flex items-center justify-center font-bold text-neutral-700 text-sm cursor-pointer"
              title="Continuar com Google"
            >
              G
            </button>
          </div>

          {/* Link para retornar ao Login */}
          <div className="pt-2">
            <Link
              to="/login"
              className="text-xs text-neutral-500 hover:text-neutral-800 underline transition-colors"
            >
              Já possui uma conta? Fazer login
            </Link>
          </div>
        </form>

        {/* Rodapé / Espaçador para manter alinhamento do card */}
        <div className="h-4" />
      </Card>
    </div>
  );
}
