import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não configurada no arquivo .env");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

app.get('/api/dashboard', async (req, res) => {
  const nutricionistaId = req.headers['x-nutricionista-id'];

  if (!nutricionistaId) {
    return res.status(400).json({ error: 'Cabeçalho x-nutricionista-id é obrigatório' });
  }

  try {
    // 1. Total de pacientes ativos
    const totalPacientesRes = await sql.query(
      'SELECT COUNT(*)::int as total FROM pacientes WHERE nutricionista_id = $1',
      [nutricionistaId]
    );
    const totalPacientes = totalPacientesRes[0]?.total || 0;

    // 2. Consultas da semana
    const hoje = new Date();
    const diaSemana = hoje.getDay(); // 0: Domingo, 1: Segunda...
    
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    const formatData = (d) => {
      const offset = d.getTimezoneOffset();
      const localDate = new Date(d.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
    };
    
    const dataInicio = formatData(inicioSemana);
    const dataFim = formatData(fimSemana);

    const consultasSemanaRes = await sql.query(
      `SELECT COUNT(*)::int as total 
       FROM consultas c 
       JOIN pacientes p ON c.paciente_id = p.id 
       WHERE p.nutricionista_id = $1 
         AND c.data_consulta BETWEEN $2 AND $3`,
      [nutricionistaId, dataInicio, dataFim]
    );
    const consultasSemana = consultasSemanaRes[0]?.total || 0;

    // 3. Pacientes sem retorno
    // Última consulta há mais de 30 dias e sem próximo retorno futuro ou agendado
    const pacientesSemRetorno = await sql.query(
      `WITH ultima_consulta AS (
         SELECT DISTINCT ON (paciente_id)
           paciente_id,
           data_consulta,
           proximo_retorno
         FROM consultas
         ORDER BY paciente_id, data_consulta DESC
       )
       SELECT p.id, p.nome, uc.data_consulta as data_ultima_consulta, uc.proximo_retorno
       FROM pacientes p
       JOIN ultima_consulta uc ON p.id = uc.paciente_id
       WHERE p.nutricionista_id = $1
         AND uc.data_consulta < CURRENT_DATE - INTERVAL '30 days'
         AND (uc.proximo_retorno IS NULL OR uc.proximo_retorno < CURRENT_DATE)`,
      [nutricionistaId]
    );

    res.json({
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao carregar dados do dashboard' });
  }
});

// GET /api/pacientes - Lista todos os pacientes da nutricionista logada com busca opcional
app.get('/api/pacientes', async (req, res) => {
  const nutricionistaId = req.headers['x-nutricionista-id'];
  const { search } = req.query;

  if (!nutricionistaId) {
    return res.status(400).json({ error: 'Cabeçalho x-nutricionista-id é obrigatório' });
  }

  try {
    const searchQuery = search ? `%${search}%` : '';
    let query = `
      SELECT 
        p.*, 
        (
          SELECT data_consulta 
          FROM consultas 
          WHERE paciente_id = p.id 
          ORDER BY data_consulta DESC 
          LIMIT 1
        ) as data_ultima_consulta
      FROM pacientes p
      WHERE p.nutricionista_id = $1
    `;
    const params = [nutricionistaId];

    if (searchQuery) {
      query += ` AND p.nome ILIKE $2`;
      params.push(searchQuery);
    }

    query += ` ORDER BY p.nome ASC`;

    const result = await sql.query(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao buscar pacientes' });
  }
});

// POST /api/pacientes - Cadastra um novo paciente vinculado à nutricionista logada
app.post('/api/pacientes', async (req, res) => {
  const nutricionistaId = req.headers['x-nutricionista-id'];
  if (!nutricionistaId) {
    return res.status(400).json({ error: 'Cabeçalho x-nutricionista-id é obrigatório' });
  }

  const {
    nome,
    data_nascimento,
    sexo,
    telefone,
    whatsapp,
    email,
    peso_inicial,
    altura,
    objetivos,
    objetivo_texto,
    nivel_atividade,
    patologias,
    restricoes_alimentares,
    alergias,
    medicamentos,
    suplementos,
    refeicoes_por_dia,
    horario_acorda,
    horario_dorme,
    litros_agua,
    atividade_fisica,
    atividade_fisica_descricao,
    observacoes
  } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'O nome do paciente é obrigatório' });
  }

  try {
    const formattedNascimento = data_nascimento || null;
    const formattedPeso = peso_inicial ? parseFloat(peso_inicial) : null;
    const formattedAltura = altura ? parseFloat(altura) : null;
    const formattedRefeicoes = refeicoes_por_dia ? parseInt(refeicoes_por_dia) : null;
    const formattedAgua = litros_agua ? parseFloat(litros_agua) : null;
    const formattedAtividade = atividade_fisica === true || atividade_fisica === 'true';

    const formattedObjetivos = Array.isArray(objetivos) ? objetivos : null;
    const formattedPatologias = Array.isArray(patologias) ? patologias : null;
    const formattedRestricoes = Array.isArray(restricoes_alimentares) ? restricoes_alimentares : null;
    const formattedAlergias = Array.isArray(alergias) ? alergias : null;

    const query = `
      INSERT INTO pacientes (
        nutricionista_id, nome, data_nascimento, sexo, telefone, whatsapp, email,
        peso_inicial, altura, objetivos, objetivo_texto, nivel_atividade,
        patologias, restricoes_alimentares, alergias, medicamentos, suplementos,
        refeicoes_por_dia, horario_acorda, horario_dorme, litros_agua,
        atividade_fisica, atividade_fisica_descricao, observacoes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24
      ) RETURNING id;
    `;

    const params = [
      nutricionistaId, nome, formattedNascimento, sexo || null, telefone || null, whatsapp || null, email || null,
      formattedPeso, formattedAltura, formattedObjetivos, objetivo_texto || null, nivel_atividade || null,
      formattedPatologias, formattedRestricoes, formattedAlergias, medicamentos || null, suplementos || null,
      formattedRefeicoes, horario_acorda || null, horario_dorme || null, formattedAgua,
      formattedAtividade, atividade_fisica_descricao || null, observacoes || null
    ];

    const result = await sql.query(query, params);
    const novoPacienteId = result[0]?.id;

    res.status(201).json({
      id: novoPacienteId,
      message: 'Paciente cadastrado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao cadastrar paciente' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor Express rodando na porta ${PORT}`);
});
