import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Plus, LogOut, Car, ChevronRight, History, LayoutGrid, Calendar, Clock } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje } from '../../services/api';

// Importa├º├úo da Logo Oficial
import logoLavaMe from '../../assets/LogoLavaMe.jpeg';

// Interfaces para tipagem consistente
interface Veiculo {
  placa: string;
  modelo: string;
}

interface Servico {
  nome: string;
}

interface Atendimento {
  id: number;
  veiculo: Veiculo;
  servico: Servico;
  status: 'agendado' | 'em_andamento' | 'finalizado' | 'cancelado';
  data_hora: string;
}

const AtendimentosHoje: React.FC = () => {
  const history = useHistory();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca dados reais do backend
    getAtendimentosHoje()
      .then((dados) => {
        if (dados && Array.isArray(dados)) {
          setAtendimentos(dados);
        } else {
          throw new Error("Dados inv├ílidos");
        }
      })
      .catch((err) => {
        console.error("Erro API:", err);
        // DADOS DE BACKUP para teste visual
        setAtendimentos([
          { 
            id: 2458, 
            veiculo: { placa: 'ABC-1D23', modelo: 'Toyota Corolla' }, 
            servico: { nome: 'Lavagem Completa + Cera' }, 
            status: 'agendado',
            data_hora: new Date().toISOString()
          },
          { 
            id: 2459, 
            veiculo: { placa: 'JKL-3M45', modelo: 'BMW 320i' }, 
            servico: { nome: 'Detalhamento Completo' }, 
            status: 'em_andamento',
            data_hora: new Date().toISOString()
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <IonPage>
      <IonContent>
        <div style={{ background: '#000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          {/* Header Superior com a Logo Lava-Me */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Cont├¬iner da Logo Substituindo o ├¡cone anterior */}
              <div style={{ padding: '2px', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#000' }}>
                <img 
                  src={logoLavaMe} 
                  alt="Lava-Me Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} 
                />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Lava-Me</h1>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Sistema de Gest├úo</p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('access');
                history.replace('/selecao');
              }}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '12px', borderRadius: '14px' }}
            >
              <LogOut color="#666" size={20} />
            </button>
          </div>

          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>P├ítio</h2>
          <p style={{ color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '28px' }}>Agendamentos de hoje</p>

          {/* Indicadores Num├®ricos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#0a1220', border: '1px solid #0066ff50', padding: '24px', borderRadius: '24px' }}>
              <p style={{ color: '#0066ff', fontSize: '12px', fontWeight: 900, margin: '0 0 10px', letterSpacing: '0.5px' }}>AGENDADOS</p>
              <span style={{ color: '#fff', fontSize: '40px', fontWeight: 900 }}>
                {atendimentos.filter(a => a.status === 'agendado').length}
              </span>
            </div>
            <div style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '24px', borderRadius: '24px' }}>
              <p style={{ color: '#444', fontSize: '12px', fontWeight: 900, margin: '0 0 10px', letterSpacing: '0.5px' }}>EM EXECU├ç├âO</p>
              <span style={{ color: '#fff', fontSize: '40px', fontWeight: 900 }}>
                {atendimentos.filter(a => a.status === 'em_andamento').length}
              </span>
            </div>
          </div>

          {/* Lista de Cards Estilizados */}
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
                      fontSize: '12px', fontWeight: 800, textTransform: 'capitalize'
                    }}>
                      {at.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#222', margin: '20px 0 16px' }}></div>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>{at.servico.nome}</div>
                </div>
              ))
            )}
          </div>

          {/* TabBar Inferior Padronizada (P├üTIO ATIVO) */}
          <div style={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, height: '100px', 
            background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)', 
            borderTop: '1px solid #1a1a1a', display: 'flex', 
            justifyContent: 'space-around', alignItems: 'center', 
            padding: '0 10px 20px', zIndex: 100 
          }}>
            
            {/* 1. P├üTIO (Ativo) */}
            <div onClick={() => history.push('/atendimentos/hoje')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#0066ff' }}>
              <div style={{ background: '#0066ff', padding: '10px', borderRadius: '14px', color: '#fff', boxShadow: '0 4px 20px rgba(0,102,255,0.4)' }}>
                <LayoutGrid size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>P├ítio</span>
            </div>

            {/* 2. INICIAR */}
            <div onClick={() => history.push('/atendimentos/novo')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444', border: '1px solid #2a2a2a' }}>
                <Plus size={24} strokeWidth={3} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Iniciar</span>
            </div>

            {/* 3. AGENDAR */}
            <div onClick={() => history.push('/atendimentos/agendar')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444', border: '1px solid #2a2a2a' }}>
                <Calendar size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Agendar</span>
            </div>

            {/* 4. HIST├ôRICO */}
            <div onClick={() => history.push('/atendimentos/historico')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444' }}>
                <History size={24} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>Hist├│rico</span>
            </div>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default AtendimentosHoje;
