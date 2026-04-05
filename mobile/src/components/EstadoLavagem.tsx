import React from 'react';

// onComplete agora é utilizado no botão de conclusão
const EstadoLavagem: React.FC<{onComplete: () => void}> = ({ onComplete }) => {
  const checklist = ['Lavar carroceria externa', 'Limpar vidros', 'Lavar rodas e pneus', 'Enxaguar completamente', 'Secar superfície'];

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ color: '#666', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Tempo decorrido</div>
      <div style={{ color: '#fff', fontSize: '64px', fontWeight: 900, letterSpacing: '4px', marginBottom: '48px', fontFamily: 'monospace' }}>
        00:10
      </div>

      <div style={{ textAlign: 'left' }}>
        <p style={{ color: '#666', fontSize: '13px', fontWeight: 800, marginBottom: '16px' }}>Checklist de Lavagem</p>
        
        {checklist.map((item, idx) => (
          <div key={idx} style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '20px', borderRadius: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '6px', border: '2px solid #333' }}></div>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* CAMPO DE COMENTÁRIO DA LAVAGEM (Para alimentar o Laudo Técnico) */}
      <div style={{ textAlign: 'left', marginTop: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Laudo Técnico / Observações
        </label>
        <textarea 
          placeholder="Ex: Veículo apresentava manchas de seiva que foram removidas com produto específico..."
          style={{ 
            background: '#121212', 
            border: '1px solid #2a2a2a', 
            borderRadius: '16px', 
            color: '#fff', 
            width: '100%', 
            padding: '16px', 
            fontSize: '14px', 
            minHeight: '100px',
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
          marginTop: '32px',
          boxShadow: '0 10px 30px rgba(0,102,255,0.2)'
        }}
      >
        Concluir Lavagem e Passar para Acabamento
      </button>
    </div>
  );
};

export default EstadoLavagem;