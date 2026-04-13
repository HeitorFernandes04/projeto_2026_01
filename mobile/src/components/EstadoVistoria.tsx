import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, AlertCircle, Camera, ClipboardList } from 'lucide-react';
import { IonSpinner } from '@ionic/react';
import { avancarEtapa, getAtendimento } from '../services/api';
import GaleriaFotos from './GaleriaFotos';

// Interfaces para eliminar erros de 'any' e garantir tipagem industrial
interface Midia {
  id?: number;
  arquivo: string;
  momento: 'ANTES' | 'DEPOIS';
}

interface AtendimentoVistoria {
  id: number;
  midias?: Midia[];
  status?: string;
  etapa_atual?: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '20px', paddingBottom: '120px' },
  sectionTitle: { color: '#fff', fontSize: '18px', fontWeight: 800, margin: '20px 0 16px', letterSpacing: '-0.5px' },
  // ALTERAÇÃO: Grid de 2 colunas conforme Captura 093703
  photoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  // ALTERAÇÃO: Card grande (quadradão) de 140px de altura
  photoCard: { 
    background: '#0a0a0a', 
    borderRadius: '20px', 
    height: '140px',
    textAlign: 'center', 
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    border: '1px solid #1a1a1a'
  },
  photoIconBox: {
    background: '#141414',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '16px',
    marginBottom: '24px'
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
    textTransform: 'uppercase'
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
  textarea: { 
    width: '100%', 
    padding: '18px', 
    borderRadius: '20px', 
    fontSize: '14px', 
    border: '1px solid #1a1a1a', 
    resize: 'none', 
    background: '#0a0a0a', 
    color: '#fff',
    minHeight: '130px',
    outline: 'none'
  }
};

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

  const fotosExistentes = atendimento?.midias?.filter((m: Midia) => m.momento === 'ANTES') || [];
  const podeConcluir = fotosExistentes.length >= 5;

  const handleFinalizar = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!podeConcluir || enviando) return;
    
    setEnviando(true);
    try {
      await avancarEtapa(atendimentoId, { laudo_vistoria: observacoes });
      onComplete(); 
    } catch (err: unknown) {
      console.error('Erro ao salvar vistoria:', err);
      alert('Erro ao finalizar vistoria. Verifique a conexão.');
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
          momento="ANTES" 
          fotosIniciais={atendimento?.midias || []} 
          onUploadSuccess={carregarDados} 
        />
      </div>

      <h3 style={styles.sectionTitle}>Checklist de Vistoria</h3>

      <div style={{ 
        ...styles.statusBanner, 
        background: podeConcluir ? 'rgba(0,255,136,0.05)' : 'rgba(255,149,0,0.05)', 
        border: `1px solid ${podeConcluir ? '#00ff8820' : '#ff950020'}` 
      }}>
        {podeConcluir ? <Check color="#00ff88" size={20} /> : <AlertCircle color="#ff9500" size={20} />}
        <div>
          <div style={{ color: podeConcluir ? '#00ff88' : '#ff9500', fontWeight: 900, fontSize: '14px' }}>
            {fotosExistentes.length}/5 Fotos Registradas
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            Capture as 5 fotos obrigatórias para liberar a próxima etapa.
          </p>
        </div>
      </div>

      <div style={styles.photoGrid}>
        {partesObrigatorias.map((parte, index) => {
          const jaTemFoto = index < fotosExistentes.length;
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

      <div style={{ marginBottom: '40px' }}>
        <label style={styles.label}><ClipboardList size={16} color="var(--lm-primary)" /> Laudo Técnico de Entrada</label>
        <textarea 
          value={observacoes} 
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Riscos leves no para-choque, veículo sem estepe..." 
          style={styles.textarea}
        />
      </div>

      <button 
        type="button" 
        onClick={handleFinalizar} 
        disabled={!podeConcluir || enviando} 
        style={{ 
          ...styles.btnMain, 
          background: podeConcluir ? 'var(--lm-primary)' : '#1a1a1a', 
          color: podeConcluir ? '#fff' : '#444',
          boxShadow: podeConcluir ? '0 10px 30px rgba(0, 102, 255, 0.3)' : 'none'
        }}
      >
        {enviando ? <IonSpinner name="dots" /> : 'CONCLUIR VISTORIA'}
      </button>
    </div>
  );
};

export default EstadoVistoria;