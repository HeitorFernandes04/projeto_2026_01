import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa } from '../services/api';

const EstadoLavagem: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (!isPausado) {
      const interval = setInterval(() => setSegundos(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isPausado]);

  const formatarTempo = (total: number) => {
    const h = Math.floor(total / 3600).toString().padStart(2, '0');
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleFinalizar = async (e?: React.MouseEvent) => {
    // Axioma 11: Impede comportamentos nativos de submit que quebram a fluidez da esteira
    if (e) e.preventDefault();
    
    if (loading) return;

    setLoading(true);
    try {
      // Axioma 1: View delega lógica para o serviço via API.
      // O envio de 'comentario_lavagem' é o gatilho para o backend liberar a Etapa 3.
      await avancarEtapa(atendimentoId, { comentario_lavagem: observacoes });
      
      // Axioma 13: Refresh orgânico disparando a atualização do estado no componente pai
      onComplete(); 
    } catch (err: unknown) {
      console.error('Erro ao avançar etapa:', err);
      alert('Erro ao avançar etapa. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#000', padding: '20px' }}>
      <div style={styles.timerContainer}>
        <div style={{ ...styles.timer, color: '#0066ff', textShadow: '0 0 20px rgba(0,102,255,0.6)' }}>
          {formatarTempo(segundos)}
        </div>
        <span style={styles.timerLabel}>Tempo Decorrido</span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={styles.inputLabel}>Observações da Lavagem</label>
        <textarea 
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Utilizado shampoo neutro, removido piche nas caixas de roda..."
          style={styles.textarea}
        />
      </div>

      <div style={styles.btnGroup}>
        <button 
          type="button" 
          style={styles.btnSecondary} 
          onClick={() => alert('Módulo de ocorrências em breve')}
        >
          <AlertTriangle size={20} /> Ocorrência
        </button>

        <button 
          type="button"
          style={{ ...styles.btnPause, background: isPausado ? '#0066ff' : '#ff9500' }} 
          onClick={() => setIsPausado(!isPausado)}
        >
          <Pause size={20} /> {isPausado ? 'Retomar' : 'Pausar'}
        </button>

        <button 
          type="button"
          style={styles.btnPrimary} 
          onClick={handleFinalizar} 
          disabled={loading}
        >
          {loading ? <IonSpinner name="crescent" /> : <><CheckCircle size={20} /> Finalizar Lavagem</>}
        </button>
      </div>
    </div>
  );
};

// Estilos industriais unificados (Axioma 12)
const styles = {
  timerContainer: { textAlign: 'center' as const, padding: '40px 0' },
  timer: { fontSize: '48px', fontWeight: 900, letterSpacing: '2px' },
  timerLabel: { fontSize: '12px', color: '#666', textTransform: 'uppercase' as const, fontWeight: 700 },
  inputLabel: { color: '#fff', fontSize: '13px', fontWeight: 900, display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const },
  textarea: { background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', color: '#fff', width: '100%', padding: '16px', minHeight: '120px', outline: 'none' },
  btnGroup: { display: 'flex', flexDirection: 'column' as const, gap: '16px', paddingBottom: '100px' },
  btnPrimary: { background: '#0066ff', color: '#fff', height: '64px', borderRadius: '18px', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  btnSecondary: { background: '#1a1a1a', color: '#fff', height: '60px', borderRadius: '18px', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 700 },
  btnPause: { color: '#000', height: '60px', borderRadius: '18px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 800 }
};

export default EstadoLavagem;