import React, { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Camera as CameraIcon, CheckCircle2, MapPin, MessageSquare } from 'lucide-react';
import { getAtendimento, uploadFotos, atualizarDadosAtendimento } from '../services/api';
import { IonSpinner } from '@ionic/react';

interface Midia {
  id: number;
  momento: 'ANTES' | 'DEPOIS';
  arquivo: string;
  parte_nome?: string;
}

interface EstadoLiberacaoProps {
  atendimentoId: number;
  onComplete: () => void;
}

const EstadoLiberacao: React.FC<EstadoLiberacaoProps> = ({ atendimentoId, onComplete }) => {
  const [vaga, setVaga] = useState('');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [partesComAvaria, setPartesComAvaria] = useState<string[]>([]);
  const [fotosDepoisTiradas, setFotosDepoisTiradas] = useState<string[]>([]);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        const dados = await getAtendimento(atendimentoId);
        
        // Garante que as partes marcadas na vistoria sejam carregadas
        if (dados.partes_avaria) {
          setPartesComAvaria(dados.partes_avaria);
        }
        
        if (dados.vaga_patio) setVaga(dados.vaga_patio);

        // Mapeia fotos já tiradas para o momento DEPOIS
        const fotosDepois = dados.midias
          ?.filter((m: Midia) => m.momento === 'DEPOIS')
          .map((m: Midia) => m.parte_nome || ""); 
          
        if (fotosDepois) {
          setFotosDepoisTiradas(fotosDepois.filter((f: string) => f !== ""));
        }
      } catch (error) {
        console.error("Erro ao carregar dados de liberação:", error);
      }
    };
    carregarDadosIniciais();
  }, [atendimentoId]);

  const capturarFotoDepois = async (parte: string) => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        setEnviando(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        
        // É vital que o backend suporte receber o nome da parte aqui
        await uploadFotos(atendimentoId, 'DEPOIS', blob);
        
        setFotosDepoisTiradas(prev => [...prev, parte]);
      }
    } catch (error) {
      console.error("Erro na captura:", error);
    } finally {
      setEnviando(false);
    }
  };

  const handleFinalizar = async () => {
    if (!vaga) {
      alert("Informe a vaga antes de finalizar.");
      return;
    }

    setEnviando(true);
    try {
      await atualizarDadosAtendimento(atendimentoId, {
        vaga_patio: vaga,
        notas_entrega: notas,
        status: 'finalizado' 
      });
      onComplete();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      alert(msg);
    } finally {
      setEnviando(false);
    }
  };

  // Trava: Vaga preenchida + Fotos de todas as avarias iniciais
  const todasFotosOk = partesComAvaria.every(p => fotosDepoisTiradas.includes(p));
  const podeFinalizar = !enviando && vaga !== '' && todasFotosOk;

  return (
    <div style={{ padding: '32px 20px' }}>
      <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '8px' }}>Liberação do Veículo</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>Registre o estado final e a localização</p>

      {/* Bloco de Fotos Comparativas */}
      {partesComAvaria.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <label style={{ color: '#ff9500', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
            Fotos Obrigatórias (DEPOIS) - {fotosDepoisTiradas.length}/{partesComAvaria.length}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {partesComAvaria.map(parte => {
              const jaTirou = fotosDepoisTiradas.includes(parte);
              return (
                <div key={parte} style={{ 
                  background: '#161616', border: jaTirou ? '1px solid #00ff66' : '1px solid #2a2a2a', 
                  padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
                }}>
                  <span style={{ color: '#fff', fontWeight: 700 }}>{parte}</span>
                  <button 
                    onClick={() => capturarFotoDepois(parte)}
                    disabled={enviando}
                    style={{ 
                      background: jaTirou ? '#00ff66' : '#ff9500', color: '#000', border: 'none', 
                      borderRadius: '8px', padding: '8px 16px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' 
                    }}
                  >
                    {jaTirou ? <CheckCircle2 size={16} /> : <CameraIcon size={16} />}
                    {jaTirou ? 'OK' : 'FOTO'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vaga no Pátio */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} /> Vaga / Localização
        </label>
        <input 
          value={vaga} onChange={(e) => setVaga(e.target.value)}
          placeholder="Ex: Vaga A-12"
          style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', color: '#fff', width: '100%', padding: '16px', outline: 'none' }}
        />
      </div>

      {/* Notas para o Cliente */}
      <div style={{ marginBottom: '40px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} /> Notas Finais
        </label>
        <textarea 
          value={notas} onChange={(e) => setNotas(e.target.value)}
          placeholder="Ex: Calibragem feita..."
          style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', color: '#fff', width: '100%', padding: '16px', fontSize: '14px', minHeight: '80px', outline: 'none', resize: 'none' }}
        />
      </div>

      <button 
        onClick={handleFinalizar}
        disabled={!podeFinalizar}
        style={{ 
          background: podeFinalizar ? '#00ff66' : '#222', color: '#000', padding: '20px', 
          borderRadius: '20px', fontWeight: 900, width: '100%', opacity: podeFinalizar ? 1 : 0.5, transition: '0.3s' 
        }}
      >
        {enviando ? <IonSpinner name="crescent" /> : "Finalizar e Liberar"}
      </button>
    </div>
  );
};

export default EstadoLiberacao;