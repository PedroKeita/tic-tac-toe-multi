import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import HeaderBar from '../components/HeaderBar';
import Input from '../components/Input';
import Button from '../components/Button';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, setError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [localErrors, setLocalErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'O username e obrigatorio.';
    }
    if (!formData.password) {
      errors.password = 'A senha e obrigatoria.';
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
      await login(formData.username, formData.password);
      navigate('/game-mode');
    } catch (err) {
      console.error('Falha no login:', err);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#eceef2]">
      <Card>
        <HeaderBar title="LOGIN" />

        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center space-y-4 my-auto">

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
              autoComplete="current-password"
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
              Continue
            </Button>
          </div>

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

        <div className="h-6" />
      </Card>
    </div>
  );
}
