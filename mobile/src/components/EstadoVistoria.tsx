import React, { useState } from 'react';
import { Check, AlertCircle, Camera } from 'lucide-react';

const EstadoVistoria: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [partesSelecionadas, setPartesSelecionadas] = useState<string[]>([]);
  const [fotosTiradas, setFotosTiradas] = useState<string[]>([]);

  const partes = [
    'Capô', 'Porta LE', 'Porta LD', 'Pára-choque DI', 
    'Pára-choque TR', 'Teto', 'Porta-malas', 'Vidro Frontal', 'Vidro Traseiro'
  ];

  const toggleParte = (parte: string) => {
    if (partesSelecionadas.includes(parte)) {
      setPartesSelecionadas(partesSelecionadas.filter(p => p !== parte));
      setFotosTiradas(fotosTiradas.filter(f => f !== parte));
    } else {
      setPartesSelecionadas([...partesSelecionadas, parte]);
    }
  };

  const tirarFoto = (e: React.MouseEvent, parte: string) => {
    e.stopPropagation();
    setFotosTiradas([...fotosTiradas, parte]);
  };

  const podeConcluir = partesSelecionadas.length === 0 || 
                      partesSelecionadas.every(p => fotosTiradas.includes(p));

  return (
    <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Vistoria do Veículo</h3>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Selecione as partes com danos e fotografe cada uma delas</p>

      {/* Alerta de Foto Obrigatória */}
      {partesSelecionadas.length > 0 && !podeConcluir && (
        <div style={{ 
          background: 'rgba(255,149,0,0.1)', border: '1px solid #ff950040', 
          padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px', marginBottom: '24px' 
        }}>
          <AlertCircle color="#ff9500" size={20} />
          <div>
            <div style={{ color: '#ff9500', fontWeight: 900, fontSize: '14px' }}>Foto obrigatória</div>
            <div style={{ color: '#ff950080', fontSize: '12px' }}>Capture fotos de todas as partes selecionadas</div>
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
              onClick={() => toggleParte(p)}
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
                  onClick={(e) => tirarFoto(e, p)}
                  style={{ 
                    background: comFoto ? '#00ff66' : '#ff9500', color: '#000', 
                    border: 'none', borderRadius: '6px', padding: '4px 12px', 
                    fontSize: '11px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' 
                  }}
                >
                  <Camera size={12} /> {comFoto ? 'FOTO OK' : 'FOTO'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Opção "Nenhum dano" */}
      {partesSelecionadas.length === 0 && (
        <div style={{ 
          background: 'rgba(0,255,102,0.05)', border: '1px solid rgba(0,255,102,0.2)', 
          padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', 
          gap: '10px', color: '#00ff66', fontSize: '14px', fontWeight: 700, marginBottom: '24px' 
        }}>
          <Check size={18} /> Nenhum dano identificado
        </div>
      )}

      {/* CAMPO DE COMENTÁRIO DA VISTORIA (Laudo da Vistoria) */}
      <div style={{ marginBottom: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Observações da Vistoria
        </label>
        <textarea 
          placeholder="Ex: Risco profundo encontrado no capô, cliente ciente..."
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

      {/* Botão Concluir */}
      <button 
        disabled={!podeConcluir}
        onClick={onComplete} 
        style={{ 
          background: podeConcluir ? '#0066ff' : '#222', 
          color: podeConcluir ? '#fff' : '#444', 
          padding: '20px', borderRadius: '20px', fontWeight: 900, 
          border: 'none', fontSize: '16px', marginTop: 'auto',
          transition: '0.3s'
        }}
      >
        Concluir Vistoria
      </button>
    </div>
  );
};

export default EstadoVistoria;