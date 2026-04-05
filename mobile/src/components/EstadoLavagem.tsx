import React, { useState, useEffect } from 'react';
import { atualizarDadosAtendimento, getAtendimento } from '../services/api';
import { IonSpinner } from '@ionic/react';

interface EstadoLavagemProps {
  atendimentoId: number;
  onComplete: () => void;
}

const EstadoLavagem: React.FC<EstadoLavagemProps> = ({ atendimentoId, onComplete }) => {
  const [laudo, setLaudo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState('00:00');
  const [horarioInicioLavagem, setHorarioInicioLavagem] = useState<string | null>(null);
  
  // Estado para controlar os itens marcados vindo do banco
  const [itensConcluidos, setItensConcluidos] = useState<string[]>([]);

  const checklistOpcoes = [
    'Lavar carroceria externa', 
    'Limpar vidros', 
    'Lavar rodas e pneus', 
    'Enxaguar completamente', 
    'Secar superfície'
  ];

  // 1. Busca dados iniciais (Persistência: Horário, Checklist e Laudo)
  useEffect(() => {
    getAtendimento(atendimentoId).then(dados => {
      // Carrega o horário para o cronômetro não zerar
      if (dados.horario_lavagem) {
        setHorarioInicioLavagem(dados.horario_lavagem);
      }
      // Carrega o que já foi marcado anteriormente
      if (dados.checklist_lavagem) {
        setItensConcluidos(dados.checklist_lavagem);
      }
      // Carrega o rascunho do laudo se existir
      if (dados.laudo_lavagem) {
        setLaudo(dados.laudo_lavagem);
      }
    });
  }, [atendimentoId]);

  // 2. Lógica do Cronômetro Persistente (Baseado no horário do Banco)
  useEffect(() => {
    if (!horarioInicioLavagem) return;

    const intervalo = setInterval(() => {
      const inicio = new Date(horarioInicioLavagem).getTime();
      const agora = new Date().getTime();
      const diffMs = agora - inicio;

      if (diffMs < 0) return;

      const totalSegundos = Math.floor(diffMs / 1000);
      const minutos = Math.floor(totalSegundos / 60);
      const segundos = totalSegundos % 60;

      setTempoDecorrido(
        `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(intervalo);
  }, [horarioInicioLavagem]);

  // 3. Função com Auto-Save (Sincroniza com o Banco a cada clique)
  const toggleItem = async (item: string) => {
    const novaLista = itensConcluidos.includes(item)
      ? itensConcluidos.filter(i => i !== item)
      : [...itensConcluidos, item];
    
    setItensConcluidos(novaLista);

    try {
      // Salva no banco imediatamente para o progresso ser real
      await atualizarDadosAtendimento(atendimentoId, { 
        checklist_lavagem: novaLista 
      });
    } catch (e) {
      console.error("Erro ao salvar progresso do checklist:", e);
    }
  };

  const handleConcluir = async () => {
    // Validação obrigatória: Checklist 100% preenchido
    if (itensConcluidos.length < checklistOpcoes.length) {
      alert("Por favor, finalize todos os itens do checklist antes de prosseguir.");
      return;
    }

    setEnviando(true);
    try {
      await atualizarDadosAtendimento(atendimentoId, {
        laudo_lavagem: laudo,
        checklist_lavagem: itensConcluidos
      });
      onComplete();
    } catch (error: unknown) {
      const msgErro = error instanceof Error ? error.message : "Erro ao salvar lavagem.";
      alert(msgErro);
    } finally {
      setEnviando(false);
    }
  };

  // Habilita o botão apenas quando o checklist estiver completo
  const tudoPronto = itensConcluidos.length === checklistOpcoes.length;

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ color: '#666', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Tempo em execução</div>
      
      <div style={{ color: '#fff', fontSize: '64px', fontWeight: 900, letterSpacing: '4px', marginBottom: '48px', fontFamily: 'monospace' }}>
        {tempoDecorrido}
      </div>

      <div style={{ textAlign: 'left' }}>
        <p style={{ color: '#666', fontSize: '13px', fontWeight: 800, marginBottom: '16px' }}>Checklist de Lavagem (OS #{atendimentoId})</p>
        
        {checklistOpcoes.map((item, idx) => {
          const isMarcado = itensConcluidos.includes(item);
          return (
            <div 
              key={idx} 
              onClick={() => toggleItem(item)}
              style={{ 
                background: '#161616', 
                border: isMarcado ? '1px solid #00ff66' : '1px solid #2a2a2a', 
                padding: '20px', 
                borderRadius: '16px', 
                marginBottom: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                cursor: 'pointer',
                transition: '0.3s'
              }}
            >
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '6px', 
                border: '2px solid',
                borderColor: isMarcado ? '#00ff66' : '#333',
                background: isMarcado ? '#00ff66' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isMarcado && <span style={{ color: '#000', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ 
                color: isMarcado ? '#fff' : '#666', 
                fontSize: '15px', 
                fontWeight: 700,
                textDecoration: isMarcado ? 'line-through' : 'none' 
              }}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'left', marginTop: '32px' }}>
        <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
          Laudo Técnico / Observações da Lavagem
        </label>
        <textarea 
          value={laudo}
          onChange={(e) => setLaudo(e.target.value)}
          placeholder="Ex: Veículo apresentava manchas de seiva..."
          style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: '16px', color: '#fff', width: '100%', padding: '16px', fontSize: '14px', minHeight: '100px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
        />
      </div>

      <button 
        onClick={handleConcluir} 
        disabled={enviando} 
        style={{ 
          background: tudoPronto ? '#0066ff' : '#222', 
          color: tudoPronto ? '#fff' : '#444', 
          padding: '20px', 
          borderRadius: '20px', 
          fontWeight: 900, 
          border: 'none', 
          width: '100%', 
          marginTop: '32px', 
          boxShadow: tudoPronto ? '0 10px 30px rgba(0,102,255,0.2)' : 'none',
          transition: '0.3s'
        }}
      >
        {enviando ? <IonSpinner name="crescent" /> : "Concluir Lavagem e Passar para Acabamento"}
      </button>
    </div>
  );
};

export default EstadoLavagem;