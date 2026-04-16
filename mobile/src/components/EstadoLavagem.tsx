import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle, Home } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { avancarEtapa, registrarIncidente, getOrdemServico } from '../services/api';
import ModalOcorrencia from './ModalOcorrencia';
import './EstadoLavagem.css';

interface DadosIncidente {
  descricao: string;
  tag_peca_id: number;
  foto: File | null;
}

const EstadoLavagem: React.FC<{ ordemServicoId: number; onComplete: () => void; }> = ({ ordemServicoId, onComplete }) => {
  const history = useHistory();
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [statusAtual, setStatusAtual] = useState<string>('');
  const [showModalOcorrencia, setShowModalOcorrencia] = useState(false);

  // Verifica o status real no banco para detectar bloqueios (RN-09/RN-13)
  useEffect(() => {
    const verificarStatus = async () => {
      try {
        const data = await getOrdemServico(ordemServicoId);
        setStatusAtual(data.status);
      } catch (err) {
        console.error('Erro ao verificar status:', err);
      }
    };
    verificarStatus();
  }, [ordemServicoId]);

  // Cronômetro: Só corre se não estiver pausado E não houver incidente
  useEffect(() => {
    if (!isPausado && statusAtual !== 'BLOQUEADO_INCIDENTE') {
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
    if (loading || statusAtual === 'BLOQUEADO_INCIDENTE') return;

    setLoading(true);
    try {
      await avancarEtapa(ordemServicoId, { comentario_lavagem: observacoes });
      onComplete();
    } catch {
      alert('Erro ao avançar etapa. A OS pode estar bloqueada.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarOcorrencia = async (dados: DadosIncidente) => {
    setLoading(true);
    try {
      await registrarIncidente(ordemServicoId, dados);
      setStatusAtual('BLOQUEADO_INCIDENTE');
      setShowModalOcorrencia(false);
      alert('Incidente registrado. A OS foi bloqueada para análise do Gestor.');
    } catch (error: unknown) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Falha ao registrar: ' + mensagem);
    } finally {
      setLoading(false);
    }
  };

  // Tela de bloqueio industrial
  if (statusAtual === 'BLOQUEADO_INCIDENTE') {
    return (
      <div className="el-block-container">
        <div className="el-block-card">
          <AlertTriangle size={60} color="var(--lm-amber)" style={{ marginBottom: '20px' }} />
          <h2 className="el-block-title">OS BLOQUEADA</h2>
          <p className="el-block-text">
            Um incidente foi registrado para este veículo. O cronômetro foi interrompido e a execução está suspensa.
          </p>
          <p className="el-block-subtext">Aguarde a liberação do Gestor no sistema administrativo.</p>
          <button onClick={() => history.push('/ordens-servico/hoje')} className="el-btn-back">
            <Home size={20} /> VOLTAR AO PÁTIO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="el-root">
      <div className="el-timer-container">
        <div className="el-timer">{formatarTempo(segundos)}</div>
        <span className="el-timer-label">Tempo Decorrido</span>
      </div>

      <div className="el-obs-wrapper">
        <label className="el-input-label">Observações da Lavagem</label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Utilizado shampoo neutro..."
          className="el-textarea"
        />
      </div>

      <div className="el-btn-group">
        <button type="button" className="el-btn-secondary" onClick={() => setShowModalOcorrencia(true)}>
          <AlertTriangle size={20} color="var(--lm-amber)" /> Relatar Problema
        </button>

        <button
          type="button"
          className={`el-btn-pause ${isPausado ? 'is-pausado' : 'is-rodando'}`}
          onClick={() => setIsPausado(!isPausado)}
        >
          <Pause size={20} /> {isPausado ? 'Retomar' : 'Pausar'}
        </button>

        <button
          type="button"
          className="el-btn-primary btn-pulse"
          onClick={handleFinalizar}
          disabled={loading}
        >
          {loading ? <IonSpinner name="crescent" /> : <><CheckCircle size={20} /> Finalizar Lavagem</>}
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

export default EstadoLavagem;