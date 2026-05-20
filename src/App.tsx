import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import PacienteCadastro from './pages/PacienteCadastro';
import PacientePerfil from './pages/PacientePerfil';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pacientes" 
          element={
            <ProtectedRoute>
              <Pacientes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pacientes/novo" 
          element={
            <ProtectedRoute>
              <PacienteCadastro />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pacientes/:id" 
          element={
            <ProtectedRoute>
              <PacientePerfil />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
