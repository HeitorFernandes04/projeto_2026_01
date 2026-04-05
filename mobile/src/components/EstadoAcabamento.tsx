import React from 'react';
import { MapPin, Sparkles, MessageSquare } from 'lucide-react';

export const EstadoAcabamento: React.FC<{onComplete: () => void}> = ({onComplete}) => {
  return (
    <div style={{ padding: '32px 20px', textAlign: 'center' }}>
      <div style={{ background: 'rgba(255,149,0,0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <MapPin color="#ff9500" size={40} />
      </div>
      
      <h3 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Aguardando Acabamento</h3>
      <p style={{ color: '#666', fontSize: '15px', marginBottom: '40px' }}>Veículo pronto para etapa de acabamento</p>

      {/* Card de Localização */}
      <div style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '24px', borderRadius: '20px', textAlign: 'left', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0066ff', marginBottom: '8px' }}>
          <MapPin size={18} />
          <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Local no Pátio</span>
        </div>
        <div style={{ color: '#fff', fontSize: '20px', fontWeight: 900 }}>Vaga A-12</div>
      </div>

      {/* CAMPO DE COMENTÁRIO DO ACABAMENTO */}
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <MessageSquare size={14} /> Notas de Acabamento
        </label>
        <textarea 
          placeholder="Ex: Aplicado revitalizador de plásticos e fragrância premium..."
          style={{ 
            background: '#121212', 
            border: '1px solid #2a2a2a', 
            borderRadius: '16px', 
            color: '#fff', 
            width: '100%', 
            padding: '16px', 
            fontSize: '14px', 
            minHeight: '80px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <button 
        onClick={onComplete} 
        style={{ 
          background: '#0066ff', 
          color: '#fff', 
          padding: '20px', 
          borderRadius: '20px', 
          fontWeight: 900, 
          border: 'none', 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '10px',
          boxShadow: '0 10px 30px rgba(0,102,255,0.2)'
        }}
      >
        <Sparkles size={20} /> Iniciar Acabamento
      </button>
    </div>
  );
};