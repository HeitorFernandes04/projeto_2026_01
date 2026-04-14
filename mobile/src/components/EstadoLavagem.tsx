import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle, Home } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { avancarEtapa, registrarIncidente, getAtendimento } from '../services/api';
import ModalOcorrencia from './ModalOcorrencia';

// Interface para dados do incidente
interface DadosIncidente {
  descricao: string;
  tag_peca_id: number;
  foto: File | null;
}

const EstadoLavagem: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const history = useHistory();
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [statusAtual, setStatusAtual] = useState<string>('');
  
  const [showModalOcorrencia, setShowModalOcorrencia] = useState(false);

  // Verifica o status real no banco para detectar bloqueios (RN-09/RN-13) [cite: 16, 49]
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

  // Cronômetro: Só corre se não estiver pausado E não houver incidente (Bloqueio Industrial) [cite: 44, 49]
  useEffect(() => {
    if (!isPausado && statusAtual !== 'INCIDENTE') {
      const interval = setInterval(() => setSegundos(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isPausado, statusAtual]);

  const formatarTempo = (total: number) => {
    const h = Math.floor(total / 3600).toString().padStart(2, '0');
    const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleFinalizar = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (loading || statusAtual === 'INCIDENTE') return;

    setLoading(true);
    try {
      await avancarEtapa(atendimentoId, { comentario_lavagem: observacoes });
      onComplete(); 
    } catch {
      // Variável 'err' removida para satisfazer o ESLint
      alert('Erro ao avançar etapa. A OS pode estar bloqueada.');
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

  // TELA DE BLOQUEIO (MODO LEITURA / INCIDENTE) [cite: 16, 60]
  if (statusAtual === 'INCIDENTE') {
    return (
      <div style={styles.blockContainer}>
        <div style={styles.blockCard}>
          <AlertTriangle size={60} color="var(--lm-amber)" style={{ marginBottom: '20px' }} />
          <h2 style={styles.blockTitle}>OS BLOQUEADA</h2>
          <p style={styles.blockText}>
            Um incidente foi registrado para este veículo. O cronômetro foi interrompido e a execução está suspensa. [cite: 16, 49]
          </p>
          <p style={styles.blockSubText}>Aguarde a liberação do Gestor no sistema administrativo. [cite: 16]</p>
          <button onClick={() => history.push('/atendimentos/hoje')} style={styles.btnBack}>
            <Home size={20} /> VOLTAR AO PÁTIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#000', padding: '0' }}>
      <div style={styles.timerContainer}>
        <div style={{ ...styles.timer, color: 'var(--lm-primary)', textShadow: '0 0 20px var(--lm-primary-glow)' }}>
          {formatarTempo(segundos)}
        </div>
        <span style={styles.timerLabel}>Tempo Decorrido</span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={styles.inputLabel}>Observações da Lavagem</label>
        <textarea 
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Utilizado shampoo neutro..."
          style={styles.textarea}
        />
      </div>

      <div style={styles.btnGroup}>
        <button type="button" style={styles.btnSecondary} onClick={() => setShowModalOcorrencia(true)}>
          <AlertTriangle size={20} color="var(--lm-amber)" /> Ocorrência [cite: 49]
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
          <Pause size={20} /> {isPausado ? 'Retomar' : 'Pausar'} [cite: 48]
        </button>

        <button 
          type="button"
          className="btn-pulse"
          style={styles.btnPrimary} 
          onClick={handleFinalizar} 
          disabled={loading}
        >
          {loading ? <IonSpinner name="crescent" /> : <><CheckCircle size={20} /> Finalizar Lavagem</>} [cite: 57]
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

const styles = {
  timerContainer: { textAlign: 'center' as const, padding: '40px 0' },
  timer: { fontSize: '56px', fontWeight: 900, letterSpacing: '2px' },
  timerLabel: { fontSize: '12px', color: '#666', textTransform: 'uppercase' as const, fontWeight: 700 },
  inputLabel: { color: '#fff', fontSize: '12px', fontWeight: 900, display: 'block', marginBottom: '10px', textTransform: 'uppercase' as const, letterSpacing: '1px' },
  textarea: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px', color: '#fff', width: '100%', padding: '18px', minHeight: '140px', outline: 'none' },
  btnGroup: { display: 'flex', flexDirection: 'column' as const, gap: '16px', paddingBottom: '100px' },
  btnPrimary: { background: 'var(--lm-primary)', color: '#fff', height: '68px', borderRadius: '20px', fontWeight: 900, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', textTransform: 'uppercase' as const },
  btnSecondary: { background: '#0a0a0a', color: '#fff', height: '64px', borderRadius: '20px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 800 },
  btnPause: { height: '64px', borderRadius: '20px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontWeight: 900, textTransform: 'uppercase' as const },
  blockContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '20px' },
  blockCard: { background: '#0a0a0a', border: '2px solid #1a1a1a', borderRadius: '32px', padding: '40px 24px', textAlign: 'center' as const, width: '100%' },
  blockTitle: { color: '#fff', fontSize: '24px', fontWeight: 900, marginBottom: '16px', letterSpacing: '1px' },
  blockText: { color: '#bbb', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' },
  blockSubText: { color: '#555', fontSize: '12px', fontWeight: 600, marginBottom: '32px' },
  btnBack: { background: '#fff', color: '#000', width: '100%', padding: '18px', borderRadius: '16px', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }
};

export default EstadoLavagem;