import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, MapPin, Camera, Key, AlertCircle } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { finalizarAtendimentoEtapa4, getAtendimento } from '../services/api';
import { useHistory } from 'react-router-dom';
import GaleriaFotos from './GaleriaFotos';

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', paddingBottom: '120px' },
  sectionTitle: { color: '#fff', fontSize: '18px', fontWeight: 800, margin: '20px 0 16px', letterSpacing: '-0.5px' },
  // ALTERAÇÃO: Grid de 2 colunas para cards maiores conforme Captura 093703
  photoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  // ALTERAÇÃO: Card grande (quadradão) com 140px de altura
  photoCard: { 
    background: '#0a0a0a', 
    border: '1px solid #1a1a1a', 
    borderRadius: '20px', 
    height: '140px',
    textAlign: 'center', 
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.3s ease'
  },
  photoIconBox: {
    background: '#141414',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: { 
    fontSize: '14px', 
    fontWeight: 700, 
    color: '#fff', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  input: { 
    background: '#0a0a0a', 
    border: '1px solid #1a1a1a', 
    color: '#fff', 
    padding: '18px', 
    borderRadius: '20px', 
    width: '100%',
    fontSize: '15px',
    outline: 'none'
  },
  btnMain: { 
    width: '100%', 
    padding: '22px', 
    borderRadius: '20px', 
    fontSize: '16px', 
    fontWeight: 900, 
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    textTransform: 'uppercase',
    marginTop: '20px'
  }
};

const EstadoLiberacao: React.FC<{ atendimentoId: number; onComplete: () => void; }> = ({ atendimentoId, onComplete }) => {
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<{midias?: Array<{arquivo: string; momento: 'ANTES' | 'DEPOIS'}>} | null>(null);
  const [vaga, setVaga] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const galeriaRef = useRef<HTMLDivElement>(null);

  const fetchDados = useCallback(async () => {
    try {
      const data = await getAtendimento(atendimentoId);
      setAtendimento(data);
    } catch (err) {
      console.error("Erro ao carregar dados de entrega:", err);
    } finally {
      setLoading(false);
    }
  }, [atendimentoId]);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const fotosDepois = atendimento?.midias?.filter((m) => m.momento === 'DEPOIS') || [];
  const podeLiberar = fotosDepois.length >= 5 && vaga.trim().length > 0;

  const handleFinalizarGeral = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!podeLiberar || enviando) return;
    
    setEnviando(true);
    try {
      await finalizarAtendimentoEtapa4(atendimentoId, { 
        vaga_patio: vaga 
      });
      onComplete();
      history.push('/atendimentos/hoje'); 
    } catch (err: unknown) {
      console.error('Erro ao liberar veículo:', err);
      alert('Erro ao liberar veículo. Verifique se as 5 fotos foram processadas.');
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
    <div style={styles.container}>
      <div ref={galeriaRef} style={{ display: 'none' }}>
        <GaleriaFotos 
          atendimentoId={atendimentoId} 
          momento="DEPOIS" 
          fotosIniciais={atendimento?.midias || []} 
          onUploadSuccess={fetchDados} 
        />
      </div>

      <h3 style={styles.sectionTitle}>Fotos de Entrega</h3>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '16px', 
        borderRadius: '16px', 
        marginBottom: '24px', 
        background: podeLiberar ? 'rgba(0,255,136,0.05)' : 'rgba(255,149,0,0.05)', 
        border: `1px solid ${podeLiberar ? '#00ff8820' : '#ff950020'}` 
      }}>
        {podeLiberar ? <Check color="#00ff88" size={20} /> : <AlertCircle color="#ff9500" size={20} />}
        <div>
          <div style={{ color: podeLiberar ? '#00ff88' : '#ff9500', fontWeight: 900, fontSize: '14px' }}>
            {podeLiberar ? 'Pronto para Liberação' : 'Aguardando Checklist'}
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            {!podeLiberar && (
              fotosDepois.length < 5 
                ? `${fotosDepois.length}/5 fotos registradas` 
                : 'Informe a vaga de saída para concluir'
            )}
          </p>
        </div>
      </div>

      <div style={styles.photoGrid}>
        {['Lateral Esq', 'Lateral Dir', 'Teto', 'Frente', 'Traseira'].map((parte, idx) => {
          const jaTemFoto = idx < fotosDepois.length;
          return (
            <div key={parte} onClick={() => galeriaRef.current?.querySelector('button')?.click()} style={{
              ...styles.photoCard,
              border: jaTemFoto ? '2px solid #00ff8840' : '1px solid #1a1a1a',
              boxShadow: jaTemFoto ? '0 0 15px rgba(0, 255, 136, 0.1)' : 'none'
            }}>
              <div style={styles.photoIconBox}>
                {jaTemFoto ? <Check color="#00ff88" size={24} /> : <Camera color="#444" size={24} />}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: jaTemFoto ? '#00ff88' : '#fff', textTransform: 'uppercase' }}>
                {jaTemFoto ? 'OK' : parte}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={styles.label}><MapPin size={16} color="var(--lm-primary)" /> Localização / Vaga de Saída *</label>
        <input 
          value={vaga} 
          onChange={(e) => setVaga(e.target.value)}
          placeholder="Ex: Vaga A1, Frente da Loja..." 
          style={styles.input}
        />
      </div>

      <button 
        type="button"
        onClick={handleFinalizarGeral} 
        disabled={!podeLiberar || enviando} 
        style={{ 
          ...styles.btnMain, 
          background: podeLiberar ? 'var(--lm-green)' : '#1a1a1a', 
          color: podeLiberar ? '#000' : '#444',
          boxShadow: podeLiberar ? '0 10px 30px rgba(34, 197, 94, 0.3)' : 'none'
        }}
      >
        {enviando ? <IonSpinner name="dots" /> : <><Key size={20} /> CONCLUIR E LIBERAR VEÍCULO</>}
      </button>
    </div>
  );
};

export default EstadoLiberacao;