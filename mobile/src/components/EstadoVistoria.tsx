import React, { useState } from 'react';
import { Check, AlertCircle, Camera as CameraIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadFotos, atualizarDadosAtendimento } from '../services/api';
import { IonSpinner } from '@ionic/react';

interface EstadoVistoriaProps {
  atendimentoId: number;
  onComplete: () => void;
}

const EstadoVistoria: React.FC<EstadoVistoriaProps> = ({ atendimentoId, onComplete }) => {
  const [partesSelecionadas, setPartesSelecionadas] = useState<string[]>([]);
  const [fotosTiradas, setFotosTiradas] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  // NOVO ESTADO: Obriga o usuário a interagir antes de avançar
  const [confirmouSemDano, setConfirmouSemDano] = useState(false);

  const partes = [
    'Capô', 'Porta LE', 'Porta LD', 'Pára-choque DI', 
    'Pára-choque TR', 'Teto', 'Porta-malas', 'Vidro Frontal', 'Vidro Traseiro'
  ];

  const toggleParte = (parte: string) => {
    // Se o usuário começar a marcar danos, desmarcamos a confirmação de "Sem Dano"
    setConfirmouSemDano(false);

    if (partesSelecionadas.includes(parte)) {
      setPartesSelecionadas(partesSelecionadas.filter(p => p !== parte));
      setFotosTiradas(fotosTiradas.filter(f => f !== parte));
    } else {
      setPartesSelecionadas([...partesSelecionadas, parte]);
    }
  };

  const capturarFoto = async (e: React.MouseEvent, parte: string) => {
    e.stopPropagation();
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        setEnviando(true);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        
        await uploadFotos(atendimentoId, 'ANTES', blob);
        
        setFotosTiradas(prev => [...prev, parte]);
      }
    } catch (error) {
      console.error("Erro ao capturar/enviar foto:", error);
      alert("Falha ao salvar foto. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleConcluir = async () => {
    setEnviando(true);
    try {
      await atualizarDadosAtendimento(atendimentoId, {
        laudo_vistoria: observacoes,
        partes_avaria: partesSelecionadas
      });
      onComplete();
    } catch (error: unknown) {
      console.error("ERRO NO FLUXO DE VISTORIA:", error);
      const msgErro = error instanceof Error ? error.message : "Erro ao concluir vistoria.";
      alert(msgErro);
    } finally {
      setEnviando(false);
    }
  };

  /**
   * NOVA TRAVA DE SEGURANÇA:
   * O botão agora nasce DESABILITADO. Ele só habilita se:
   * 1. O usuário confirmar explicitamente que o veículo NÃO tem danos.
   * 2. OU se ele selecionar partes com avaria E tirar fotos de TODAS elas.
   */
  const podeConcluir = !enviando && (
    (confirmouSemDano && partesSelecionadas.length === 0) || 
    (partesSelecionadas.length > 0 && partesSelecionadas.every(parte => fotosTiradas.includes(parte)))
  );

  return (
    <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Vistoria do Veículo</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Selecione as partes com danos e fotografe-as</p>

      {/* Alerta de Foto Obrigatória */}
      {partesSelecionadas.length > 0 && !podeConcluir && !enviando && (
        <div style={{ 
          background: 'rgba(255,149,0,0.1)', border: '1px solid #ff950040', 
          padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px', marginBottom: '24px' 
        }}>
          <AlertCircle color="#ff9500" size={20} />
          <div>
            <div style={{ color: '#ff9500', fontWeight: 900, fontSize: '14px' }}>Foto obrigatória</div>
            <div style={{ color: '#ff950080', fontSize: '12px' }}>Capture fotos de todas as partes marcadas para prosseguir.</div>
          </div>
        </div>
      )}

      {/* Grid de Partes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        {partes.map(p => {
          const selecionada = partesSelecionadas.includes(p);
          const comFoto = fotosTiradas.includes(p);
          
          return (
            <div 
              key={p} 
              onClick={() => !enviando && toggleParte(p)}
              style={{ 
                background: '#161616', 
                border: selecionada ? '2px solid #ff9500' : '1px solid #2a2a2a', 
                color: '#fff', padding: selecionada ? '12px' : '16px', 
                borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                textAlign: 'center', cursor: 'pointer', transition: '0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}
            >
              {p}
              {selecionada && (
                <button 
                  onClick={(e) => capturarFoto(e, p)}
                  disabled={enviando}
                  style={{ 
                    background: comFoto ? '#00ff66' : '#ff9500', color: '#000', 
                    border: 'none', borderRadius: '6px', padding: '4px 12px', 
                    fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' 
                  }}
                >
                  {enviando && !comFoto ? <IonSpinner name="crescent" style={{width: '12px', height: '12px'}} /> : <CameraIcon size={12} />}
                  {comFoto ? 'FOTO OK' : 'TIRAR FOTO'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Botão de Confirmação de "Sem Danos" - Torna a vistoria obrigatória mesmo sem avarias */}
      <div 
        onClick={() => {
          if (!enviando) {
            setConfirmouSemDano(!confirmouSemDano);
            setPartesSelecionadas([]);
            setFotosTiradas([]);
          }
        }}
        style={{ 
          background: confirmouSemDano ? 'rgba(0,255,102,0.1)' : '#161616', 
          border: confirmouSemDano ? '1px solid #00ff66' : '1px solid #2a2a2a', 
          padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', 
          gap: '12px', color: confirmouSemDano ? '#00ff66' : '#666', cursor: 'pointer', marginBottom: '24px',
          transition: '0.3s'
        }}
      >
        <div style={{ 
          width: '24px', height: '24px', borderRadius: '6px', border: '2px solid',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderColor: confirmouSemDano ? '#00ff66' : '#333'
        }}>
          {confirmouSemDano && <Check size={18} />}
        </div>
        <span style={{ fontWeight: 800, fontSize: '14px' }}>Veículo sem avarias identificadas</span>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Observações da Vistoria
        </label>
        <textarea 
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Veículo entregue com pertences no banco..."
          style={{ 
            background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', 
            color: '#fff', width: '100%', padding: '16px', fontSize: '14px', 
            minHeight: '100px', outline: 'none', resize: 'none', fontFamily: 'inherit'
          }}
        />
      </div>

      <button 
        disabled={!podeConcluir}
        onClick={handleConcluir} 
        style={{ 
          background: podeConcluir ? '#0066ff' : '#222', 
          color: podeConcluir ? '#fff' : '#444', 
          padding: '22px', borderRadius: '22px', fontWeight: 900, 
          border: 'none', fontSize: '16px', marginTop: 'auto', transition: '0.3s',
          opacity: podeConcluir ? 1 : 0.5,
          boxShadow: podeConcluir ? '0 10px 30px rgba(0,102,255,0.2)' : 'none'
        }}
      >
        {enviando ? <IonSpinner name="crescent" /> : "Concluir Vistoria e Iniciar Lavagem"}
      </button>
    </div>
  );
};

export default EstadoVistoria;