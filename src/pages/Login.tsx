import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, useSession } from '../lib/auth';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      console.log("Sessão detectada, redirecionando para dashboard");
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Tentando login...", { email });
      const result = await signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      });

      console.log("Resultado do login:", result);

      if (result && result.error) {
        setError(result.error.message || 'E-mail ou senha incorretos.');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('Erro ao tentar entrar.');
      console.error("Erro no login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <h1 className="logo-text">GusNutri</h1>
          </div>
          <p>Acesse sua plataforma de nutrição</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem uma conta? <Link to="/register">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
