import { IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { 
  Clock, ChevronRight, Car
} from 'lucide-react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAtendimentosHoje } from '../../services/api';
import TabBar from '../../components/TabBar';

// Importação da Logo Oficial
import logoLavaMe from '../../assets/logo.jpeg';

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

  const nomeFuncionario = localStorage.getItem('nome_usuario') || 'Funcionário';

  useIonViewWillEnter(() => {
    setLoading(true);
    getAtendimentosHoje()
      .then((dados) => {
        if (dados && Array.isArray(dados)) {
          // FILTRO CRÍTICO: Remove veículos com status 'finalizado' da tela do pátio
          const ativos = dados.filter((a: Atendimento) => a.status !== 'finalizado');
          setAtendimentos(ativos);
        } else {
          throw new Error("Dados inválidos");
        }
      })
      .catch((err) => {
        console.error("Erro API:", err);
        // Dados de backup apenas para ambiente de desenvolvimento/erro
        setAtendimentos([
          { 
            id: 2458, 
            veiculo: { placa: 'ABC-1D23', modelo: 'Toyota Corolla' }, 
            servico: { nome: 'Lavagem Completa + Cera' }, 
            status: 'agendado',
            data_hora: new Date().toISOString()
          }
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <IonPage style={{ background: '#000000' }}>
      <IonContent style={{ '--background': '#000000' }}>
        <div style={{ background: '#000000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '2px', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#000000' }}>
                <img 
                  src={logoLavaMe} 
                  alt="Lava-Me Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
                />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>Lava-Me</h1>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, fontWeight: 700 }}>Olá, {nomeFuncionario}</p>
              </div>
            </div>
          </div>

          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 4px' }}>Pátio</h2>
          <p style={{ color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '28px' }}>Agendamentos ativos</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ background: '#0a1220', border: '1px solid #0066ff50', padding: '24px', borderRadius: '24px' }}>
              <p style={{ color: '#0066ff', fontSize: '12px', fontWeight: 900, margin: '0 0 10px' }}>AGENDADOS</p>
              <span style={{ color: '#fff', fontSize: '40px', fontWeight: 900 }}>
                {atendimentos.filter(a => a.status === 'agendado').length}
              </span>
            </div>
            <div style={{ background: '#121212', border: '1px solid #2a2a2a', padding: '24px', borderRadius: '24px' }}>
              <p style={{ color: '#444', fontSize: '12px', fontWeight: 900, margin: '0 0 10px' }}>EM EXECUÇÃO</p>
              <span style={{ color: '#fff', fontSize: '40px', fontWeight: 900 }}>
                {atendimentos.filter(a => a.status === 'em_andamento').length}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <IonSpinner color="primary" />
              </div>
            ) : (
              atendimentos.map((at) => (
                <div 
                  key={at.id}
                  onClick={() => history.push(`/atendimentos/${at.id}/esteira`)}
                  style={{ 
                    background: '#121212', border: '1px solid #2a2a2a', padding: '24px', 
                    borderRadius: '24px', cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ background: '#222', padding: '10px', borderRadius: '14px' }}>
                        <Car color="#fff" size={20} />
                      </div>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0 }}>
                          {at.veiculo.placa}
                        </h3>
                        <p style={{ color: '#666', fontSize: '14px', margin: '2px 0 0' }}>
                          {at.veiculo.modelo}
                        </p>
                      </div>
                    </div>
                    <ChevronRight color="#333" size={20} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                      <Clock size={14} />
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {at.data_hora ? new Date(at.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
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
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>
                    {at.servico.nome}
                  </div>
                </div>
              ))
            )}
          </div>

          <TabBar activeTab="pátio" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AtendimentosHoje;