import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, MapPin, Camera, Key } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { finalizarAtendimento, getAtendimento } from '../services/api';
import { useHistory } from 'react-router-dom';
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
  label: { color: '#fff', fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' },
  input: { 
    background: '#1a1a1a', 
    border: '1px solid #2a2a2a', 
    color: '#fff', 
    padding: '12px', 
    borderRadius: '8px', 
    width: '100%',
    outline: 'none'
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
    gap: '8px'
  }
};

const EstadoLiberacao: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<any>(null);
  const [vaga, setVaga] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const galeriaRef = useRef<HTMLDivElement>(null);

  const fetchDados = useCallback(async () => {
    const data = await getAtendimento(atendimentoId);
    setAtendimento(data);
    setLoading(false);
  }, [atendimentoId]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const fotosDepois = atendimento?.midias?.filter((m: any) => m.momento === 'DEPOIS') || [];
  const podeLiberar = fotosDepois.length >= 5 && vaga.trim().length > 0;

  const handleFinalizarGeral = async () => {
    if (!podeLiberar || enviando) return;
    setEnviando(true);
    try {
      // Envia vaga_patio e finaliza o status para 'finalizado' no banco
      await finalizarAtendimento(atendimentoId);
      onComplete();
      history.push('/atendimentos/hoje'); // Redireciona para o pátio vazio
    } catch (err) {
      alert('Erro ao liberar veículo.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><IonSpinner color="primary" /></div>;

  return (
    <div style={{ padding: '20px', paddingBottom: '120px' }}>
      <div ref={galeriaRef} style={{ display: 'none' }}>
        <GaleriaFotos 
          atendimentoId={atendimentoId} momento="DEPOIS" 
          fotosIniciais={atendimento?.midias || []} onUploadSuccess={fetchDados} 
        />
      </div>

      <h3 style={styles.sectionTitle}>Fotos de Entrega</h3>

      <div style={styles.photoGrid}>
        {['Lateral Esq', 'Lateral Dir', 'Teto', 'Frente', 'Traseira'].map((parte, idx) => (
          <div key={parte} onClick={() => galeriaRef.current?.querySelector('button')?.click()} style={{
            ...styles.photoCard,
            border: idx < fotosDepois.length ? '2px solid #00ff88' : '2px solid #2a2a2a'
          }}>
            {idx < fotosDepois.length ? <Check color="#00ff88" /> : <Camera color="#444" />}
            <span style={{ fontSize: '11px', color: '#fff' }}>{parte}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={styles.label}><MapPin size={14} color="#0066ff" /> Vaga de Saída *</label>
        <input 
          value={vaga} onChange={(e) => setVaga(e.target.value)}
          placeholder="Ex: Vaga A-05, Portão Lateral..." style={styles.input}
        />
      </div>

      <button onClick={handleFinalizarGeral} disabled={!podeLiberar || enviando} style={{ ...styles.btnMain, background: podeLiberar ? '#00ff88' : '#1a1a1a', color: podeLiberar ? '#000' : '#444' }}>
        {enviando ? <IonSpinner name="crescent" /> : <><Key size={20} /> CONCLUIR E LIBERAR</>}
      </button>
    </div>
  );
};