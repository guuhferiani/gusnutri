import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { Users, LayoutDashboard, LogOut } from 'lucide-react';
import './Pacientes.css';

interface Paciente {
  id: string;
  nome: string;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  data_ultima_consulta: string | null;
}

export default function Pacientes() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nutricionistaId = session?.user?.id;

  useEffect(() => {
    // Redireciona para o login se não estiver logado e a sessão terminou de carregar
    if (!isPending && !session) {
      navigate('/login');
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (!nutricionistaId) return;

    const fetchPacientes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = search 
          ? `/api/pacientes?search=${encodeURIComponent(search)}` 
          : '/api/pacientes';
          
        const response = await fetch(url, {
          headers: {
            'x-nutricionista-id': nutricionistaId,
          },
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar pacientes');
        }

        const data = await response.json();
        setPacientes(data);
      } catch (err: any) {
        console.error(err);
        setError('Ocorreu um erro ao carregar a lista de pacientes.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce simples para a busca
    const delayDebounceFn = setTimeout(() => {
      fetchPacientes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [nutricionistaId, search]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return 'Sem consultas registradas';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatarObjetivos = (paciente: Paciente) => {
    const list: string[] = [];
    if (paciente.objetivos && paciente.objetivos.length > 0) {
      list.push(...paciente.objetivos);
    }
    if (paciente.objetivo_texto) {
      list.push(paciente.objetivo_texto);
    }
    return list.slice(0, 3); // Limita em 3 tags para manter o layout limpo
  };

  if (isPending) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Carregando sessão...</p>
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
          <Link to="/dashboard" className="menu-item">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link to="/pacientes" className="menu-item active">
            <Users size={20} />
            Pacientes
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name" title={session?.user?.name || ''}>
              {session?.user?.name}
            </span>
            <span className="user-email" title={session?.user?.email || ''}>
              {session?.user?.email}
            </span>
          </div>
          <button onClick={handleLogout} className="btn-signout">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>Pacientes</h1>
            <p>Gerencie e busque os pacientes do seu consultório</p>
          </div>
          <Link to="/pacientes/novo" className="btn-primary">
            <span className="btn-icon">+</span> Novo Paciente
          </Link>
        </header>

        {/* Barra de Busca */}
        <section className="search-section">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar paciente por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {/* Resultados da Listagem */}
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando pacientes...</p>
          </div>
        ) : error ? (
          <div className="error-card">{error}</div>
        ) : pacientes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>Nenhum paciente cadastrado ainda</h3>
            <p>Comece criando a ficha de um novo paciente para o seu consultório.</p>
            <Link to="/pacientes/novo" className="btn-primary" style={{ marginTop: '1rem' }}>
              Cadastrar Primeiro Paciente
            </Link>
          </div>
        ) : (
          <div className="pacientes-grid">
            {pacientes.map((paciente) => {
              const tags = formatarObjetivos(paciente);
              return (
                <div 
                  key={paciente.id} 
                  className="paciente-card"
                  onClick={() => navigate(`/pacientes/${paciente.id}`)}
                >
                  <div className="paciente-card-header">
                    <div className="avatar-placeholder">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="paciente-name">{paciente.nome}</h3>
                      <span className="paciente-consult">
                        Última consulta: {formatarData(paciente.data_ultima_consulta)}
                      </span>
                    </div>
                  </div>
                  <div className="paciente-card-body">
                    {tags.length > 0 ? (
                      <div className="tags-container">
                        {tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-tags">Sem objetivos definidos</span>
                    )}
                  </div>
                  <div className="paciente-card-footer">
                    <span className="view-profile-link">Ver Perfil Completo &rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
