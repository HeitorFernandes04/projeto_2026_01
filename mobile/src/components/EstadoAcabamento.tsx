import React, { useState, useEffect } from 'react';
import { MapPin, Sparkles, MessageSquare, AlertTriangle, Pause, CheckCircle } from 'lucide-react';
import { avancarEtapa } from '../services/api';

const EstadoAcabamento: React.FC<{atendimentoId: number; onComplete: () => void}> = ({atendimentoId, onComplete}) => {
  const [vagaPatio, setVagaPatio] = useState('Vaga A-12');
  const [notasAcabamento, setNotasAcabamento] = useState('');
  const [loading, setLoading] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [mostrarOcorrencia, setMostrarOcorrencia] = useState(false);

  // Formatar tempo em HH:MM:SS
  const formatarTempo = (totalSegundos: number) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Cronômetro
  useEffect(() => {
    if (!isPausado) {
      const interval = setInterval(() => {
        setSegundos(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPausado]);

  const handlePausar = () => {
    setIsPausado(!isPausado);
  };

  const handleOcorrencia = () => {
    alert('Em breve');
  };

  const handleFinalizarAcabamento = async () => {
    setLoading(true);
    try {
      const data = await avancarEtapa(atendimentoId, { observacoes: notasAcabamento });
      
      if (data) {
        console.log('Acabamento finalizado com sucesso');
        onComplete();
      } else {
        console.error('Erro ao avançar etapa:', data);
        alert(`Erro ao finalizar acabamento: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao finalizar acabamento:', error);
      alert('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: '#000000', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px'
    }}>
      
      {/* Cronômetro Centralizado com Brilho Laranja */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#ff9500',
          textShadow: '0 0 20px rgba(255,149,0,0.8)',
          letterSpacing: '2px',
          marginBottom: '16px'
        }}>
          {formatarTempo(segundos)}
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Tempo de Acabamento
        </div>
        
        {isPausado && (
          <div style={{
            fontSize: '12px',
            color: '#ff9500',
            fontWeight: 800,
            marginTop: '8px',
            textTransform: 'uppercase'
          }}>
            PAUSADO
          </div>
        )}
      </div>

      {/* Card de Localização */}
      <div style={{ 
        background: '#121212', 
        border: '1px solid #2a2a2a', 
        padding: '24px', 
        borderRadius: '20px', 
        textAlign: 'left', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          color: '#0066ff', 
          marginBottom: '12px' 
        }}>
          <MapPin size={18} />
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Local no Pátio</span>
        </div>
        <input
          type="text"
          value={vagaPatio}
          onChange={(e) => setVagaPatio(e.target.value)}
          style={{
            background: '#000000',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            color: '#fff',
            width: '100%',
            padding: '12px 16px',
            fontSize: '18px',
            fontWeight: 900,
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Campo de Notas de Acabamento */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ 
          color: '#444', 
          fontSize: '11px', 
          fontWeight: 900, 
          textTransform: 'uppercase', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '10px' 
        }}>
          <MessageSquare size={14} /> Notas de Acabamento
        </label>
        <textarea 
          placeholder="Ex: Aplicado revitalizador de plásticos e fragrância premium..."
          value={notasAcabamento}
          onChange={(e) => setNotasAcabamento(e.target.value)}
          style={{ 
            background: '#121212', 
            border: '1px solid #2a2a2a', 
            borderRadius: '16px', 
            color: '#fff', 
            width: '100%', 
            padding: '16px', 
            fontSize: '14px', 
            minHeight: '100px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* 3 Botões Principais */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        marginBottom: '100px'
      }}>
        
        <button
          onClick={handleOcorrencia}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '16px',
            padding: '20px',
            height: '60px',
            fontSize: '16px',
            fontWeight: 800,
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <AlertTriangle size={20} />
          REGISTRAR OCORRÊNCIA
        </button>

        <button
          onClick={handlePausar}
          style={{
            background: isPausado ? '#0066ff' : '#ff9500',
            border: 'none',
            borderRadius: '16px',
            padding: '20px',
            height: '60px',
            fontSize: '16px',
            fontWeight: 800,
            color: '#000',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Pause size={20} />
          {isPausado ? 'RETOMAR ATENDIMENTO' : 'PAUSAR ATENDIMENTO'}
        </button>

        <button
          onClick={handleFinalizarAcabamento}
          disabled={loading}
          style={{
            background: loading ? '#333' : '#ff9500',
            border: 'none',
            borderRadius: '16px',
            padding: '20px',
            height: '60px',
            fontSize: '16px',
            fontWeight: 800,
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <CheckCircle size={20} />
          {loading ? 'FINALIZANDO...' : 'FINALIZAR ETAPA'}
        </button>
      </div>
    </div>
  );
};

export default EstadoAcabamento;
