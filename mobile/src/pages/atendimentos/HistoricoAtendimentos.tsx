import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { 
  LayoutGrid, Plus, History, LogOut,
  Calendar, Clock, CheckCircle2, ChevronRight, ChevronDown 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getHistoricoAtendimentos } from '../../services/api';

// Importação da Logo Oficial
import logoLavaMe from '../../assets/LogoLavaMe.jpeg';

interface Atendimento {
  id: number;
  veiculo: {
    placa: string;
    modelo: string;
  };
  data_hora: string;
  servico: {
    nome: string;
  };
  observacoes?: string;
}

const HistoricoAtendimentos: React.FC = () => {
  const history = useHistory();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<Atendimento[]>([]);

  // Filtros de Data: Inicia com o dia de hoje
  const [dataDe, setDataDe] = useState(new Date().toISOString().split('T')[0]);
  const [dataAte, setDataAte] = useState(new Date().toISOString().split('T')[0]);

  // Função para buscar apenas os finalizados do Backend
  useEffect(() => {
    const carregarHistoricoReal = async () => {
      setLoading(true);
      try {
        // A API filtra automaticamente por 'finalizado' e pelas datas
        const dados = await getHistoricoAtendimentos(dataDe, dataAte);
        setHistorico(dados || []);
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarHistoricoReal();
  }, [dataDe, dataAte]);

  return (
    <IonPage>
      <IonContent>
        <div style={{ background: '#000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          {/* Header Superior com a Logo Lava-Me */}
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
          <p style={{ color: '#666', fontSize: '15px', fontWeight: 600, marginBottom: '32px' }}>Apenas serviços finalizados</p>

          {/* Filtros de Data (Atualizam a busca automaticamente) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            <div>
              <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Data Inicial</label>
              <input 
                type="date"
                value={dataDe}
                onChange={(e) => setDataDe(e.target.value)}
                style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '16px', borderRadius: '16px', width: '100%', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Data Final</label>
              <input 
                type="date"
                value={dataAte}
                onChange={(e) => setDataAte(e.target.value)}
                style={{ background: '#161616', border: '1px solid #2a2a2a', padding: '16px', borderRadius: '16px', width: '100%', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Lista de Cards Dinâmicos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '20px' }}><IonSpinner color="primary" /></div>
            ) : historico.length > 0 ? (
              historico.map((os) => (
                <div 
                  key={os.id}
                  onClick={() => setExpandedId(expandedId === os.id ? null : os.id)}
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
                        <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 900, margin: 0 }}>{os.veiculo.placa}</h3>
                        <p style={{ color: '#666', fontSize: '14px', fontWeight: 600, margin: 0 }}>{os.veiculo.modelo}</p>
                      </div>
                    </div>
                    {expandedId === os.id ? <ChevronDown color="#444" size={20} /> : <ChevronRight color="#444" size={20} />}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#444' }}>
                      <Calendar size={16} />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{new Date(os.data_hora).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#444' }}>
                      <Clock size={16} />
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{new Date(os.data_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#222', marginBottom: '16px' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>{os.servico.nome}</span>
                    <span style={{ color: '#444', fontSize: '12px', fontWeight: 800 }}>Finalizado</span>
                  </div>

                  {expandedId === os.id && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #2a2a2a' }}>
                      <p style={{ color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '12px' }}>Observações</p>
                      <div style={{ background: '#1c1c1c', padding: '16px', borderRadius: '16px', color: '#aaa', fontSize: '14px', lineHeight: '1.5' }}>
                        {os.observacoes || "Nenhuma observação registrada."}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: '#444', textAlign: 'center', marginTop: '40px' }}>Nenhum atendimento finalizado encontrado.</p>
            )}
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