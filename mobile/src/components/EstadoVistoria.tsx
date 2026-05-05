import React, { useState, useEffect, useCallback } from 'react';
import { Check, AlertCircle, ClipboardList } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa, getOrdemServico } from '../services/api';
import GaleriaFotos from './GaleriaFotos';
import './EstadoVistoria.css';

interface Midia {
  id?: number;
  arquivo: string;
  momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO';
}

interface OrdemServicoVistoria {
  id: number;
  midias?: Midia[];
  status?: string;
  etapa_atual?: number;
}

const EstadoVistoria: React.FC<{ ordemServicoId: number; onComplete: () => void; }> = ({ ordemServicoId, onComplete }) => {
  const [ordemServico, setOrdemServico] = useState<OrdemServicoVistoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);


  const carregarDados = useCallback(async () => {
    try {
      const data = await getOrdemServico(ordemServicoId);
      setOrdemServico(data as unknown as OrdemServicoVistoria);
    } catch (err) {
      console.error('Erro ao carregar vistoria:', err);
    } finally {
      setLoading(false);
    }
  }, [ordemServicoId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const fotosExistentes = ordemServico?.midias?.filter((m: Midia) => m.momento === 'VISTORIA_GERAL') || [];
  const podeConcluir = fotosExistentes.length >= 5 && !enviando;

  const handleFinalizar = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    // Validação rigorosa antes de permitir avanço
    if (enviando) return;
    
    // Recarrega dados para garantir estado atualizado
    try {
      const dadosAtualizados = await getOrdemServico(ordemServicoId);
      const fotosAtuais = dadosAtualizados.midias?.filter((m: Midia) => m.momento === 'VISTORIA_GERAL') || [];
      
      if (fotosAtuais.length < 5) {
        alert(`Bloqueio: Apenas ${fotosAtuais.length}/5 fotos foram salvas no sistema. Aguarde o processamento completo.`);
        return;
      }

      // Verificação crítica: testar se cada imagem realmente existe (não 404)
      console.log('Verificando existência física das imagens...');
      
      const verificarImagem = async (foto: Midia): Promise<{url: string, ok: boolean, status?: number, error?: string}> => {
        const urlsParaTestar = [
          foto.arquivo, // URL original (absoluta)
          foto.arquivo.replace('http://127.0.0.1:8000', ''), // URL relativa
          `http://127.0.0.1:8000${foto.arquivo}`, // Forçar domínio se for relativa
        ];
        
        for (const url of urlsParaTestar) {
          try {
            console.log(`Testando URL: ${url}`);
            const response = await fetch(url, { 
              method: 'HEAD',
              mode: 'cors',
              cache: 'no-cache'
            });
            
            if (response.ok) {
              console.log(`✅ Imagem acessível: ${url}`);
              return { url, ok: true, status: response.status };
            } else {
              console.log(`❌ Falha ${response.status}: ${url}`);
            }
          } catch (error) {
            console.log(`❌ Erro ao acessar ${url}:`, error);
          }
        }
        
        return { url: foto.arquivo, ok: false, error: 'Todas as URLs falharam' };
      };

      const verificacoes = await Promise.allSettled(
        fotosAtuais.map((foto: Midia) => verificarImagem(foto))
      );

      const falhas = verificacoes.filter(
        (result): result is PromiseRejectedResult | PromiseFulfilledResult<{ok: false; url: string; error?: string}> => 
          result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.ok)
      );

      if (falhas.length > 0) {
        console.error('Imagens com falha:', falhas);
        
        // Tentar identificar o problema específico
        const erroDetalhado = falhas.map(f => {
          if (f.status === 'rejected') {
            return `Erro de rede: ${f.reason}`;
          } else {
            return `URL falhou: ${f.value.url} - ${f.value.error || 'Erro desconhecido'}`;
          }
        }).join('\n');
        
        alert(`Bloqueio Crítico: ${falhas.length}/5 imagens não foram encontradas no servidor.\n\nDetalhes:\n${erroDetalhado}\n\nAs fotos precisam ser reenviadas.`);
        
        // Recarrega os dados para mostrar estado real
        await carregarDados();
        return;
      }

      console.log('✅ Todas as 5 imagens foram verificadas e existem no servidor');
    } catch (err) {
      console.error('Erro ao verificar estado atual:', err);
      alert('Erro ao verificar estado das fotos. Tente novamente.');
      return;
    }

    setEnviando(true);
    try {
      await avancarEtapa(ordemServicoId, { laudo_vistoria: observacoes });
      setOrdemServico(null); // Limpa estado local antes de completar
      onComplete();
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Verifique se as 5 fotos foram processadas.';
      alert('Bloqueio na Vistoria: ' + errorMessage);
      // Recarrega dados em caso de erro para mostrar estado real
      await carregarDados();
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
        ordemServicoId={ordemServicoId}
        momento="VISTORIA_GERAL"
        fotosIniciais={ordemServico?.midias || []}
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