import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Register() {
  const navigate = useNavigate();
  const { register, login, isLoading, error: authError, setError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [localErrors, setLocalErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'O username e obrigatorio.';
    }
    if (!formData.password) {
      errors.password = 'A senha e obrigatoria.';
    } else if (formData.password.length < 6) {
      errors.password = 'A senha deve ter no minimo 6 caracteres.';
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirme sua senha.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'As senhas nao coincidem.';
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
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
      await login(formData.username, formData.password);
      navigate('/game-mode');
    } catch (err) {
      console.error('Falha no registro:', err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card>
        <HeaderBar title="REGISTRO" />

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center space-y-3.5 my-auto">
          <div className="w-full">
            <Input
              id="username"
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              error={localErrors.username}
              isActive={true}
              autoComplete="username"
            />
          </div>

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

          {authError && (
            <div className="w-full p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium">
              {authError}
            </div>
          )}

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

          <div className="pt-2">
            <Link
              to="/login"
              className="text-xs text-neutral-500 hover:text-neutral-800 underline transition-colors"
            >
              Ja possui uma conta? Fazer login
            </Link>
          </div>
        </form>

        <div className="h-4" />
      </Card>
    </div>
  );
}
