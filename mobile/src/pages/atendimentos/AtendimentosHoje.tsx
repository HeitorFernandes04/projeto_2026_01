import { IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { Plus, LogOut, Car, ChevronRight, History, LayoutGrid, Calendar, Clock } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje } from '../../services/api';

// Importação da Logo Oficial
import logoLavaMe from '../../assets/LogoLavaMe.jpeg';

// Interfaces sincronizadas com o AtendimentoSerializer do Django
interface Veiculo {
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
}

interface Servico {
  id: number;
  nome: string;
  preco: string;
}

interface Atendimento {
  id: number;
  veiculo: Veiculo;
  servico: Servico;
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  data_hora: string;
  observacoes: string;
}

const AtendimentosHoje: React.FC = () => {
  const history = useHistory();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar dados, envolvida em useCallback para evitar recriações desnecessárias
  const carregarAtendimentos = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await getAtendimentosHoje();
      if (dados && Array.isArray(dados)) {
        // Filtra para exibir apenas o Pátio Ativo (Agendados e Em Andamento)
        // O Back-end já envia apenas o que é do funcionário logado ou fila livre
        const ativos = dados.filter(at => at.status === 'agendado' || at.status === 'em_andamento');
        setAtendimentos(ativos);
      }
    } catch (err) {
      console.error("Erro ao conectar com a API do Pátio:", err);
      // MOCK de segurança caso o servidor esteja offline
      setAtendimentos([
        { 
          id: 2458, 
          veiculo: { placa: 'ABC-1D23', modelo: 'Corolla', marca: 'Toyota', cor: 'Prata' }, 
          servico: { id: 1, nome: 'Lavagem Completa', preco: '80.00' }, 
          status: 'agendado',
          data_hora: new Date().toISOString(),
          observacoes: ''
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook do Ionic que dispara sempre que a página entra em foco (útil ao voltar de um atendimento)
  useIonViewWillEnter(() => {
    carregarAtendimentos();
  });

  return (
    <IonPage>
      <IonContent>
        <div style={{ background: '#000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          {/* Header Superior */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '2px', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#000' }}>
                <img 
                  src={logoLavaMe} 
                  alt="Lava-Me Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} 
                />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Lava-Me</h1>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Sistema de Gestão</p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                history.replace('/selecao');
              }}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '12px', borderRadius: '14px' }}
            >
              <LogOut color="#666" size={20} />
            </button>
          </div>

          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>Pátio</h2>
          <p style={{ color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '28px' }}>Ordens de Serviço ativas</p>

          {/* Indicadores Numéricos em tempo real */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#0a1220', border: '1px solid #0066ff50', padding: '24px', borderRadius: '24px' }}>
              <p style={{ color: '#0066ff', fontSize: '12px', fontWeight: 900, margin: '0 0 10px', letterSpacing: '0.5px' }}>AGENDADOS</p>
              <span style={{ color: '#fff', fontSize: '40px', fontWeight: 900 }}>
                {atendimentos.filter(a => a.status === 'agendado').length}
              </span>
            </div>
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '24px', borderRadius: '24px' }}>
              <p style={{ color: '#444', fontSize: '12px', fontWeight: 900, margin: '0 0 10px', letterSpacing: '0.5px' }}>EM EXECUÇÃO</p>
              <span style={{ color: '#fff', fontSize: '40px', fontWeight: 900 }}>
                {atendimentos.filter(a => a.status === 'em_andamento').length}
              </span>
            </div>
          </div>

          {/* Lista Dinâmica */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '40px' }}><IonSpinner color="primary" /></div>
            ) : (
              atendimentos.map((at) => (
                <div 
                  key={at.id}
                  onClick={() => history.push(`/atendimentos/${at.id}`)}
                  style={{ 
                    background: '#161616', border: '1px solid #2a2a2a', padding: '24px', 
                    borderRadius: '24px', cursor: 'pointer', position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#222', padding: '12px', borderRadius: '16px' }}>
                        <Car color="#fff" size={24} />
                      </div>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '0.5px' }}>{at.veiculo.placa}</h3>
                        <p style={{ color: '#666', fontSize: '14px', margin: '2px 0 0', fontWeight: 600 }}>{at.veiculo.modelo}</p>
                      </div>
                    </div>
                    <ChevronRight color="#333" size={20} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                      <Clock size={16} />
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {new Date(at.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <div style={{ 
                      background: at.status === 'em_andamento' ? 'rgba(0,255,102,0.1)' : 'rgba(0,102,255,0.15)',
                      padding: '6px 16px', borderRadius: '20px', 
                      color: at.status === 'em_andamento' ? '#00ff66' : '#0066ff',
                      fontSize: '12px', fontWeight: 800, textTransform: 'uppercase'
                    }}>
                      {at.status === 'em_andamento' ? 'Em Execução' : 'Agendado'}
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#222', margin: '20px 0 16px' }}></div>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>{at.servico.nome}</div>
                </div>
              ))
            )}
            
            {!loading && atendimentos.length === 0 && (
               <p style={{ color: '#444', textAlign: 'center', marginTop: '40px', fontWeight: 700 }}>Nenhum serviço ativo no pátio.</p>
            )}
          </div>

          {/* TabBar Inferior */}
          <div style={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, height: '100px', 
            background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)', 
            borderTop: '1px solid #1a1a1a', display: 'flex', 
            justifyContent: 'space-around', alignItems: 'center', 
            padding: '0 10px 20px', zIndex: 100 
          }}>
            
            <div onClick={() => carregarAtendimentos()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#0066ff' }}>
              <div style={{ background: '#0066ff', padding: '10px', borderRadius: '14px', color: '#fff', boxShadow: '0 4px 20px rgba(0,102,255,0.4)' }}>
                <LayoutGrid size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Pátio</span>
            </div>

            <div onClick={() => history.push('/atendimentos/novo')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444', border: '1px solid #2a2a2a' }}>
                <Plus size={24} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Iniciar</span>
            </div>

            <div onClick={() => history.push('/atendimentos/agendar')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444', border: '1px solid #2a2a2a' }}>
                <Calendar size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Agendar</span>
            </div>

            <div onClick={() => history.push('/atendimentos/historico')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444' }}>
                <History size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Histórico</span>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AtendimentosHoje;