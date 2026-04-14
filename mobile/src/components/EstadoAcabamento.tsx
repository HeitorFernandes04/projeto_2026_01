import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle, MessageSquare, MapPin, Home } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { avancarEtapa, registrarIncidente, getAtendimento } from '../services/api';
import ModalOcorrencia from './ModalOcorrencia';

// Interface para garantir tipagem correta no incidente
interface DadosIncidente {
  descricao: string;
  tag_peca_id: number;
  foto: File | null;
}

const EstadoAcabamento: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const history = useHistory();
  const [vagaPatio, setVagaPatio] = useState('Vaga A-12');
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [statusAtual, setStatusAtual] = useState<string>('');
  
  const [showModalOcorrencia, setShowModalOcorrencia] = useState(false);

  // Sincroniza status inicial para detectar bloqueios existentes
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const data = await getAtendimento(atendimentoId);
        setStatusAtual(data.status);
      } catch (err) {
        console.error("Erro ao verificar status:", err);
      }
    };
    verificarStatus();
  }, [atendimentoId]);

  // Cronômetro: Interrompido se houver Incidente (Bloqueio de Estado)
  useEffect(() => {
    if (!isPausado && statusAtual !== 'INCIDENTE') {
      const interval = setInterval(() => {
        setSegundos(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPausado, statusAtual]);

  const formatarTempo = (totalSegundos: number) => {
    const horas = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
    const minutos = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
    const segs = (totalSegundos % 60).toString().padStart(2, '0');
    return `${horas}:${minutos}:${segs}`;
  };

  const handleFinalizar = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (loading || statusAtual === 'INCIDENTE') return;

    setLoading(true);
    try {
      await avancarEtapa(atendimentoId, { 
        comentario_acabamento: observacoes 
      });
      onComplete(); 
    } catch {
      alert('Erro ao finalizar acabamento. A OS pode estar bloqueada.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarOcorrencia = async (dados: DadosIncidente) => {
    setLoading(true);
    try {
      // 1. Envia para o Django
      await registrarIncidente(atendimentoId, dados);
      
      // 2. FORÇA a mudança de estado local IMEDIATAMENTE
      // Isso faz o React esconder o cronômetro e mostrar a tela de bloqueio
      setStatusAtual('INCIDENTE'); 
      
      setShowModalOcorrencia(false);
      
      // 3. Feedback visual
      alert('Incidente registrado. A OS foi bloqueada para análise do Gestor.');
      
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Falha ao registrar: ' + mensagem);
    } finally {
      setLoading(false);
    }
  };

  // RENDERIZAÇÃO CONDICIONAL: TELA DE BLOQUEIO (RN-09 / RN-13)
  if (statusAtual === 'INCIDENTE') {
    return (
      <div style={styles.blockContainer}>
        <div style={styles.blockCard}>
          <AlertTriangle size={60} color="var(--lm-amber)" style={{ marginBottom: '20px' }} />
          <h2 style={styles.blockTitle}>ACABAMENTO SUSPENSO</h2>
          <p style={styles.blockText}>
            Esta Ordem de Serviço possui um incidente registrado e está bloqueada para auditoria.
          </p>
          <p style={styles.blockSubText}>O cronômetro de produtividade foi pausado.</p>
          <button onClick={() => history.push('/atendimentos/hoje')} style={styles.btnBack}>
            <Home size={20} /> RETORNAR AO PÁTIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.timerWrapper}>
        <div style={styles.timerDisplay}>
          {formatarTempo(segundos)}
        </div>
        <div style={styles.timerSub}>Tempo de Acabamento</div>
        {isPausado && <div style={styles.pausedBadge}>PAUSADO</div>}
      </div>

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

      <div style={{ marginBottom: '32px' }}>
        <label style={styles.sectionLabel}>
          <MessageSquare size={14} /> Notas de Acabamento
        </label>
        <textarea 
          placeholder="Ex: Aplicado revitalizador de plásticos..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.actionGroup}>
        <button 
          type="button"
          style={styles.btnSecondary} 
          onClick={() => setShowModalOcorrencia(true)}
        >
          <AlertTriangle size={20} color="var(--lm-amber)" /> REGISTRAR OCORRÊNCIA
        </button>

        <button 
          type="button"
          style={{ 
            ...styles.btnPause, 
            background: isPausado ? 'var(--lm-primary)' : 'var(--lm-amber)',
            color: isPausado ? '#fff' : '#000'
          }} 
          onClick={() => setIsPausado(!isPausado)}
        >
          <Pause size={20} /> {isPausado ? 'RETOMAR ATENDIMENTO' : 'PAUSAR ATENDIMENTO'}
        </button>

        <button 
          type="button"
          className="btn-pulse"
          style={styles.btnFinish} 
          onClick={handleFinalizar} 
          disabled={loading}
        >
          {loading ? <IonSpinner name="crescent" /> : <><CheckCircle size={20} /> FINALIZAR ETAPA</>}
        </button>
      </div>

      <ModalOcorrencia 
        isOpen={showModalOcorrencia}
        onClose={() => setShowModalOcorrencia(false)}
        onConfirm={handleConfirmarOcorrencia}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: { background: '#000', display: 'flex', flexDirection: 'column', padding: '0' },
  timerWrapper: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', padding: '40px 0' },
  timerDisplay: { fontSize: '56px', fontWeight: 900, color: 'var(--lm-amber)', textShadow: '0 0 20px rgba(255,149,0,0.5)', letterSpacing: '2px' },
  timerSub: { fontSize: '14px', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '16px' },
  pausedBadge: { fontSize: '12px', color: 'var(--lm-amber)', fontWeight: 800, marginTop: '8px', textTransform: 'uppercase' },
  locationCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '24px', borderRadius: '24px', marginBottom: '24px' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--lm-primary)', marginBottom: '16px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' },
  locationInput: { background: '#000', border: '1px solid #1a1a1a', borderRadius: '16px', color: '#fff', width: '100%', padding: '16px', fontSize: '18px', fontWeight: 900, outline: 'none' },
  sectionLabel: { color: '#666', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', letterSpacing: '1px' },
  textarea: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', color: '#fff', width: '100%', padding: '18px', fontSize: '14px', minHeight: '120px', outline: 'none', resize: 'none' },
  actionGroup: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '100px' },
  btnFinish: { background: 'var(--lm-primary)', color: '#fff', height: '68px', borderRadius: '20px', fontWeight: 900, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px', textTransform: 'uppercase' },
  btnSecondary: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', height: '64px', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' },
  btnPause: { borderRadius: '20px', height: '64px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: 'none', textTransform: 'uppercase' },
  // Estilos da Tela de Bloqueio Industrial
  blockContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' },
  blockCard: { background: '#0a0a0a', border: '2px solid #1a1a1a', borderRadius: '32px', padding: '40px 24px', textAlign: 'center' as const, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
  blockTitle: { color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '16px', letterSpacing: '1px' },
  blockText: { color: '#bbb', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' },
  blockSubText: { color: '#555', fontSize: '12px', fontWeight: 600, marginBottom: '32px' },
  btnBack: { background: '#fff', color: '#000', width: '100%', padding: '20px', borderRadius: '16px', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }
};

export default EstadoAcabamento;