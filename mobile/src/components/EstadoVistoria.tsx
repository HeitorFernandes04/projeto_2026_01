import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertCircle, Camera } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa, getAtendimento } from '../services/api';
import GaleriaFotos from './GaleriaFotos';

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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
  veiculo: {
    placa: string;
    modelo: string;
    marca: string;
    nome_dono: string;
  };
  servico: {
    nome: string;
  };
  status: string;
  etapa_atual: number;
  midias: Midia[];
}

const EstadoVistoria: React.FC<{ 
  atendimentoId: number;
  onComplete: () => void;
}> = ({ atendimentoId, onComplete }) => {
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  // Referência para acionar a galeria única
  const galeriaRef = useRef<HTMLDivElement>(null);

  const partesObrigatorias = ['Lateral Motorista', 'Lateral Passageiro', 'Teto', 'Frente', 'Atrás'];

  const fetchAtendimento = useCallback(async () => {
      try {
        const data = await getAtendimento(atendimentoId);
        setAtendimento(data as unknown as Atendimento);
        setError(null);
      } catch (err) {
        console.error('Erro na requisição:', err);
        setError('Erro de conexão com o servidor');
      } finally {
        setLoading(false);
      }
  }, [atendimentoId]);

  useEffect(() => {
    fetchAtendimento();
  }, [fetchAtendimento]);

  const fotosServidor = atendimento?.midias?.filter(m => m.momento === 'ANTES') || [];
  const fotosRegistradas = fotosServidor.length;
  const podeConcluir = fotosRegistradas >= 5;

  // Função para abrir a câmera/galeria ao clicar no card
  const handleCardClick = () => {
    const botaoUpload = galeriaRef.current?.querySelector('button');
    if (botaoUpload) {
      botaoUpload.click();
    }
  };

  const handleFinalizarVistoria = async () => {
    if (!podeConcluir || !atendimento || enviando) return;
    setEnviando(true);
    try {
      await avancarEtapa(atendimentoId, { observacoes });
      onComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao finalizar vistoria.';
      alert(errorMessage);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ff4444' }}>
        <AlertCircle size={48} style={{ marginBottom: '16px' }} />
        <p>{error}</p>
        <button onClick={fetchAtendimento} style={{ color: '#fff', textDecoration: 'underline', background: 'none', border: 'none' }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '120px' }}>
      
      {/* Galeria Oculta - Usada apenas como gatilho para os cards */}
      <div ref={galeriaRef} style={{ display: 'none' }}>
        <GaleriaFotos 
          atendimentoId={atendimentoId}
          momento="ANTES"
          fotosIniciais={atendimento?.midias || []}
          onUploadSuccess={fetchAtendimento}
        />
      </div>

      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Fotos Obrigatórias</h3>

      <div style={{ 
        background: podeConcluir ? 'rgba(0,255,136,0.1)' : 'rgba(255,149,0,0.1)', 
        border: `1px solid ${podeConcluir ? '#00ff8840' : '#ff950040'}`, 
        padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px', marginBottom: '24px' 
      }}>
        {podeConcluir ? <Check color="#00ff88" size={20} /> : <AlertCircle color="#ff9500" size={20} />}
        <div>
          <div style={{ color: podeConcluir ? '#00ff88' : '#ff9500', fontWeight: 900, fontSize: '14px' }}>
            {fotosRegistradas}/5 Fotos Registradas
          </div>
          <div style={{ color: '#888', fontSize: '12px' }}>
            {podeConcluir ? 'Tudo pronto para iniciar.' : 'Capture as 5 fotos para habilitar o botão.'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {partesObrigatorias.map((parte: string, index: number) => {
          // Marca como "Capturada" se houver uma foto correspondente no servidor
          const comFoto = index < fotosRegistradas;
          
          return (
            <div 
              key={parte} 
              onClick={handleCardClick}
              style={{
                position: 'relative',
                background: comFoto ? 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)' : 'linear-gradient(135deg, #0a0a0a 0%, #050505 100%)',
                border: comFoto ? '2px solid #00ff88' : '2px solid #2a2a2a',
                borderRadius: '16px', padding: '24px 16px', minHeight: '140px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: comFoto ? '0 8px 25px rgba(0, 255, 136, 0.2)' : 'none',
                cursor: 'pointer'
              }}
            >
              {comFoto && (
                <div style={{
                  position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px',
                  background: '#00ff88', borderRadius: '50%', animation: 'pulse 2s infinite'
                }} />
              )}
              
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: comFoto ? 'rgba(0, 255, 136, 0.1)' : 'rgba(102, 102, 102, 0.1)',
                border: comFoto ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(102, 102, 102, 0.2)'
              }}>
                {comFoto ? <Check color="#00ff88" size={24} /> : <Camera color="#666" size={24} />}
              </div>
              
              <div style={{ color: comFoto ? '#00ff88' : '#fff', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
                {parte}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: comFoto ? '#00ff88' : '#666' }}>
                {comFoto ? 'Capturada' : 'Pendente'}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ color: '#fff', fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
          Observações da Vistoria
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Descreva avarias ou itens deixados no veículo..."
          style={{
            width: '100%', minHeight: '100px', background: '#1a1a1a', border: '1px solid #2a2a2a',
            borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px'
          }}
        />
      </div>

      <button
        onClick={handleFinalizarVistoria}
        disabled={!podeConcluir || enviando}
        style={{
          width: '100%', height: '64px', borderRadius: '16px', fontWeight: 800, fontSize: '16px',
          background: podeConcluir ? '#0066ff' : '#1a1a1a', 
          color: podeConcluir ? '#fff' : '#444', 
          border: 'none', cursor: podeConcluir ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          boxShadow: podeConcluir ? '0 8px 25px rgba(0, 102, 255, 0.3)' : 'none',
          animation: podeConcluir ? 'pulse-glow 2s infinite' : 'none'
        }}
      >
        {enviando ? (
          <div style={{ width: '24px', height: '24px', border: '3px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : (
          <>
            <Check size={20} strokeWidth={3} />
            FINALIZAR VISTORIA
          </>
        )}
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `
      }} />
    </div>
  );
};

export default EstadoVistoria;