import React, { useState } from 'react';
import { MapPin, Sparkles, MessageSquare } from 'lucide-react';
import { atualizarDadosAtendimento } from '../services/api';
import { IonSpinner } from '@ionic/react';

interface EstadoAcabamentoProps {
  atendimentoId: number;
  onComplete: () => void;
}

export const EstadoAcabamento: React.FC<EstadoAcabamentoProps> = ({ atendimentoId, onComplete }) => {
  const [vaga, setVaga] = useState('Vaga A-12');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleConcluir = async () => {
    setEnviando(true);
    try {
      // Salva a vaga e as notas de acabamento no backend
      await atualizarDadosAtendimento(atendimentoId, {
        vaga_patio: vaga,
        laudo_acabamento: notas
      });
      onComplete();
    } catch (error: unknown) {
      const msgErro = error instanceof Error ? error.message : "Erro ao salvar dados de acabamento.";
      alert(msgErro);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ background: 'rgba(255,149,0,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <MapPin color="#ff9500" size={40} />
      </div>
      
      <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Aguardando Acabamento</h3>
      <p style={{ color: '#666', fontSize: '15px', marginBottom: '40px' }}>Veículo da OS #{atendimentoId} pronto para etapa de acabamento</p>

      <div style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '24px', borderRadius: '20px', textAlign: 'left', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0066ff', marginBottom: '8px' }}>
          <MapPin size={18} />
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Confirmar Local no Pátio</span>
        </div>
        <input 
          value={vaga}
          onChange={(e) => setVaga(e.target.value)}
          style={{ 
            background: 'none', border: 'none', color: '#fff', fontSize: '20px', 
            fontWeight: 900, width: '100%', outline: 'none' 
          }}
        />
      </div>

      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <MessageSquare size={14} /> Notas de Acabamento
        </label>
        <textarea 
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ex: Aplicado revitalizador de plásticos..."
          style={{ 
            background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', color: '#fff', 
            width: '100%', padding: '16px', fontSize: '14px', minHeight: '80px', outline: 'none', resize: 'none', fontFamily: 'inherit'
          }}
        />
      </div>

      <button 
        onClick={handleConcluir} 
        disabled={enviando}
        style={{ 
          background: '#0066ff', color: '#fff', padding: '20px', borderRadius: '20px', fontWeight: 900, border: 'none', 
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 30px rgba(0,102,255,0.2)'
        }}
      >
        {enviando ? <IonSpinner name="crescent" /> : <><Sparkles size={20} /> Iniciar Acabamento</>}
      </button>
    </div>
  );
};