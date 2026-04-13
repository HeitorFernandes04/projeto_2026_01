import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle, MessageSquare, MapPin } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa } from '../services/api';

const EstadoAcabamento: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const [vagaPatio, setVagaPatio] = useState('Vaga A-12');
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  // Cronômetro automático ao iniciar a etapa
  useEffect(() => {
    if (!isPausado) {
      const interval = setInterval(() => {
        setSegundos(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPausado]);

  const formatarTempo = (totalSegundos: number) => {
    const horas = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
    const minutos = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
    const segs = (totalSegundos % 60).toString().padStart(2, '0');
    return `${horas}:${minutos}:${segs}`;
  };

  const handleFinalizar = async (e?: React.MouseEvent) => {
    // Axioma 11: Impede comportamentos nativos que quebram a fluidez da esteira
    if (e) e.preventDefault();
    
    if (loading) return;

    setLoading(true);
    try {
      // Axioma 1: View delega lógica para o serviço via API
      // O envio de 'comentario_acabamento' é o gatilho para o backend liberar a Etapa 4
      await avancarEtapa(atendimentoId, { 
        comentario_acabamento: observacoes 
      });
      
      // Axioma 13: Notifica o componente pai (EsteiraProducao) para disparar refresh orgânico
      onComplete(); 
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      alert('Erro ao finalizar acabamento. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      
      {/* Cronômetro Centralizado com Brilho Laranja */}
      <div style={styles.timerWrapper}>
        <div style={styles.timerDisplay}>
          {formatarTempo(segundos)}
        </div>
        <div style={styles.timerSub}>Tempo de Acabamento</div>
        {isPausado && <div style={styles.pausedBadge}>PAUSADO</div>}
      </div>

      {/* Card de Localização */}
      <div style={styles.locationCard}>
        <div style={styles.cardHeader}>
          <MapPin size={18} />
          <span>Local no Pátio</span>
        </div>
        <input
          type="text"
          value={vagaPatio}
          onChange={(e) => setVagaPatio(e.target.value)}
          style={styles.locationInput}
          placeholder="Informe a vaga..."
        />
      </div>

      {/* Campo de Notas de Acabamento */}
      <div style={{ marginBottom: '32px' }}>
        <label style={styles.sectionLabel}>
          <MessageSquare size={14} /> Notas de Acabamento
        </label>
        <textarea 
          placeholder="Ex: Aplicado revitalizador de plásticos e fragrância premium..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          style={styles.textarea}
        />
      </div>

      {/* Grupo de Ações (Visual Industrial) */}
      <div style={styles.actionGroup}>
        <button 
          type="button"
          style={styles.btnSecondary} 
          onClick={() => alert('Módulo de ocorrências em breve')}
        >
          <AlertTriangle size={20} /> REGISTRAR OCORRÊNCIA
        </button>

        <button 
          type="button"
          style={{ ...styles.btnPause, background: isPausado ? 'var(--lm-primary)' : '#ff9500' }} 
          onClick={() => setIsPausado(!isPausado)}
        >
          <Pause size={20} /> {isPausado ? 'RETOMAR ATENDIMENTO' : 'PAUSAR ATENDIMENTO'}
        </button>

        <button 
          type="button"
          style={styles.btnFinish} 
          onClick={handleFinalizar} 
          disabled={loading}
        >
          {loading ? <IonSpinner name="crescent" /> : (
            <><CheckCircle size={20} /> FINALIZAR ETAPA</>
          )}
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { background: '#000', display: 'flex', flexDirection: 'column', padding: '20px' },
  timerWrapper: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', padding: '40px 0' },
  timerDisplay: { fontSize: '48px', fontWeight: 900, color: '#ff9500', textShadow: '0 0 20px rgba(255,149,0,0.8)', letterSpacing: '2px' },
  timerSub: { fontSize: '14px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '16px' },
  pausedBadge: { fontSize: '12px', color: '#ff9500', fontWeight: 800, marginTop: '8px', textTransform: 'uppercase' },
  locationCard: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '24px', borderRadius: '20px', marginBottom: '24px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--lm-primary)', marginBottom: '12px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' },
  locationInput: { background: '#000', border: '1px solid var(--lm-border)', borderRadius: '12px', color: '#fff', width: '100%', padding: '12px 16px', fontSize: '18px', fontWeight: 900, outline: 'none' },
  sectionLabel: { color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' },
  textarea: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', borderRadius: '16px', color: '#fff', width: '100%', padding: '16px', fontSize: '14px', minHeight: '100px', outline: 'none', resize: 'none' },
  actionGroup: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '100px' },
  btnFinish: { background: '#ff9500', color: '#fff', height: '64px', borderRadius: '18px', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px' },
  btnSecondary: { background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', height: '60px', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  btnPause: { color: '#000', borderRadius: '16px', height: '60px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: 'none' }
};

export default EstadoAcabamento;