import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertCircle, Camera, ClipboardList } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa, getAtendimento } from '../services/api';
import GaleriaFotos from './GaleriaFotos';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px' },
  sectionTitle: { color: '#fff', fontSize: '16px', fontWeight: 700, margin: '20px 0 16px' },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' },
  photoCard: { 
    background: '#1a1a1a', 
    border: '2px solid #2a2a2a', 
    borderRadius: '12px', 
    padding: '16px', 
    textAlign: 'center', 
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  btnMain: { 
    width: '100%', 
    padding: '16px', 
    borderRadius: '12px', 
    fontSize: '16px', 
    fontWeight: 700, 
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#0066ff',
    color: '#fff'
  },
  label: { 
    fontSize: '14px', 
    fontWeight: 700, 
    color: '#fff', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginBottom: '8px' 
  },
  textarea: { 
    width: '100%', 
    padding: '16px', 
    borderRadius: '12px', 
    fontSize: '14px', 
    border: 'none', 
    resize: 'none', 
    background: '#1a1a1a', 
    color: '#fff' 
  }
};

const EstadoVistoria: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const [atendimento, setAtendimento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [observacoes, setObservacoes] = useState('');
  const [enviando, setEnviando] = useState(false);
  const galeriaRef = useRef<HTMLDivElement>(null);

  const partesObrigatorias = ['Lateral Motorista', 'Lateral Passageiro', 'Teto', 'Frente', 'Atrás'];

  const carregarDados = useCallback(async () => {
    try {
      const data = await getAtendimento(atendimentoId);
      setAtendimento(data);
    } catch (err) {
      console.error('Erro ao carregar vistoria:', err);
    } finally {
      setLoading(false);
    }
  }, [atendimentoId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const fotosExistentes = atendimento?.midias?.filter((m: any) => m.momento === 'ANTES') || [];
  const podeConcluir = fotosExistentes.length >= 5;

  const handleFinalizar = async () => {
    if (!podeConcluir || enviando) return;
    setEnviando(true);
    try {
      // RN-07: Injeta as observações da vistoria (laudo) no backend
      await avancarEtapa(atendimentoId, observacoes);
      onComplete(); // Axioma 13: Move para a etapa de Lavagem
    } catch (err) {
      alert('Erro ao salvar vistoria.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><IonSpinner color="primary" /></div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <div ref={galeriaRef} style={{ display: 'none' }}>
        <GaleriaFotos 
          atendimentoId={atendimentoId} momento="ANTES" 
          fotosIniciais={atendimento?.midias || []} onUploadSuccess={carregarDados} 
        />
      </div>

      <h3 style={styles.sectionTitle}>Fotos Obrigatórias</h3>

      <div style={{ ...styles.statusBanner, background: podeConcluir ? 'rgba(0,255,136,0.1)' : 'rgba(255,149,0,0.1)', border: `1px solid ${podeConcluir ? '#00ff8840' : '#ff950040'}` }}>
        {podeConcluir ? <Check color="#00ff88" /> : <AlertCircle color="#ff9500" />}
        <div>
          <div style={{ color: podeConcluir ? '#00ff88' : '#ff9500', fontWeight: 900, fontSize: '14px' }}>
            {fotosExistentes.length}/5 Fotos Registradas
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Capture todas as vistas do veículo.</p>
        </div>
      </div>

      <div style={styles.photoGrid}>
        {partesObrigatorias.map((parte, index) => (
          <div key={parte} onClick={() => galeriaRef.current?.querySelector('button')?.click()} style={{
            ...styles.photoCard,
            border: index < fotosExistentes.length ? '2px solid #00ff88' : '2px solid #2a2a2a'
          }}>
            {index < fotosExistentes.length ? <Check color="#00ff88" /> : <Camera color="#444" />}
            <span style={{ fontSize: '11px', fontWeight: 700, color: index < fotosExistentes.length ? '#00ff88' : '#fff' }}>{parte}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '32px' }}>
        <label style={styles.label}><ClipboardList size={14} /> Observações da Vistoria</label>
        <textarea 
          value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Descreva avarias existentes, riscos ou objetos no veículo..." style={styles.textarea}
        />
      </div>

      <button onClick={handleFinalizar} disabled={!podeConcluir || enviando} style={{ ...styles.btnMain, background: podeConcluir ? '#0066ff' : '#1a1a1a', color: podeConcluir ? '#fff' : '#444' }}>
        {enviando ? <IonSpinner name="crescent" /> : 'FINALIZAR VISTORIA'}
      </button>
    </div>
  );
};