import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PacientePerfil: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', backgroundColor: '#f9fbf9', minHeight: '100vh', color: '#1a3a2a' }}>
      <button 
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '0.6rem 1.2rem',
          backgroundColor: '#2e7d32',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1b5e20')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2e7d32')}
      >
        &larr; Voltar ao Dashboard
      </button>

      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', maxWidth: '600px' }}>
        <h1 style={{ color: '#2e7d32', marginTop: 0 }}>Perfil do Paciente</h1>
        <p style={{ fontSize: '1.1rem' }}><strong>ID do Paciente:</strong> {id}</p>
        <div style={{ padding: '1.5rem', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #2e7d32', marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#1b5e20', fontWeight: '500' }}>
            Este é um placeholder para o perfil do paciente. As informações detalhadas e plano alimentar serão implementados nas próximas etapas do projeto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PacientePerfil;
