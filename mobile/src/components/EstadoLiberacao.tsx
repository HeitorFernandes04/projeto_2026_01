import React from 'react';
import { CheckCircle } from 'lucide-react';

export const EstadoLiberacao: React.FC<{onComplete: () => void}> = ({onComplete}) => {
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      
      {/* Ícone de Conclusão Sucesso */}
      <div style={{ background: 'rgba(0,255,102,0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
        <CheckCircle color="#00ff66" size={60} />
      </div>

      <h3 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>Serviço Concluído!</h3>
      <p style={{ color: '#666', fontSize: '16px', marginBottom: '40px' }}>Veículo pronto para liberação</p>

      {/* NOVO: Campo de Comentário Final / Notas de Entrega */}
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Notas finais de entrega
        </label>
        <textarea 
          placeholder="Ex: Cliente avisado sobre a necessidade de troca de palhetas em breve..."
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

      {/* Botão de Fechamento Total */}
      <button 
        onClick={onComplete} 
        style={{ 
          background: '#0066ff', 
          color: '#fff', 
          padding: '22px', 
          borderRadius: '22px', 
          fontWeight: 900, 
          border: 'none', 
          width: '100%', 
          marginTop: 'auto', 
          fontSize: '18px',
          boxShadow: '0 10px 30px rgba(0,102,255,0.2)'
        }}
      >
        Concluir Atendimento
      </button>
    </div>
  );
};