import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { LogOut, Check, LayoutGrid, Calendar, History, Plus } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getServicos, getHorariosLivres, criarAtendimento } from '../../services/api';

// Importação da Logo Oficial
import logoLavaMe from '../../assets/LogoLavaMe.jpeg';

// Interface para garantir tipagem correta
interface Servico {
  id: number;
  nome: string;
  duracao_estimada_min: number;
  preco: string;
}

const NovoAtendimento: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  
  const isAgendar = location.pathname.includes('agendar');

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [servicoSelecionado, setServicoSelecionado] = useState<number | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horariosLivres, setHorariosLivres] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const horariosFallback = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

  const servicosModelo = useMemo<Servico[]>(() => [
    { id: 1, nome: 'Lavagem Simples', duracao_estimada_min: 30, preco: '50.00' },
    { id: 2, nome: 'Lavagem Completa + Cera', duracao_estimada_min: 60, preco: '90.00' },
    { id: 3, nome: 'Detalhe Interno (Higienização)', duracao_estimada_min: 120, preco: '250.00' },
    { id: 4, nome: 'Polimento Técnico', duracao_estimada_min: 180, preco: '450.00' }
  ], []);

  useEffect(() => {
    getServicos()
      .then((dados) => {
        if (dados && dados.length > 0) setServicos(dados);
        else setServicos(servicosModelo);
      })
      .catch(() => setServicos(servicosModelo));
  }, [servicosModelo]);

  useEffect(() => {
    if (isAgendar && servicoSelecionado) {
      setLoadingHorarios(true);
      setHorarioSelecionado(null);
      getHorariosLivres(dataSelecionada, servicoSelecionado)
        .then(res => {
          if (res.horarios && res.horarios.length > 0) setHorariosLivres(res.horarios);
          else setHorariosLivres(horariosFallback);
        })
        .catch(() => setHorariosLivres(horariosFallback))
        .finally(() => setLoadingHorarios(false));
    }
  }, [dataSelecionada, servicoSelecionado, isAgendar]);

  const handleConfirmar = async () => {
    if (!placa || !modelo || !servicoSelecionado || (isAgendar && !horarioSelecionado)) {
      alert("Por favor, preencha todos os campos e escolha o horário.");
      return;
    }

    const dadosAtendimento = {
      nome_dono: "Cliente Balcão", 
      celular_dono: "",
      placa: placa.toUpperCase(),
      modelo: modelo,
      marca: "Não informada",
      cor: "",
      servico_id: servicoSelecionado,
      data_hora: isAgendar ? `${dataSelecionada}T${horarioSelecionado}:00` : new Date().toISOString(),
      iniciar_agora: !isAgendar,
      observacoes: ""
    };

    try {
      await criarAtendimento(dadosAtendimento);
      history.push('/atendimentos/hoje');
    } catch (e: unknown) {
      const erro = e as Error;
      alert("Erro ao salvar: " + erro.message);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div style={{ background: '#000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          {/* Header Superior Atualizado com a Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Contêiner da Logo Substituindo o símbolo de '+' */}
              <div style={{ padding: '2px', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#000' }}>
                <img 
                  src={logoLavaMe} 
                  alt="Lava-Me Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} 
                />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>Lava-Me</h1>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Sistema de Gestão</p>
              </div>
            </div>
            <button onClick={() => history.push('/selecao')} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '12px', borderRadius: '14px' }}>
              <LogOut color="#666" size={20} />
            </button>
          </div>

          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {isAgendar ? 'Agendar Serviço' : 'Entrada Rápida'}
          </h2>
          <p style={{ color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '32px' }}>
            {isAgendar ? 'Selecione data e horário' : 'Iniciar atendimento imediato'}
          </p>

          {/* ... restante do formulário (placa, modelo, serviços, horários) ... */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <input 
              value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())}
              style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '18px', fontWeight: 700, outline: 'none' }}
              placeholder="PLACA"
            />
            <input 
              value={modelo} onChange={e => setModelo(e.target.value)}
              style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '16px', outline: 'none' }}
              placeholder="MODELO"
            />
          </div>

          <label style={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Serviço</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {servicos.map(s => (
              <div 
                key={s.id} 
                onClick={() => setServicoSelecionado(s.id)}
                style={{ 
                  background: '#161616', border: servicoSelecionado === s.id ? '2px solid #0066ff' : '1px solid #2a2a2a', 
                  padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' 
                }}
              >
                <div style={{ color: '#fff', fontWeight: 700 }}>{s.nome}</div>
                {servicoSelecionado === s.id && <Check color="#0066ff" size={20} />}
              </div>
            ))}
          </div>

          {isAgendar && servicoSelecionado && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Data e Horários Disponíveis</label>
              <input 
                type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)}
                style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#fff', padding: '14px', borderRadius: '12px', width: '100%', marginBottom: '16px', colorScheme: 'dark' }}
              />

              {loadingHorarios ? <div style={{ textAlign: 'center' }}><IonSpinner color="primary" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {horariosLivres.map(h => (
                    <div 
                      key={h} onClick={() => setHorarioSelecionado(h)}
                      style={{ 
                        padding: '12px 5px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 800,
                        background: horarioSelecionado === h ? '#0066ff' : '#161616',
                        color: horarioSelecionado === h ? '#fff' : '#444',
                        border: '1px solid #2a2a2a', cursor: 'pointer'
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleConfirmar}
            style={{ width: '100%', background: '#0066ff', color: '#fff', padding: '22px', borderRadius: '22px', fontSize: '18px', fontWeight: 900, border: 'none', boxShadow: '0 4px 15px rgba(0,102,255,0.3)' }}
          >
            {isAgendar ? 'Confirmar Agendamento' : 'Iniciar Atendimento'}
          </button>

          {/* TabBar Inferior Padronizada (Mantida conforme o padrão visual f3192f.png) */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '100px', background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 10px 20px', zIndex: 100 }}>
            <div onClick={() => history.push('/atendimentos/hoje')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, color: '#444', cursor: 'pointer' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444' }}><LayoutGrid size={24} /></div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Pátio</span>
            </div>
            
            <div onClick={() => history.push('/atendimentos/novo')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, color: !isAgendar ? '#0066ff' : '#444', cursor: 'pointer' }}>
              <div style={{ background: !isAgendar ? '#0066ff' : '#1a1a1a', padding: '10px', borderRadius: '14px', color: !isAgendar ? '#fff' : '#444', border: !isAgendar ? 'none' : '1px solid #2a2a2a', boxShadow: !isAgendar ? '0 4px 20px rgba(0,102,255,0.4)' : 'none' }}>
                <Plus size={24} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Iniciar</span>
            </div>

            <div onClick={() => history.push('/atendimentos/agendar')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, color: isAgendar ? '#0066ff' : '#444', cursor: 'pointer' }}>
              <div style={{ background: isAgendar ? '#0066ff' : '#1a1a1a', padding: '10px', borderRadius: '14px', color: isAgendar ? '#fff' : '#444', border: isAgendar ? 'none' : '1px solid #2a2a2a', boxShadow: isAgendar ? '0 4px 20px rgba(0,102,255,0.4)' : 'none' }}>
                <Calendar size={22} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Agendar</span>
            </div>

            <div onClick={() => history.push('/atendimentos/historico')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, color: '#444', cursor: 'pointer' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444' }}><History size={24} /></div>
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>Histórico</span>
            </div>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default NovoAtendimento;