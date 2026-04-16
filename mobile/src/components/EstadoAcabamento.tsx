import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle, MessageSquare, MapPin, Home } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { avancarEtapa, registrarIncidente, getAtendimento } from '../services/api';
import ModalOcorrencia from './ModalOcorrencia';
import './EstadoAcabamento.css';

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
        console.error('Erro ao verificar status:', err);
      }
    };
    verificarStatus();
  }, [atendimentoId]);

  // Cronômetro: Interrompido se houver Incidente
  useEffect(() => {
    if (!isPausado && statusAtual !== 'INCIDENTE') {
      const interval = setInterval(() => setSegundos(prev => prev + 1), 1000);
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
      await avancarEtapa(atendimentoId, { comentario_acabamento: observacoes });
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
      await registrarIncidente(atendimentoId, dados);
      setStatusAtual('INCIDENTE');
      setShowModalOcorrencia(false);
      alert('Incidente registrado. A OS foi bloqueada para análise do Gestor.');
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Falha ao registrar: ' + mensagem);
    } finally {
      setLoading(false);
    }
  };

  // Tela de bloqueio industrial (RN-09 / RN-13)
  if (statusAtual === 'INCIDENTE') {
    return (
      <div className="ea-block-container">
        <div className="ea-block-card">
          <AlertTriangle size={60} color="var(--lm-amber)" style={{ marginBottom: '20px' }} />
          <h2 className="ea-block-title">ACABAMENTO SUSPENSO</h2>
          <p className="ea-block-text">
            Esta Ordem de Serviço possui um incidente registrado e está bloqueada para auditoria.
          </p>
          <p className="ea-block-subtext">O cronômetro de produtividade foi pausado.</p>
          <button onClick={() => history.push('/atendimentos/hoje')} className="ea-btn-back">
            <Home size={20} /> RETORNAR AO PÁTIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ea-root">
      <div className="ea-timer-wrapper">
        <div className="ea-timer-display">{formatarTempo(segundos)}</div>
        <div className="ea-timer-sub">Tempo de Acabamento</div>
        {isPausado && <div className="ea-paused-badge">PAUSADO</div>}
      </div>

      <div className="ea-location-card">
        <div className="ea-card-header">
          <MapPin size={18} />
          <span>Local no Pátio</span>
        </div>
        <input
          type="text"
          value={vagaPatio}
          onChange={(e) => setVagaPatio(e.target.value)}
          className="ea-location-input"
          placeholder="Informe a vaga..."
        />
      </div>

      <div className="ea-notes-wrapper">
        <label className="ea-section-label">
          <MessageSquare size={14} /> Notas de Acabamento
        </label>
        <textarea
          placeholder="Ex: Aplicado revitalizador de plásticos..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="ea-textarea"
        />
      </div>

      <div className="ea-action-group">
        <button type="button" className="ea-btn-secondary" onClick={() => setShowModalOcorrencia(true)}>
          <AlertTriangle size={20} color="var(--lm-amber)" /> RELATAR PROBLEMA
        </button>

        <button
          type="button"
          className={`ea-btn-pause ${isPausado ? 'is-pausado' : 'is-rodando'}`}
          onClick={() => setIsPausado(!isPausado)}
        >
          <Pause size={20} /> {isPausado ? 'RETOMAR ATENDIMENTO' : 'PAUSAR ATENDIMENTO'}
        </button>

        <button
          type="button"
          className="ea-btn-finish btn-pulse"
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

export default EstadoAcabamento;