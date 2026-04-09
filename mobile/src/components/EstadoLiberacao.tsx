import { useHistory } from 'react-router-dom';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertCircle, Camera, MapPin } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { finalizarAtendimentoEtapa4, getAtendimento } from '../services/api';
import GaleriaFotos from './GaleriaFotos';

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse-glow {
    0% { box-shadow: 0 0 5px rgba(0, 102, 255, 0.2); }
    50% { box-shadow: 0 0 20px rgba(0, 102, 255, 0.5); }
    100% { box-shadow: 0 0 5px rgba(0, 102, 255, 0.2); }
  }
`;
if (!document.head.querySelector('style[data-spin-animation]')) {
  style.setAttribute('data-spin-animation', 'true');
  document.head.appendChild(style);
}

interface Midia {
  id: number;
  arquivo: string;
  momento: "ANTES" | "DEPOIS";
}

interface Atendimento {
  id: number;
  veiculo: { placa: string; modelo: string; nome_dono: string };
  status: string;
  etapa_atual: number;
  midias: Midia[];
}

const EstadoLiberacao: React.FC<{ 
  atendimentoId: number;
  onComplete: () => void;
}> = ({ atendimentoId, onComplete }) => {
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [vaga, setVaga] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const galeriaRef = useRef<HTMLDivElement>(null);

  const partesObrigatorias = ['Lateral Motorista', 'Lateral Passageiro', 'Teto', 'Frente', 'Atrás'];

  const fetchAtendimento = useCallback(async () => {
    try {
      const data = await getAtendimento(atendimentoId);
      setAtendimento(data as unknown as Atendimento);
    } catch (err) {
      console.error('Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  }, [atendimentoId]);

  useEffect(() => {
    fetchAtendimento();
  }, [fetchAtendimento]);

  const fotosServidor = atendimento?.midias?.filter(m => m.momento === 'DEPOIS') || [];
  const fotosRegistradas = fotosServidor.length;
  
  // Variável unificada para validação
  const podeFinalizar = fotosRegistradas >= 5 && vaga.trim().length > 0;

  const handleCardClick = () => {
    galeriaRef.current?.querySelector('button')?.click();
  };


// Dentro do componente EstadoLiberacao:
const history = useHistory();

const handleFinalizarAtendimento = async () => {
  console.log("FINALIZAR CHAMADO - podeFinalizar:", podeFinalizar, "enviando:", enviando);
  
  if (!podeFinalizar || enviando) {
    console.log("FINALIZAR BLOQUEADO - podeFinalizar:", podeFinalizar, "enviando:", enviando);
    return;
  }
  
  setEnviando(true);
  try {
    console.log("FINALIZAR ENVIANDO REQUISIÇÃO...");
    
    // 1. Envia os dados para o backend e finaliza o status
    await finalizarAtendimentoEtapa4(atendimentoId, { 
      vaga_patio: vaga, 
      observacoes: observacoes 
    });

    console.log("FINALIZAR REQUISIÇÃO CONCLUÍDA");

    // 2. Chama a função de atualização (opcional, para atualizar estados globais)
    if (onComplete) {
      console.log("FINALIZAR CHAMANDO onComplete");
      onComplete();
    }

    // 3. REDIRECIONA para o pátio (Atendimentos Hoje)
    console.log("FINALIZAR REDIRECIONANDO...");
    history.push('/atendimentos/hoje'); 
    
  } catch (err: unknown) {
    console.error("FINALIZAR ERRO:", err);
    const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar.';
    alert(errorMessage);
  } finally {
    console.log("FINALIZAR FINALLY - setEnviando(false)");
    setEnviando(false);
  }
};

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><IonSpinner name="crescent" color="primary" /></div>;

  return (
    <div style={{ padding: '32px 20px', paddingBottom: '120px' }}>
      <div ref={galeriaRef} style={{ display: 'none' }}>
        <GaleriaFotos 
          atendimentoId={atendimentoId}
          momento="DEPOIS"
          fotosIniciais={atendimento?.midias || []}
          onUploadSuccess={fetchAtendimento}
        />
      </div>

      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Fotos de Entrega</h3>

      <div style={{ 
        background: podeFinalizar ? 'rgba(0,255,136,0.1)' : 'rgba(255,149,0,0.1)', 
        border: `1px solid ${podeFinalizar ? '#00ff8840' : '#ff950040'}`, 
        padding: '16px', borderRadius: '16px', display: 'flex', gap: '12px', marginBottom: '24px' 
      }}>
        {podeFinalizar ? <Check color="#00ff88" /> : <AlertCircle color="#ff9500" />}
        <div>
          {/* CORREÇÃO AQUI: Alterado de podeConcluir para podeFinalizar */}
          <div style={{ color: podeFinalizar ? '#00ff88' : '#ff9500', fontWeight: 900, fontSize: '14px' }}>
            {fotosRegistradas}/5 Fotos • {vaga ? 'Vaga OK' : 'Falta Vaga'}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
            Capture as 5 fotos e informe a vaga para liberar o veículo.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {partesObrigatorias.map((parte, index) => {
          const comFoto = index < fotosRegistradas;
          return (
            <div key={parte} onClick={handleCardClick} style={{
              position: 'relative',
              background: comFoto ? 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)' : '#0a0a0a',
              border: comFoto ? '2px solid #00ff88' : '2px solid #2a2a2a',
              borderRadius: '16px', padding: '24px 16px', minHeight: '130px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: comFoto ? 'rgba(0, 255, 136, 0.1)' : 'rgba(102, 102, 102, 0.1)',
                border: comFoto ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(102, 102, 102, 0.2)'
              }}>
                {comFoto ? <Check color="#00ff88" size={20} /> : <Camera color="#666" size={20} />}
              </div>
              <div style={{ color: comFoto ? '#00ff88' : '#fff', fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>{parte}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="#0066ff" /> Localização / Vaga de Saída *
        </label>
        <input
          type="text"
          value={vaga}
          onChange={(e) => setVaga(e.target.value)}
          placeholder="Ex: Vaga A1, Frente da Loja..."
          style={{
            width: '100%', height: '56px', background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '12px', padding: '0 15px', color: '#fff', fontSize: '16px', outline: 'none'
          }}
        />
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '10px', display: 'block' }}>
          Observações Finais (Opcional)
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Alguma observação sobre a entrega?"
          style={{
            width: '100%', minHeight: '100px', background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '12px', padding: '15px', color: '#fff', fontSize: '14px', resize: 'none'
          }}
        />
      </div>

      <button
        onClick={handleFinalizarAtendimento}
        disabled={!podeFinalizar || enviando}
        style={{
          width: '100%', height: '64px', borderRadius: '18px', fontWeight: 800,
          background: podeFinalizar ? '#0066ff' : '#1a1a1a', 
          color: podeFinalizar ? '#fff' : '#444', border: 'none',
          animation: podeFinalizar ? 'pulse-glow 2s infinite' : 'none'
        }}
      >
        {enviando ? 'FINALIZANDO...' : 'CONCLUIR E LIBERAR VEÍCULO'}
      </button>
    </div>
  );
};

export default EstadoLiberacao;