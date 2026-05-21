import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { Users, LayoutDashboard, LogOut, ArrowLeft, Save, Plus, ChevronDown } from 'lucide-react';
import './PacientePerfil.css';

interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  peso_inicial: string | number | null;
  altura: string | number | null;
  objetivos: string[] | null;
  objetivo_texto: string | null;
  nivel_atividade: string | null;
  patologias: string[] | null;
  restricoes_alimentares: string[] | null;
  alergias: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  refeicoes_por_dia: number | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
  litros_agua: string | number | null;
  atividade_fisica: boolean | null;
  atividade_fisica_descricao: string | null;
  observacoes: string | null;
  created_at: string;
}

interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso: string;
  cintura: string | null;
  quadril: string | null;
  percentual_gordura: string | null;
  observacoes: string | null;
  proximo_retorno: string | null;
  created_at: string;
}

interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

export default function PacientePerfil() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  // Estados principais de dados
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);

  // Estados de controle da página
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingConsulta, setIsSavingConsulta] = useState(false);
  const [expandedPlanoId, setExpandedPlanoId] = useState<string | null>(null);
  const [showConsultaModal, setShowConsultaModal] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  
  // Feedback Toasts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Estados do formulário de dados do paciente (Seção 1)
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [patologiaLivre, setPatologiaLivre] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [restricaoLivre, setRestricaoLivre] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaLivre, setAlergiaLivre] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [aguaPorDia, setAguaPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estados de cálculo em tempo real
  const [idade, setIdade] = useState<number | null>(null);
  const [imc, setImc] = useState<number | null>(null);

  // Estados do formulário de Nova Consulta
  const [consultaData, setConsultaData] = useState(new Date().toISOString().split('T')[0]);
  const [consultaPeso, setConsultaPeso] = useState('');
  const [consultaCintura, setConsultaCintura] = useState('');
  const [consultaQuadril, setConsultaQuadril] = useState('');
  const [consultaGordura, setConsultaGordura] = useState('');
  const [consultaObs, setConsultaObs] = useState('');
  const [consultaRetorno, setConsultaRetorno] = useState('');

  // Estado para Tooltip do Gráfico SVG
  const [activeTooltip, setActiveTooltip] = useState<{
    peso: string;
    data: string;
    x: number;
    y: number;
  } | null>(null);

  const nutricionistaId = session?.user?.id;

  // Redirecionamento se não logado
  useEffect(() => {
    if (!isPending && !session) {
      navigate('/login');
    }
  }, [session, isPending, navigate]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Carregamento inicial de dados
  useEffect(() => {
    if (!nutricionistaId || !id) return;

    const fetchAllData = async () => {
      setIsLoadingPage(true);
      setPageError(null);
      try {
        const headers = { 'x-nutricionista-id': nutricionistaId };

        // 1. Carregar Paciente
        const resPaciente = await fetch(`/api/pacientes/${id}`, { headers });
        if (!resPaciente.ok) {
          throw new Error('Falha ao carregar os dados do paciente');
        }
        const dataPac: Paciente = await resPaciente.json();
        setPaciente(dataPac);
        preencherFormulario(dataPac);

        // 2. Carregar Consultas
        const resConsultas = await fetch(`/api/pacientes/${id}/consultas`, { headers });
        if (resConsultas.ok) {
          const dataCons: Consulta[] = await resConsultas.json();
          setConsultas(dataCons);
        }

        // 3. Carregar Planos
        const resPlanos = await fetch(`/api/pacientes/${id}/planos-alimentares`, { headers });
        if (resPlanos.ok) {
          const dataPlano: PlanoAlimentar[] = await resPlanos.json();
          setPlanos(dataPlano);
        }

      } catch (err: any) {
        console.error(err);
        setPageError(err.message || 'Erro ao carregar dados do perfil.');
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchAllData();
  }, [id, nutricionistaId]);

  // Calcula idade ao mudar data de nascimento
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

  // Calcula IMC ao mudar peso/altura
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

  const preencherFormulario = (pac: Paciente) => {
    setNome(pac.nome || '');
    setDataNascimento(pac.data_nascimento ? pac.data_nascimento.split('T')[0] : '');
    setSexo(pac.sexo || '');
    setTelefone(pac.telefone || '');
    setWhatsapp(pac.whatsapp || '');
    setEmail(pac.email || '');
    setPeso(pac.peso_inicial ? pac.peso_inicial.toString() : '');
    setAltura(pac.altura ? pac.altura.toString() : '');
    setNivelAtividade(pac.nivel_atividade || '');
    setObjetivos(pac.objetivos || []);
    setObjetivoTexto(pac.objetivo_texto || '');

    // Separar patologias padrões da personalizada
    const patList = pac.patologias || [];
    const padroesPat = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto', 'Nenhum'];
    const selecionadasPat = patList.filter(p => padroesPat.includes(p));
    const livresPat = patList.filter(p => !padroesPat.includes(p));
    setPatologias(selecionadasPat);
    setPatologiaLivre(livresPat.join(', '));

    // Separar restrições padrões da personalizada
    const restList = pac.restricoes_alimentares || [];
    const padroesRest = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar', 'Nenhum'];
    const selecionadasRest = restList.filter(r => padroesRest.includes(r));
    const livresRest = restList.filter(r => !padroesRest.includes(r));
    setRestricoes(selecionadasRest);
    setRestricaoLivre(livresRest.join(', '));

    // Separar alergias padrões da personalizada
    const alList = pac.alergias || [];
    const padroesAl = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar', 'Nenhum'];
    const selecionadasAl = alList.filter(a => padroesAl.includes(a));
    const livresAl = alList.filter(a => !padroesAl.includes(a));
    setAlergias(selecionadasAl);
    setAlergiaLivre(livresAl.join(', '));

    setMedicamentos(pac.medicamentos || '');
    setSuplementos(pac.suplementos || '');
    setRefeicoesPorDia(pac.refeicoes_por_dia ? pac.refeicoes_por_dia.toString() : '');
    setAguaPorDia(pac.litros_agua ? pac.litros_agua.toString() : '');
    setHorarioAcorda(pac.horario_acorda || '');
    setHorarioDorme(pac.horario_dorme || '');
    setPraticaAtividade(pac.atividade_fisica);
    setAtividadeDescricao(pac.atividade_fisica_descricao || '');
    setObservacoes(pac.observacoes || '');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
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

  // Salvar ficha do paciente
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      setToast({ message: 'O nome completo é obrigatório', type: 'error' });
      return;
    }
    if (!id || !nutricionistaId) return;

    setIsSavingProfile(true);

    // Junta listas personalizadas às padrões
    const finalPatologias = [...patologias];
    if (patologiaLivre.trim()) {
      patologiaLivre.split(',').forEach(item => {
        if (item.trim()) finalPatologias.push(item.trim());
      });
    }

    const finalRestricoes = [...restricoes];
    if (restricaoLivre.trim()) {
      restricaoLivre.split(',').forEach(item => {
        if (item.trim()) finalRestricoes.push(item.trim());
      });
    }

    const finalAlergias = [...alergias];
    if (alergiaLivre.trim()) {
      alergiaLivre.split(',').forEach(item => {
        if (item.trim()) finalAlergias.push(item.trim());
      });
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
      objetivo_texto: objetivoTexto || null,
      nivel_atividade: nivelAtividade || null,
      patologias: finalPatologias.length > 0 ? finalPatologias : null,
      restricoes_alimentares: finalRestricoes.length > 0 ? finalRestricoes : null,
      alergias: finalAlergias.length > 0 ? finalAlergias : null,
      medicamentos: medicamentos || null,
      suplementos: suplementos || null,
      refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia) : null,
      horario_acorda: horarioAcorda || null,
      horario_dorme: horarioDorme || null,
      litros_agua: aguaPorDia ? parseFloat(aguaPorDia) : null,
      atividade_fisica: PraticaAtividade,
      atividade_fisica_descricao: PraticaAtividade ? atividadeDescricao : null,
      observacoes: observacoes || null
    };

    try {
      const response = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-nutricionista-id': nutricionistaId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao atualizar dados do paciente');
      }

      setToast({ message: 'Ficha do paciente atualizada com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Erro ao salvar alterações.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Salvar nova consulta
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultaPeso) {
      setToast({ message: 'Peso atual é obrigatório', type: 'error' });
      return;
    }
    if (!id || !nutricionistaId) return;

    setIsSavingConsulta(true);

    const payload = {
      data_consulta: consultaData,
      peso: consultaPeso,
      cintura: consultaCintura || null,
      quadril: consultaQuadril || null,
      percentual_gordura: consultaGordura || null,
      observacoes: consultaObs || null,
      proximo_retorno: consultaRetorno || null
    };

    try {
      const response = await fetch(`/api/pacientes/${id}/consultas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nutricionista-id': nutricionistaId
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar consulta');
      }

      setToast({ message: 'Consulta registrada com sucesso!', type: 'success' });
      setShowConsultaModal(false);

      // Limpar formulário do modal
      setConsultaPeso('');
      setConsultaCintura('');
      setConsultaQuadril('');
      setConsultaGordura('');
      setConsultaObs('');
      setConsultaRetorno('');
      setConsultaData(new Date().toISOString().split('T')[0]);

      // Atualizar lista de consultas para redesenhar o gráfico e a lista
      const resConsultas = await fetch(`/api/pacientes/${id}/consultas`, {
        headers: { 'x-nutricionista-id': nutricionistaId }
      });
      if (resConsultas.ok) {
        const dataCons = await resConsultas.json();
        setConsultas(dataCons);
      }

    } catch (err: any) {
      console.error(err);
      setToast({ message: err.message || 'Erro ao registrar consulta.', type: 'error' });
    } finally {
      setIsSavingConsulta(false);
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    // Lida com datas em formato ISO (YYYY-MM-DD) preservando o fuso horário local
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    const d = new Date(dataStr);
    return d.toLocaleDateString('pt-BR');
  };

  const formatarDataPlano = (dataStr: string) => {
    const d = new Date(dataStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderização estruturada de planos alimentares JSON
  const renderPlanoConteudo = (conteudo: any) => {
    if (!conteudo) return <div>Sem detalhes disponíveis.</div>;

    // Se o conteúdo tiver estrutura clássica de refeições
    if (conteudo.refeicoes && Array.isArray(conteudo.refeicoes)) {
      return (
        <div className="plano-meals-container">
          {conteudo.refeicoes.map((ref: any, idx: number) => (
            <div key={idx} className="plano-meal-card">
              <div className="plano-meal-header">
                <span>{ref.nome || `Refeição ${idx + 1}`}</span>
                <span>{ref.horario || ''}</span>
              </div>
              <ul className="plano-meal-foods">
                {Array.isArray(ref.alimentos) ? (
                  ref.alimentos.map((al: string, aIdx: number) => (
                    <li key={aIdx}>{al}</li>
                  ))
                ) : (
                  <li>{ref.alimentos || 'Nenhum alimento cadastrado'}</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    // Se for outro tipo de objeto
    if (typeof conteudo === 'object') {
      return (
        <pre style={{ margin: 0, padding: '1rem', backgroundColor: '#f5f7f6', borderRadius: '8px', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {JSON.stringify(conteudo, null, 2)}
        </pre>
      );
    }

    // Caso seja texto simples
    return <div style={{ whiteSpace: 'pre-wrap' }}>{String(conteudo)}</div>;
  };

  // Função para desenhar o Gráfico SVG dinâmico de evolução de Peso
  const renderPesoChart = () => {
    if (consultas.length === 0) {
      return (
        <div className="chart-empty">
          <span className="chart-empty-icon">📈</span>
          <p>Nenhuma consulta registrada ainda</p>
        </div>
      );
    }

    // Ordena do mais antigo para o mais recente para fins gráficos
    const ordenadas = [...consultas].sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());
    const pesos = ordenadas.map(c => parseFloat(c.peso));

    const minPeso = Math.min(...pesos);
    const maxPeso = Math.max(...pesos);
    const range = maxPeso - minPeso || 10;
    const padding = range * 0.2 || 2;
    const yMin = Math.max(0, minPeso - padding);
    const yMax = maxPeso + padding;

    // Configurações do ViewBox
    const svgWidth = 500;
    const svgHeight = 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Calcula coordenadas dos pontos
    const points = ordenadas.map((c, idx) => {
      const x = ordenadas.length > 1
        ? paddingLeft + (idx / (ordenadas.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
      const y = paddingTop + chartHeight - ((parseFloat(c.peso) - yMin) / (yMax - yMin)) * chartHeight;
      return { x, y, peso: c.peso, data: formatarData(c.data_consulta) };
    });

    // Cria os paths
    const linePath = points.map((p, idx) => (idx === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
    
    // Área sombreada sob a linha
    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    // Linhas de Grade Horizontais (Y)
    const gridLines = [];
    const gridCount = 3;
    for (let i = 0; i <= gridCount; i++) {
      const val = yMin + (i / gridCount) * (yMax - yMin);
      const y = paddingTop + chartHeight - (i / gridCount) * chartHeight;
      gridLines.push({ y, val: val.toFixed(1) });
    }

    return (
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="chart-svg">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4caf50" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4caf50" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade e Eixo Y */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={line.y} 
                x2={svgWidth - paddingRight} 
                y2={line.y} 
                stroke="#e8f5e9" 
                strokeWidth={1} 
                strokeDasharray="4 4"
              />
              <text 
                x={paddingLeft - 8} 
                y={line.y + 4} 
                fill="#888" 
                fontSize={9} 
                fontWeight={500} 
                textAnchor="end"
              >
                {line.val} kg
              </text>
            </g>
          ))}

          {/* Área sombreada */}
          {areaPath && (
            <path d={areaPath} fill="url(#chartGrad)" />
          )}

          {/* Linha principal */}
          {linePath && (
            <path 
              d={linePath} 
              fill="none" 
              stroke="#2e7d32" 
              strokeWidth={3} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Rótulo de datas no eixo X e pontos */}
          {points.map((p, idx) => {
            // Decidir se exibe a data no eixo X para evitar sobreposição
            const showDateLabel = points.length <= 6 || idx === 0 || idx === points.length - 1 || idx % 2 === 0;
            return (
              <g key={idx}>
                {showDateLabel && (
                  <text 
                    x={p.x} 
                    y={paddingTop + chartHeight + 16} 
                    fill="#888" 
                    fontSize={9} 
                    fontWeight={500} 
                    textAnchor="middle"
                  >
                    {p.data.substring(0, 5)} {/* Apenas DD/MM */}
                  </text>
                )}
                
                {/* Ponto interativo */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={5} 
                  fill="#ffffff" 
                  stroke="#2e7d32" 
                  strokeWidth={3} 
                  style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                  onMouseEnter={() => {
                    setActiveTooltip({
                      peso: p.peso,
                      data: p.data,
                      x: p.x,
                      y: p.y
                    });
                  }}
                  onMouseLeave={() => setActiveTooltip(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip dinâmico */}
        {activeTooltip && (
          <div 
            className="chart-tooltip animate-fade"
            style={{
              left: `${(activeTooltip.x / svgWidth) * 100}%`,
              top: `${(activeTooltip.y / svgHeight) * 100}%`
            }}
          >
            <div><strong>{activeTooltip.peso} kg</strong></div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{activeTooltip.data}</div>
          </div>
        )}
      </div>
    );
  };

  // Se carregando
  if (isPending || isLoadingPage) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Carregando perfil do paciente...</p>
      </div>
    );
  }

  // Se erro
  if (pageError) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#c62828' }}>Erro ao carregar página</h2>
        <p>{pageError}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-save-profile" style={{ margin: '2rem auto' }}>
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const PraticaAtividade = praticaAtividade;

  return (
    <div className="perfil-container">
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
        {/* Cabeçalho */}
        <header className="main-header">
          <div className="header-title">
            <button onClick={() => navigate('/pacientes')} className="btn-back-breadcrumb">
              <ArrowLeft size={16} /> Voltar para Pacientes
            </button>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.5rem' }}>
              <h1 style={{ margin: 0 }}>{paciente?.nome}</h1>
              {idade !== null && <span className="paciente-header-idade">{idade} anos</span>}
            </div>
            <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8 }}>Visualização e edição da ficha clínica do paciente</p>
          </div>
        </header>

        {/* Toasts */}
        {toast && (
          <div className={`toast-msg ${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '✗'}</span>
            {toast.message}
          </div>
        )}

        <div className="perfil-sections-grid">
          
          {/* Seção 1: Dados do Paciente */}
          <section className="perfil-card">
            <h2 className="perfil-card-title">
              <span>📋</span> Ficha do Paciente
            </h2>
            
            {/* Menu de Abas */}
            <div className="profile-tabs-nav">
              <button 
                type="button" 
                className={`profile-tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
                onClick={() => setActiveTab('pessoal')}
              >
                Pessoal
              </button>
              <button 
                type="button" 
                className={`profile-tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
                onClick={() => setActiveTab('clinico')}
              >
                Clínico
              </button>
              <button 
                type="button" 
                className={`profile-tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
                onClick={() => setActiveTab('habitos')}
              >
                Hábitos
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="cadastro-form" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
              <div className="tab-content" style={{ padding: 0, minHeight: 'auto', background: 'none' }}>
                
                {/* Aba Pessoal */}
                {activeTab === 'pessoal' && (
                  <div className="tab-panel animate-fade">
                    <div className="form-grid">
                      <div className="form-item full-width">
                        <label htmlFor="nome">Nome Completo *</label>
                        <input
                          id="nome"
                          type="text"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-item">
                        <label htmlFor="nascimento">Data de Nascimento</label>
                        <input
                          id="nascimento"
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                        />
                      </div>
                      <div className="form-item">
                        <label htmlFor="sexo">Sexo</label>
                        <select id="sexo" value={sexo} onChange={(e) => setSexo(e.target.value)}>
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

                {/* Aba Clínico */}
                {activeTab === 'clinico' && (
                  <div className="tab-panel animate-fade">
                    <div className="form-grid">
                      <div className="form-item">
                        <label htmlFor="peso">Peso Inicial</label>
                        <div className="input-suffix-wrapper">
                          <input
                            id="peso"
                            type="number"
                            step="0.1"
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
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                          />
                          <span className="suffix">cm</span>
                        </div>
                      </div>
                      <div className="form-item">
                        <label>IMC Atual</label>
                        <input
                          type="text"
                          className="imc-readonly-input"
                          value={imc !== null ? `${imc} (${imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidade'})` : 'Aguardando peso/altura'}
                          readOnly
                        />
                      </div>
                      <div className="form-item">
                        <label htmlFor="nivelAtividade">Nível de Atividade Física</label>
                        <select id="nivelAtividade" value={nivelAtividade} onChange={(e) => setNivelAtividade(e.target.value)}>
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
                                checked={objetivos.includes(obj)}
                                onChange={() => {
                                  const list = [...objetivos];
                                  if (list.includes(obj)) {
                                    setObjetivos(list.filter(x => x !== obj));
                                  } else {
                                    list.push(obj);
                                    setObjetivos(list);
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
                          value={objetivoTexto}
                          onChange={(e) => setObjetivoTexto(e.target.value)}
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
                                checked={patologias.includes(pat)}
                                onChange={() => toggleArraySelection(patologias, setPatologias, pat)}
                              />
                              {pat}
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Adicionar patologias personalizadas (separadas por vírgula)..."
                          className="text-input-margin"
                          value={patologiaLivre}
                          disabled={patologias.includes('Nenhum')}
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
                                checked={restricoes.includes(rest)}
                                onChange={() => toggleArraySelection(restricoes, setRestricoes, rest)}
                              />
                              {rest}
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Adicionar restrições personalizadas (separadas por vírgula)..."
                          className="text-input-margin"
                          value={restricaoLivre}
                          disabled={restricoes.includes('Nenhum')}
                          onChange={(e) => setRestricaoLivre(e.target.value)}
                        />
                      </div>

                      {/* Alergias */}
                      <div className="form-item full-width">
                        <label>Alergias Alimentares</label>
                        <div className="checkbox-grid">
                          {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar', 'Nenhum'].map((al) => (
                            <label key={al} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={alergias.includes(al)}
                                onChange={() => toggleArraySelection(alergias, setAlergias, al)}
                              />
                              {al}
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Adicionar alergias personalizadas (separadas por vírgula)..."
                          className="text-input-margin"
                          value={alergiaLivre}
                          disabled={alergias.includes('Nenhum')}
                          onChange={(e) => setAlergiaLivre(e.target.value)}
                        />
                      </div>

                      <div className="form-item full-width">
                        <label htmlFor="medicamentos">Medicamentos Contínuos</label>
                        <textarea
                          id="medicamentos"
                          rows={2}
                          value={medicamentos}
                          onChange={(e) => setMedicamentos(e.target.value)}
                        ></textarea>
                      </div>
                      <div className="form-item full-width">
                        <label htmlFor="suplementos">Suplementos em Uso</label>
                        <textarea
                          id="suplementos"
                          rows={2}
                          value={suplementos}
                          onChange={(e) => setSuplementos(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {/* Aba Hábitos */}
                {activeTab === 'habitos' && (
                  <div className="tab-panel animate-fade">
                    <div className="form-grid">
                      <div className="form-item">
                        <label htmlFor="refeicoes">Refeições por Dia</label>
                        <input
                          id="refeicoes"
                          type="number"
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
                          placeholder="Ex: 06:00"
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
                          placeholder="Ex: 22:30"
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
                              checked={PraticaAtividade === true}
                              onChange={() => setPraticaAtividade(true)}
                            />
                            Sim
                          </label>
                          <label className="radio-label">
                            <input
                              type="radio"
                              name="atividadeFisica"
                              checked={PraticaAtividade === false}
                              onChange={() => setPraticaAtividade(false)}
                            />
                            Não
                          </label>
                        </div>
                      </div>
                      {PraticaAtividade && (
                        <div className="form-item full-width animate-fade">
                          <label htmlFor="atividadeDescricao">Descrição da Atividade Física e Frequência</label>
                          <textarea
                            id="atividadeDescricao"
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
                          rows={3}
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações do Formulário de Dados */}
              <div className="profile-form-actions">
                <button type="submit" className="btn-save-profile" disabled={isSavingProfile}>
                  <Save size={16} />
                  {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </section>

          {/* Coluna da Direita (Consultas e Planos) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Seção 2: Consultas */}
            <section className="perfil-card">
              <div className="consultas-header">
                <h2 className="perfil-card-title" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <span>📅</span> Consultas
                </h2>
                <button onClick={() => setShowConsultaModal(true)} className="btn-new-consulta">
                  <Plus size={16} /> Nova Consulta
                </button>
              </div>

              {/* Gráfico de Evolução sempre visível */}
              <div className="chart-container">
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e7d32', marginBottom: '0.75rem' }}>
                  Evolução do Peso
                </div>
                {renderPesoChart()}
              </div>

              {/* Lista de Consultas */}
              <div className="consultas-list">
                {consultas.length > 0 && (
                  consultas.map((cons) => (
                    <div key={cons.id} className="consulta-item-card">
                      <div className="consulta-card-header">
                        <span className="consulta-date">{formatarData(cons.data_consulta)}</span>
                        {cons.proximo_retorno && (
                          <span className="consulta-retorno-badge">
                            Retorno: {formatarData(cons.proximo_retorno)}
                          </span>
                        )}
                      </div>
                      
                      <div className="consulta-metrics-grid">
                        <div className="metric-box">
                          <span className="metric-label">Peso</span>
                          <span className="metric-value">{cons.peso} kg</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-label">Cintura</span>
                          <span className="metric-value">{cons.cintura ? `${cons.cintura} cm` : '--'}</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-label">Quadril</span>
                          <span className="metric-value">{cons.quadril ? `${cons.quadril} cm` : '--'}</span>
                        </div>
                        <div className="metric-box">
                          <span className="metric-label">% Gordura</span>
                          <span className="metric-value">{cons.percentual_gordura ? `${cons.percentual_gordura}%` : '--'}</span>
                        </div>
                      </div>

                      {cons.observacoes && (
                        <p className="consulta-obs">{cons.observacoes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Seção 3: Planos Alimentares */}
            <section className="perfil-card">
              <div className="planos-header">
                <h2 className="perfil-card-title" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <span>🍎</span> Planos Alimentares
                </h2>
                <button type="button" className="btn-generate-plano" disabled>
                  Gerar Plano Alimentar
                </button>
              </div>

              <div className="planos-list">
                {planos.length === 0 ? (
                  <div className="planos-empty">
                    <span>📭</span>
                    <p>Nenhum plano alimentar gerado ainda</p>
                  </div>
                ) : (
                  planos.map((plano) => {
                    const isExpanded = expandedPlanoId === plano.id;
                    return (
                      <div key={plano.id} className={`plano-item ${isExpanded ? 'expanded' : ''}`}>
                        <div 
                          className="plano-item-header" 
                          onClick={() => setExpandedPlanoId(isExpanded ? null : plano.id)}
                        >
                          <div className="plano-title">
                            <span>📄</span> Plano Alimentar
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="plano-date">{formatarDataPlano(plano.created_at)}</span>
                            <ChevronDown size={16} className="plano-chevron" />
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="plano-item-content animate-fade">
                            {renderPlanoConteudo(plano.conteudo)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
            
          </div>
        </div>
      </main>

      {/* Modal: Nova Consulta */}
      {showConsultaModal && (
        <div className="modal-overlay" onClick={() => setShowConsultaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nova Consulta</h2>
              <button onClick={() => setShowConsultaModal(false)} className="btn-close-modal">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveConsulta}>
              <div className="modal-body">
                <div className="consulta-form-grid">
                  
                  <div className="form-item">
                    <label htmlFor="cons-data">Data da Consulta *</label>
                    <input 
                      id="cons-data"
                      type="date"
                      value={consultaData}
                      onChange={(e) => setConsultaData(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-item">
                    <label htmlFor="cons-peso">Peso Atual *</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        id="cons-peso"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={consultaPeso}
                        onChange={(e) => setConsultaPeso(e.target.value)}
                        required
                      />
                      <span className="suffix">kg</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="cons-cintura">Medida da Cintura</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        id="cons-cintura"
                        type="number"
                        step="0.1"
                        placeholder="Opcional"
                        value={consultaCintura}
                        onChange={(e) => setConsultaCintura(e.target.value)}
                      />
                      <span className="suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="cons-quadril">Medida do Quadril</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        id="cons-quadril"
                        type="number"
                        step="0.1"
                        placeholder="Opcional"
                        value={consultaQuadril}
                        onChange={(e) => setConsultaQuadril(e.target.value)}
                      />
                      <span className="suffix">cm</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="cons-gordura">Percentual de Gordura</label>
                    <div className="input-suffix-wrapper">
                      <input 
                        id="cons-gordura"
                        type="number"
                        step="0.1"
                        placeholder="Opcional"
                        value={consultaGordura}
                        onChange={(e) => setConsultaGordura(e.target.value)}
                      />
                      <span className="suffix">%</span>
                    </div>
                  </div>

                  <div className="form-item">
                    <label htmlFor="cons-retorno">Próximo Retorno</label>
                    <input 
                      id="cons-retorno"
                      type="date"
                      value={consultaRetorno}
                      onChange={(e) => setConsultaRetorno(e.target.value)}
                    />
                  </div>

                  <div className="form-item grid-full-width">
                    <label htmlFor="cons-obs">Observações da Consulta</label>
                    <textarea 
                      id="cons-obs"
                      rows={3}
                      placeholder="Anote evoluções, queixas, metas de curto prazo..."
                      value={consultaObs}
                      onChange={(e) => setConsultaObs(e.target.value)}
                    ></textarea>
                  </div>

                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowConsultaModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isSavingConsulta}
                >
                  {isSavingConsulta ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
