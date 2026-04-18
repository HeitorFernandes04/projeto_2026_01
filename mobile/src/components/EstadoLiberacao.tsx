import React, { useState, useEffect, useCallback } from 'react';
import { Check, MapPin, Key, AlertCircle } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { finalizarOrdemServico, getOrdemServico } from '../services/api';
import { useHistory } from 'react-router-dom';
import GaleriaFotos from './GaleriaFotos';
import './EstadoLiberacao.css';

const EstadoLiberacao: React.FC<{ ordemServicoId: number; onComplete: () => void; }> = ({ ordemServicoId, onComplete }) => {
  const history = useHistory();
  const [ordemServico, setOrdemServico] = useState<{midias?: Array<{arquivo: string; momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO'}>} | null>(null);
  const [vaga, setVaga] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const fetchDados = useCallback(async () => {
    try {
      const data = await getOrdemServico(ordemServicoId);
      setOrdemServico(data);
    } catch (err) {
      console.error('Erro ao carregar dados de entrega:', err);
    } finally {
      setLoading(false);
    }
  }, [ordemServicoId]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const fotosDepois = ordemServico?.midias?.filter((m) => m.momento === 'FINALIZADO') || [];
  const podeLiberar = fotosDepois.length >= 5 && vaga.trim().length > 0;

  const handleFinalizarGeral = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!podeLiberar || enviando) return;

    setEnviando(true);
    try {
      await finalizarOrdemServico(ordemServicoId, { vaga_patio: vaga });
      setOrdemServico(null); // Limpa estado local
      onComplete();
      history.push('/ordens-servico/hoje');
    } catch (err: unknown) {
      console.error('Erro ao liberar veículo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Verifique se as 5 fotos foram processadas.';
      alert('Bloqueio na Liberação: ' + errorMessage);
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
    <div className="elib-container">
      <h3 className="elib-section-title">Fotos de Entrega</h3>
      <p className="elib-status-hint" style={{ marginBottom: '15px' }}>
        Capture as 5 fotos obrigatórias de finalização para liberar o veículo.
      </p>

      <GaleriaFotos
        ordemServicoId={ordemServicoId}
        momento="FINALIZADO"
        fotosIniciais={ordemServico?.midias || []}
        onUploadSuccess={fetchDados}
      />

      <div className={`elib-status-banner ${podeLiberar ? 'ok' : 'pending'}`} style={{ marginTop: '20px' }}>
        {podeLiberar ? <Check color="#00ff88" size={20} /> : <AlertCircle color="#ff9500" size={20} />}
        <div>
          <div className={`elib-status-title ${podeLiberar ? 'ok' : 'pending'}`}>
            {podeLiberar ? 'Pronto para Liberação' : 'Aguardando Checklist'}
          </div>
          <p className="elib-status-hint">
            {!podeLiberar && (
              fotosDepois.length < 5
                ? `${fotosDepois.length}/5 fotos registradas no banco`
                : 'Informe a vaga de saída para concluir'
            )}
          </p>
        </div>
      </div>

      <div className="elib-vaga-wrapper">
        <label className="elib-label">
          <MapPin size={16} color="var(--lm-primary)" /> Localização / Vaga de Saída *
        </label>
        <input
          value={vaga}
          onChange={(e) => setVaga(e.target.value)}
          placeholder="Ex: Vaga A1, Frente da Loja..."
          className="elib-input"
        />
      </div>

      <button
        type="button"
        onClick={handleFinalizarGeral}
        disabled={!podeLiberar || enviando}
        className={`elib-btn-main ${podeLiberar ? 'enabled' : 'disabled'}`}
      >
        {enviando ? <IonSpinner name="dots" /> : <><Key size={20} /> CONCLUIR E LIBERAR VEÍCULO</>}
      </button>
    </div>
  );
};

export default EstadoLiberacao;