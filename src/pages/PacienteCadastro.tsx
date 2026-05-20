import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { Users, LayoutDashboard, LogOut } from 'lucide-react';
import './PacienteCadastro.css';

export default function PacienteCadastro() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nutricionistaId = session?.user?.id;

  // Redirecionamento de segurança
  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login');
    }
  }, [session, isPending, navigate]);

  // Form States
  // Aba 1 — Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [idade, setIdade] = useState<number | null>(null);
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 — Clínico
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [imc, setImc] = useState<number | null>(null);
  
  // Objetivos
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoTextoLivre, setObjetivoTextoLivre] = useState('');
  
  const [nivelAtividade, setNivelAtividade] = useState('');
  
  // Patologias, Restrições, Alergias
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [patologiaLivre, setPatologiaLivre] = useState('');
  
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [restricaoLivre, setRestricaoLivre] = useState('');
  
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [alergiaLivre, setAlergiaLivre] = useState('');
  
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [aguaPorDia, setAguaPorDia] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Efeitos de cálculos em tempo real
  // 1. Calcula a idade ao mudar a data de nascimento
  useEffect(() => {
    if (!dataNascimento) {
      setIdade(null);
      return;
    }
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let calcIdade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      calcIdade--;
    }
    setIdade(calcIdade >= 0 ? calcIdade : 0);
  }, [dataNascimento]);

  // 2. Calcula o IMC
  useEffect(() => {
    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);
    if (!pesoNum || !alturaNum) {
      setImc(null);
      return;
    }
    const alturaMeters = alturaNum / 100;
    const calcImc = pesoNum / (alturaMeters * alturaMeters);
    setImc(parseFloat(calcImc.toFixed(2)));
  }, [peso, altura]);

  // Funções de Evento
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const handleBlurHora = (valor: string, setValor: React.Dispatch<React.SetStateAction<string>>) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    if (!apenasNumeros) return;
    
    let horas = 0;
    let minutos = 0;
    
    if (apenasNumeros.length <= 2) {
      horas = parseInt(apenasNumeros);
    } else if (apenasNumeros.length === 3) {
      horas = parseInt(apenasNumeros.substring(0, 1));
      minutos = parseInt(apenasNumeros.substring(1));
    } else {
      horas = parseInt(apenasNumeros.substring(0, 2));
      minutos = parseInt(apenasNumeros.substring(2, 4));
    }
    
    if (horas > 23) horas = 23;
    if (minutos > 59) minutos = 59;
    
    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    
    setValor(`${horasStr}:${minutosStr}`);
  };

  const toggleArraySelection = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    valor: string
  ) => {
    if (valor === 'Nenhum') {
      if (array.includes('Nenhum')) {
        setArray([]);
      } else {
        setArray(['Nenhum']);
      }
    } else {
      let temp = [...array].filter(x => x !== 'Nenhum');
      if (temp.includes(valor)) {
        temp = temp.filter(x => x !== valor);
      } else {
        temp.push(valor);
      }
      setArray(temp);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      setError('O nome completo é obrigatório');
      setActiveTab('pessoal');
      return;
    }

    if (!nutricionistaId) {
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Preparar as listas de arrays incluindo o texto livre correspondente caso seja preenchido
    const objetivos = [...objetivosSelecionados];
    
    const patologias = [...patologiasSelecionadas];
    if (patologiaLivre.trim()) {
      patologias.push(patologiaLivre.trim());
    }

    const restricoes_alimentares = [...restricoesSelecionadas];
    if (restricaoLivre.trim()) {
      restricoes_alimentares.push(restricaoLivre.trim());
    }

    const alergias = [...alergiasSelecionadas];
    if (alergiaLivre.trim()) {
      alergias.push(alergiaLivre.trim());
    }

    const payload = {
      nome,
      data_nascimento: dataNascimento || null,
      sexo: sexo || null,
      telefone: telefone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      peso_inicial: peso ? parseFloat(peso) : null,
      altura: altura ? parseFloat(altura) : null,
      objetivos: objetivos.length > 0 ? objetivos : null,
      objetivo_texto: objetivoTextoLivre || null,
      nivel_atividade: nivelAtividade || null,
      patologias: patologias.length > 0 ? patologias : null,
      restricoes_alimentares: restricoes_alimentares.length > 0 ? restricoes_alimentares : null,
      alergias: alergias.length > 0 ? alergias : null,
      medicamentos: medicamentos || null,
      suplementos: suplementos || null,
      refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia) : null,
      horario_acorda: horarioAcorda || null,
      horario_dorme: horarioDorme || null,
      litros_agua: aguaPorDia ? parseFloat(aguaPorDia) : null,
      atividade_fisica: praticaAtividade,
      atividade_fisica_descricao: praticaAtividade ? atividadeDescricao : null,
      observacoes: observacoes || null
    };

    try {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nutricionista-id': nutricionistaId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar paciente');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Feedback visual e redirecionamento para o perfil
      setTimeout(() => {
        navigate(`/pacientes/${data.id}`);
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao cadastrar paciente. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
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
            <div className="breadcrumb-nav">
              <Link to="/pacientes">Pacientes</Link> &rarr; <span>Novo Paciente</span>
            </div>
            <h1>Cadastrar Paciente</h1>
            <p>Insira as informações para criar a ficha do paciente</p>
          </div>
        </header>

        {success && (
          <div className="success-toast">
            <span>✓</span> Paciente cadastrado com sucesso! Redirecionando...
          </div>
        )}

        {error && (
          <div className="error-toast">
            <span>✗</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="cadastro-form">
          {/* Menu de Abas */}
          <div className="tabs-nav">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveTab('pessoal')}
            >
              <span className="tab-number">1</span> Pessoal
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinico')}
            >
              <span className="tab-number">2</span> Clínico
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveTab('habitos')}
            >
              <span className="tab-number">3</span> Hábitos
            </button>
          </div>

          {/* Área do Conteúdo das Abas */}
          <div className="tab-content">
            
            {/* Aba 1: Pessoal */}
            {activeTab === 'pessoal' && (
              <div className="tab-panel animate-fade">
                <div className="form-grid">
                  <div className="form-item full-width">
                    <label htmlFor="nome">Nome Completo *</label>
                    <input
                      id="nome"
                      type="text"
                      placeholder="Nome completo do paciente"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label htmlFor="nascimento">Data de Nascimento</label>
                    <div className="nasc-container">
                      <input
                        id="nascimento"
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                      />
                      {idade !== null && (
                        <span className="idade-badge">{idade} anos</span>
                      )}
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="sexo">Sexo</label>
                    <select
                      id="sexo"
                      value={sexo}
                      onChange={(e) => setSexo(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-item">
                    <label htmlFor="telefone">Telefone</label>
                    <input
                      id="telefone"
                      type="tel"
                      placeholder="(00) 0000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>

                  <div className="form-item">
                    <label htmlFor="whatsapp">WhatsApp</label>
                    <input
                      id="whatsapp"
                      type="tel"
                      placeholder="(00) 90000-0000"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>

                  <div className="form-item full-width">
                    <label htmlFor="email">E-mail</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="exemplo@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Aba 2: Clínico */}
            {activeTab === 'clinico' && (
              <div className="tab-panel animate-fade">
                <div className="form-grid">
                  <div className="form-item">
                    <label htmlFor="peso">Peso Atual</label>
                    <div className="input-suffix-wrapper">
                      <input
                        id="peso"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                      />
                      <span className="suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="altura">Altura</label>
                    <div className="input-suffix-wrapper">
                      <input
                        id="altura"
                        type="number"
                        placeholder="0"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                      />
                      <span className="suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label>IMC Calculado</label>
                    <input
                      type="text"
                      className="imc-readonly-input"
                      value={imc !== null ? `${imc} (${imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidade'})` : 'Aguardando peso/altura'}
                      readOnly
                    />
                  </div>

                  <div className="form-item">
                    <label htmlFor="nivelAtividade">Nível de Atividade Física</label>
                    <select
                      id="nivelAtividade"
                      value={nivelAtividade}
                      onChange={(e) => setNivelAtividade(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>

                  {/* Objetivos */}
                  <div className="form-item full-width">
                    <label>Objetivos (Múltipla Escolha)</label>
                    <div className="checkbox-grid">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map((obj) => (
                        <label key={obj} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={objetivosSelecionados.includes(obj)}
                            onChange={() => {
                              const list = [...objetivosSelecionados];
                              if (list.includes(obj)) {
                                setObjetivosSelecionados(list.filter(x => x !== obj));
                              } else {
                                list.push(obj);
                                setObjetivosSelecionados(list);
                              }
                            }}
                          />
                          {obj}
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Outro objetivo (texto livre)..."
                      className="text-input-margin"
                      value={objetivoTextoLivre}
                      onChange={(e) => setObjetivoTextoLivre(e.target.value)}
                    />
                  </div>

                  {/* Patologias */}
                  <div className="form-item full-width">
                    <label>Patologias ou Condições de Saúde</label>
                    <div className="checkbox-grid">
                      {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto', 'Nenhum'].map((pat) => (
                        <label key={pat} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={patologiasSelecionadas.includes(pat)}
                            onChange={() => toggleArraySelection(patologiasSelecionadas, setPatologiasSelecionadas, pat)}
                          />
                          {pat}
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Adicionar patologia personalizada..."
                      className="text-input-margin"
                      value={patologiaLivre}
                      disabled={patologiasSelecionadas.includes('Nenhum')}
                      onChange={(e) => setPatologiaLivre(e.target.value)}
                    />
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="form-item full-width">
                    <label>Restrições Alimentares</label>
                    <div className="checkbox-grid">
                      {['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar', 'Nenhum'].map((rest) => (
                        <label key={rest} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={restricoesSelecionadas.includes(rest)}
                            onChange={() => toggleArraySelection(restricoesSelecionadas, setRestricoesSelecionadas, rest)}
                          />
                          {rest}
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Adicionar restrição personalizada..."
                      className="text-input-margin"
                      value={restricaoLivre}
                      disabled={restricoesSelecionadas.includes('Nenhum')}
                      onChange={(e) => setRestricaoLivre(e.target.value)}
                    />
                  </div>

                  {/* Alergias Alimentares */}
                  <div className="form-item full-width">
                    <label>Alergias Alimentares</label>
                    <div className="checkbox-grid">
                      {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar', 'Nenhum'].map((al) => (
                        <label key={al} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={alergiasSelecionadas.includes(al)}
                            onChange={() => toggleArraySelection(alergiasSelecionadas, setAlergiasSelecionadas, al)}
                          />
                          {al}
                        </label>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Adicionar alergia personalizada..."
                      className="text-input-margin"
                      value={alergiaLivre}
                      disabled={alergiasSelecionadas.includes('Nenhum')}
                      onChange={(e) => setAlergiaLivre(e.target.value)}
                    />
                  </div>

                  <div className="form-item full-width">
                    <label htmlFor="medicamentos">Medicamentos Contínuos</label>
                    <textarea
                      id="medicamentos"
                      placeholder="Liste os medicamentos que o paciente faz uso constante..."
                      rows={2}
                      value={medicamentos}
                      onChange={(e) => setMedicamentos(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-item full-width">
                    <label htmlFor="suplementos">Suplementos em Uso</label>
                    <textarea
                      id="suplementos"
                      placeholder="Liste os suplementos alimentares ou vitamínicos..."
                      rows={2}
                      value={suplementos}
                      onChange={(e) => setSuplementos(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Aba 3: Hábitos */}
            {activeTab === 'habitos' && (
              <div className="tab-panel animate-fade">
                <div className="form-grid">
                  <div className="form-item">
                    <label htmlFor="refeicoes">Refeições por Dia</label>
                    <input
                      id="refeicoes"
                      type="number"
                      placeholder="Ex: 5"
                      value={refeicoesPorDia}
                      onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    />
                  </div>

                  <div className="form-item">
                    <label htmlFor="agua">Quantidade de Água p/ Dia</label>
                    <div className="input-suffix-wrapper">
                      <input
                        id="agua"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={aguaPorDia}
                        onChange={(e) => setAguaPorDia(e.target.value)}
                      />
                      <span className="suffix">litros</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="acorda">Horário que Acorda</label>
                    <input
                      id="acorda"
                      type="text"
                      placeholder="Ex: 6 ou 630"
                      value={horarioAcorda}
                      onChange={(e) => setHorarioAcorda(e.target.value)}
                      onBlur={() => handleBlurHora(horarioAcorda, setHorarioAcorda)}
                    />
                  </div>

                  <div className="form-item">
                    <label htmlFor="dorme">Horário que Dorme</label>
                    <input
                      id="dorme"
                      type="text"
                      placeholder="Ex: 23 ou 2230"
                      value={horarioDorme}
                      onChange={(e) => setHorarioDorme(e.target.value)}
                      onBlur={() => handleBlurHora(horarioDorme, setHorarioDorme)}
                    />
                  </div>

                  <div className="form-item full-width">
                    <label>Pratica Atividade Física?</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="atividadeFisica"
                          checked={praticaAtividade === true}
                          onChange={() => setPraticaAtividade(true)}
                        />
                        Sim
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="atividadeFisica"
                          checked={praticaAtividade === false}
                          onChange={() => setPraticaAtividade(false)}
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  {praticaAtividade && (
                    <div className="form-item full-width animate-fade">
                      <label htmlFor="atividadeDescricao">Descrição da Atividade Física e Frequência</label>
                      <textarea
                        id="atividadeDescricao"
                        placeholder="Ex: Musculação 4x na semana, Corrida de rua no final de semana..."
                        rows={2}
                        value={atividadeDescricao}
                        onChange={(e) => setAtividadeDescricao(e.target.value)}
                      ></textarea>
                    </div>
                  )}

                  <div className="form-item full-width">
                    <label htmlFor="observacoes">Observações Gerais</label>
                    <textarea
                      id="observacoes"
                      placeholder="Insira qualquer detalhe extra sobre os hábitos e histórico do paciente..."
                      rows={3}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões do Formulário */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (activeTab === 'clinico') setActiveTab('pessoal');
                else if (activeTab === 'habitos') setActiveTab('clinico');
                else navigate('/pacientes');
              }}
            >
              {activeTab === 'pessoal' ? 'Cancelar' : 'Voltar'}
            </button>

            {activeTab !== 'habitos' ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (activeTab === 'pessoal') setActiveTab('clinico');
                  else if (activeTab === 'clinico') setActiveTab('habitos');
                }}
              >
                Continuar &rarr;
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary success-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Salvando...' : 'Salvar Ficha do Paciente'}
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
