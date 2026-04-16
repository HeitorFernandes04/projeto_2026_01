import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertCircle, Camera, ClipboardList } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa, getAtendimento } from '../services/api';
import GaleriaFotos from './GaleriaFotos';
import './EstadoVistoria.css';

interface Midia {
  id?: number;
  arquivo: string;
  momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO';
}

interface AtendimentoVistoria {
  id: number;
  midias?: Midia[];
  status?: string;
  etapa_atual?: number;
}

const EstadoVistoria: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const [atendimento, setAtendimento] = useState<AtendimentoVistoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const galeriaRef = useRef<HTMLDivElement>(null);

  const partesObrigatorias = ['Lateral Motorista', 'Lateral Passageiro', 'Teto', 'Frente', 'Atrás'];

  const carregarDados = useCallback(async () => {
    try {
      const data = await getAtendimento(atendimentoId);
      setAtendimento(data as unknown as AtendimentoVistoria);
    } catch (err) {
      console.error('Erro ao carregar vistoria:', err);
    } finally {
      setLoading(false);
    }
  }, [atendimentoId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const fotosExistentes = atendimento?.midias?.filter((m: Midia) => m.momento === 'VISTORIA_GERAL') || [];
  const podeConcluir = fotosExistentes.length >= 5;

  const handleFinalizar = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!podeConcluir || enviando) return;

    setEnviando(true);
    try {
      await avancarEtapa(atendimentoId, { laudo_vistoria: observacoes });
      setAtendimento(null); // Limpa estado local antes de completar
      onComplete();
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      alert('Bloqueio na Vistoria: ' + (err.message || 'Verifique se as 5 fotos foram processadas.'));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px' }}>
      <IonSpinner name="crescent" color="primary" />
    </div>
  );

  return (
    <div className="ev-container">
      <h3 className="ev-section-title">Fotos da Vistoria</h3>
      <p className="ev-status-hint" style={{ marginBottom: '15px' }}>
        Capture as 5 fotos obrigatórias para liberar a próxima etapa.
      </p>

      <GaleriaFotos
        atendimentoId={atendimentoId}
        momento="VISTORIA_GERAL"
        fotosIniciais={atendimento?.midias || []}
        onUploadSuccess={carregarDados}
      />

      <div className={`ev-status-banner ${podeConcluir ? 'ok' : 'pending'}`} style={{ marginTop: '20px' }}>
        {podeConcluir ? <Check color="#00ff88" size={20} /> : <AlertCircle color="#ff9500" size={20} />}
        <div>
          <div className={`ev-status-count ${podeConcluir ? 'ok' : 'pending'}`}>
            {fotosExistentes.length}/5 Fotos no Banco
          </div>
        </div>
      </div>

      <div className="ev-laudo-wrapper">
        <label className="ev-label">
          <ClipboardList size={16} color="var(--lm-primary)" /> Laudo Técnico de Entrada
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Riscos leves no para-choque, veículo sem estepe..."
          className="ev-textarea"
        />
      </div>

      <button
        type="button"
        onClick={handleFinalizar}
        disabled={!podeConcluir || enviando}
        className={`ev-btn-main ${podeConcluir ? 'enabled' : 'disabled'}`}
      >
        {enviando ? <IonSpinner name="dots" /> : 'CONCLUIR VISTORIA'}
      </button>
    </div>
  );
};

export default EstadoVistoria;