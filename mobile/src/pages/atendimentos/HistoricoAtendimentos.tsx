import { IonContent, IonPage } from '@ionic/react';
import { 
  LayoutGrid, Plus, History, LogOut,
  Calendar, Clock, CheckCircle2, ChevronRight, ChevronDown 
} from 'lucide-react';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

// Importação da Logo Oficial
import logoLavaMe from '../../assets/LogoLavaMe.jpeg';

const HistoricoAtendimentos: React.FC = () => {
  const history = useHistory();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Dados fictícios baseados no protótipo
  const historico = [
    { 
      id: 1, placa: 'JKL-3M45', modelo: 'BMW 320i', data: '04/04/2026', 
      hora: '14:30', servico: 'Detalhamento Completo', tempo: '118 min',
      laudo: 'Veículo apresentava riscos leves no capô. Aplicado polimento técnico.'
    },
    { 
      id: 2, placa: 'MNO-6P78', modelo: 'Audi A4', data: '04/04/2026', 
      hora: '11:15', servico: 'Lavagem Completa + Cera', tempo: '62 min',
      laudo: 'Sem observações relevantes.'
    },
    { 
      id: 3, placa: 'PQR-9S01', modelo: 'Mercedes C180', data: '03/04/2026', 
      hora: '16:45', servico: 'Lavagem Express', tempo: '28 min',
      laudo: 'Cliente solicitou atenção especial nas rodas.'
    }
  ];

  return (
    <IonPage>
      <IonContent>
        <div style={{ background: '#000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          {/* Header Superior com a Logo Lava-Me */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Contêiner da Logo Substituindo o ícone anterior */}
              <div style={{ padding: '2px', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#000' }}>
                <img 
                  src={logoLavaMe} 
                  alt="Lava-Me Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} 
                />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>Lava-Me</h1>
                <p style={{ color: '#444', fontSize: '10px', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Sistema de Gestão</p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('access');
                history.replace('/selecao');
              }}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '12px', borderRadius: '14px', display: 'flex', alignItems: 'center' }}
            >
              <LogOut color="#444" size={20} />
            </button>
          </div>

          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>Histórico</h2>
          <p style={{ color: '#666', fontSize: '15px', fontWeight: 600, marginBottom: '32px' }}>Serviços finalizados</p>

          {/* Filtros de Data */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            <div>
              <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Data Inicial</label>
              <div style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <Calendar size={18} color="#444" />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>02/04/2026</span>
                <Calendar size={14} color="#444" />
              </div>
            </div>
            <div>
              <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Data Final</label>
              <div style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
                <Calendar size={18} color="#444" />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>05/04/2026</span>
                <Calendar size={14} color="#444" />
              </div>
            </div>
          </div>

          {/* Lista de Cards do Histórico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {historico.map((item) => (
              <div 
                key={item.id}
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                style={{ 
                  background: '#161616', border: '1px solid #2a2a2a', 
                  borderRadius: '24px', padding: '24px', position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(0,255,102,0.05)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(0,255,102,0.1)' }}>
                      <CheckCircle2 color="#00ff66" size={22} />
                    </div>
                    <div>
                      <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0 }}>{item.placa}</h3>
                      <p style={{ color: '#666', fontSize: '14px', fontWeight: 600, margin: 0 }}>{item.modelo}</p>
                    </div>
                  </div>
                  {expandedId === item.id ? <ChevronDown color="#444" size={20} /> : <ChevronRight color="#444" size={20} />}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#444' }}>
                    <Calendar size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.data}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#444' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.hora}</span>
                  </div>
                </div>

                <div style={{ height: '1px', background: '#222', marginBottom: '16px' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>{item.servico}</span>
                  <span style={{ color: '#444', fontSize: '12px', fontWeight: 800 }}>{item.tempo}</span>
                </div>

                {expandedId === item.id && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #2a2a2a' }}>
                    <p style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>Laudo Técnico / Observações</p>
                    <div style={{ background: '#1c1c1c', padding: '16px', borderRadius: '16px', color: '#ff9500', fontSize: '14px', fontWeight: 600, lineHeight: '1.5' }}>
                      {item.laudo}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* TabBar Inferior Padronizada (HISTÓRICO ATIVO) */}
          <div style={{ 
            position: 'fixed', bottom: 0, left: 0, right: 0, height: '100px', 
            background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(20px)', 
            borderTop: '1px solid #1a1a1a', display: 'flex', 
            justifyContent: 'space-around', alignItems: 'center', 
            padding: '0 10px 20px', zIndex: 100 
          }}>
            
            <div onClick={() => history.push('/atendimentos/hoje')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#444' }}>
              <div style={{ background: '#1a1a1a', padding: '10px', borderRadius: '14px', color: '#444' }}>
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

            <div onClick={() => history.push('/atendimentos/historico')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', color: '#0066ff' }}>
              <div style={{ background: '#0066ff', padding: '10px', borderRadius: '14px', color: '#fff', boxShadow: '0 4px 20px rgba(0,102,255,0.4)' }}>
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

export default HistoricoAtendimentos;