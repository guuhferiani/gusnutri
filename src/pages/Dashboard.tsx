import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { Users, Calendar, AlertTriangle, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react';
import './Dashboard.css';

interface PacienteSemRetorno {
  id: string;
  nome: string;
  data_ultima_consulta: string;
  proximo_retorno: string | null;
}

interface DashboardData {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

const Dashboard: React.FC = () => {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;
    setIsLoadingData(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard', {
        headers: {
          'x-nutricionista-id': session.user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível carregar os dados do dashboard.');
      }

      const result = await response.json();
      setDashboardData(result);
    } catch (err: any) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err.message || 'Ocorreu um erro ao carregar os dados.');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isPending && !session) {
      console.log('Sem sessão no Dashboard, redirecionando para login');
      navigate('/login');
    } else if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session, isPending, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    try {
      const date = new Date(dataStr);
      const dia = String(date.getUTCDate()).padStart(2, '0');
      const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
      const ano = date.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch (e) {
      return dataStr;
    }
  };

  if (isPending || (session && isLoadingData && !dashboardData)) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando painel de controle...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2 className="error-title">Erro de Conexão</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchDashboardData}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Menu Lateral Fixo */}
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar-logo">
          <h1 className="sidebar-logo-text">GusNutri</h1>
        </Link>

        <nav className="sidebar-menu">
          <Link to="/dashboard" className="menu-item active">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/pacientes" className="menu-item">
            <Users size={20} />
            Pacientes
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name" title={session.user.name}>
              {session.user.name}
            </span>
            <span className="user-email" title={session.user.email}>
              {session.user.email}
            </span>
          </div>
          <button onClick={handleSignOut} className="btn-signout">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Olá, {session.user.name}!</h1>
          <p className="dashboard-subtitle">Bem-vindo(a) de volta ao seu painel de controle.</p>
        </header>

        {/* Grid de Estatísticas */}
        <div className="stats-grid">
          {/* Card 1: Total de Pacientes Ativos */}
          <div className="stat-card">
            <div className="stat-icon-wrapper pacientes">
              <Users size={32} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{dashboardData?.totalPacientes ?? 0}</span>
              <span className="stat-label">Total de Pacientes</span>
            </div>
          </div>

          {/* Card 2: Consultas da Semana */}
          <div className="stat-card">
            <div className="stat-icon-wrapper consultas">
              <Calendar size={32} />
            </div>
            <div className="stat-details">
              <span className="stat-value">{dashboardData?.consultasSemana ?? 0}</span>
              <span className="stat-label">Consultas da Semana</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pacientes Sem Retorno */}
        <div className="list-card">
          <div className="list-card-header">
            <AlertTriangle className="list-card-icon" size={24} />
            <h2 className="list-card-title">Pacientes sem retorno (+30 dias)</h2>
          </div>

          {dashboardData && dashboardData.pacientesSemRetorno.length > 0 ? (
            <div className="pacientes-sem-retorno-list">
              {dashboardData.pacientesSemRetorno.map((paciente) => (
                <Link
                  key={paciente.id}
                  to={`/pacientes/${paciente.id}`}
                  className="paciente-item-link"
                >
                  <span className="paciente-nome">{paciente.nome}</span>
                  <div className="paciente-meta">
                    <span className="paciente-data-badge">
                      Última consulta: {formatarData(paciente.data_ultima_consulta)}
                    </span>
                    <ChevronRight className="chevron-icon" size={18} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">Nenhum paciente sem retorno no momento</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
