import React, { useState, useEffect } from 'react';
import { AlertTriangle, Pause, CheckCircle, Camera, X } from 'lucide-react';
import { avancarEtapa, registrarOcorrencia } from '../services/api';

const EstadoLavagem: React.FC<{ 
  atendimentoId: number;
  onComplete: () => void;
}> = ({ atendimentoId, onComplete }) => {
  const [segundos, setSegundos] = useState(0);
  const [isPausado, setIsPausado] = useState(false);
  const [mostrarOcorrencia, setMostrarOcorrencia] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para ocorrência
  const [tipoDano, setTipoDano] = useState('');
  const [descricaoOcorrencia, setDescricaoOcorrencia] = useState('');
  const [fotosOcorrencia, setFotosOcorrencia] = useState<string[]>([]);
  
  // Estado para observações da lavagem
  const [observacoesLavagem, setObservacoesLavagem] = useState('');
  
  // Iniciar cronômetro automaticamente ao montar o componente
  useEffect(() => {
    if (!isPausado) {
      const interval = setInterval(() => {
        setSegundos(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPausado]);

  const tiposDano = [
    { value: 'pintura', label: 'Pintura' },
    { value: 'batida', label: 'Batida' },
    { value: 'mecanico', label: 'Mecânico' },
    { value: 'outro', label: 'Outro' }
  ];

  // Formatar tempo em HH:MM:SS
  const formatarTempo = (totalSegundos: number) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segs = totalSegundos % 60;
    
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Cronômetro
  useEffect(() => {
    if (!isPausado) {
      const interval = setInterval(() => {
        setSegundos(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isPausado]);

  const handlePausar = () => {
    setIsPausado(!isPausado);
  };

  const handleOcorrencia = () => {
    alert('Em breve');
  };

  const handleFinalizarLavagem = async () => {
    setLoading(true);
    try {
      // Envia observações da lavagem junto com o POST para proxima_etapa
      const data = await avancarEtapa(atendimentoId, { observacoes: observacoesLavagem });
      
      if (data) {
        console.log('Lavagem finalizada com sucesso');
        onComplete();
      } else {
        console.error('Erro ao avançar etapa:', data);
        alert(`Erro ao finalizar lavagem: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao finalizar lavagem:', error);
      alert('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarOcorrencia = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('tipo_dano', tipoDano);
      formData.append('descricao', descricaoOcorrencia);
      
      fotosOcorrencia.forEach((foto, index) => {
        formData.append(`fotos`, foto);
      });

      try {
        const result = await registrarOcorrencia(atendimentoId, formData);
        setMostrarOcorrencia(false);
        setTipoDano('');
        setDescricaoOcorrencia('');
        setFotosOcorrencia([]);
        alert('Ocorrência registrada com sucesso!');
        console.log('Status 200:', result);
        // Navegar de volta para o pátio ou dashboard
        window.location.href = '/atendimentos/hoje';
      } catch (error: any) {
        console.error('Erro 404/400:', error);
        alert(`Erro ao enviar ocorrência: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      alert('Erro ao enviar ocorrência');
    } finally {
      setLoading(false);
    }
  };

  const handleCapturarFoto = (index: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const novasFotos = [...fotosOcorrencia];
          novasFotos[index] = e.target?.result as string;
          setFotosOcorrencia(novasFotos);
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  return (
    <div style={{ 
      background: '#000000', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '20px'
    }}>
      
      {/* Cronômetro Centralizado com Brilho Azul */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#0066ff',
          textShadow: '0 0 20px rgba(0,102,255,0.8)',
          letterSpacing: '2px',
          marginBottom: '16px'
        }}>
          {formatarTempo(segundos)}
        </div>
        
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Tempo Decorrido
        </div>
        
        {isPausado && (
          <div style={{
            fontSize: '12px',
            color: '#ff9500',
            fontWeight: 800,
            marginTop: '8px',
            textTransform: 'uppercase'
          }}>
            PAUSADO
          </div>
        )}
      </div>

      {/* Campo de Observações da Lavagem */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          color: '#fff',
          fontSize: '14px',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          display: 'block',
          marginBottom: '8px'
        }}>
          OBSERVAÇÕES DA LAVAGEM
        </label>
        <textarea
          value={observacoesLavagem}
          onChange={(e) => setObservacoesLavagem(e.target.value)}
          placeholder="Descreva observações importantes sobre a lavagem..."
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
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

      {/* 3 Botões Principais */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        marginBottom: '100px'
      }}>
        
        <button
          onClick={handleOcorrencia}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '16px',
            padding: '20px',
            height: '60px',
            fontSize: '16px',
            fontWeight: 800,
            color: '#fff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <AlertTriangle size={20} />
          OCORRÊNCIA
        </button>

        <button
          onClick={handlePausar}
          style={{
            background: isPausado ? '#0066ff' : '#ff9500',
            border: 'none',
            borderRadius: '16px',
            padding: '20px',
            height: '60px',
            fontSize: '16px',
            fontWeight: 800,
            color: '#000',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <Pause size={20} />
          {isPausado ? 'RETOMAR ATENDIMENTO' : 'PAUSAR ATENDIMENTO'}
        </button>

        <button
          onClick={handleFinalizarLavagem}
          disabled={loading}
          style={{
            background: loading ? '#333' : '#0066ff',
            border: 'none',
            borderRadius: '16px',
            padding: '20px',
            height: '60px',
            fontSize: '16px',
            fontWeight: 800,
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <CheckCircle size={20} />
          {loading ? 'FINALIZANDO...' : 'FINALIZAR LAVAGEM'}
        </button>
      </div>

      {/* Modal de Ocorrência Industrial */}
      {mostrarOcorrencia && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: '#121212',
            borderRadius: '20px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: 900,
                margin: 0
              }}>
                Registrar Ocorrência
              </h3>
              <button
                onClick={() => setMostrarOcorrencia(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Seletor de Tipo de Dano */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px'
              }}>
                Tipo de Dano
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                {tiposDano.map((tipo) => (
                  <button
                    key={tipo.value}
                    onClick={() => setTipoDano(tipo.value)}
                    style={{
                      background: tipoDano === tipo.value ? '#0066ff' : '#1a1a1a',
                      border: tipoDano === tipo.value ? '2px solid #0066ff' : '1px solid #333',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Campo de Descrição */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px'
              }}>
                Descrição *
              </label>
              <textarea
                value={descricaoOcorrencia}
                onChange={(e) => setDescricaoOcorrencia(e.target.value)}
                placeholder="Descreva o que aconteceu..."
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '12px',
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
            
            {/* Grid de Fotos */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                color: '#fff',
                fontSize: '12px',
                fontWeight: 900,
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px'
              }}>
                Fotos do Dano (máx. 5)
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {[0, 1, 2, 3, 4].map((index) => (
                  <button
                    key={index}
                    onClick={() => handleCapturarFoto(index)}
                    style={{
                      background: fotosOcorrencia[index] ? '#1a1a1a' : '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '12px',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {fotosOcorrencia[index] ? (
                      <img 
                        src={fotosOcorrencia[index]} 
                        alt={`Foto ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Camera size={20} color="#666" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setMostrarOcorrencia(false)}
                style={{
                  flex: 1,
                  background: '#333',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleEnviarOcorrencia}
                disabled={!tipoDano || !descricaoOcorrencia || loading}
                style={{
                  flex: 1,
                  background: (!tipoDano || !descricaoOcorrencia || loading) ? '#333' : '#0066ff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#fff',
                  cursor: (!tipoDano || !descricaoOcorrencia || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstadoLavagem;
