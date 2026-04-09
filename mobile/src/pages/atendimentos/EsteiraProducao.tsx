import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { 
  ClipboardCheck, 
  Droplets, 
  Sparkles, 
  Key, 
  ChevronLeft, 
  LogOut 
} from 'lucide-react';
import { getAtendimento } from '../../services/api';
import TabBar from '../../components/TabBar';
import Toast from '../../components/Toast';
import EstadoVistoria from '../../components/EstadoVistoria';
import EstadoLavagem from '../../components/EstadoLavagem';
import EstadoAcabamento from '../../components/EstadoAcabamento';
import EstadoLiberacao from '../../components/EstadoLiberacao';

// Import da Logo
import logoImg from '../../assets/logo.jpeg';

// Interface para as mídias (necessária para a tipagem completa do Atendimento)
interface Midia {
  id: number;
  arquivo: string;
  momento: "ANTES" | "DEPOIS";
}

interface Atendimento {
  id: number;
  veiculo: {
    placa: string;
    modelo: string;
    marca: string;
    cor: string;
    nome_dono: string;
    celular_dono: string;
  };
  servico: {
    nome: string;
  };
  status: string;
  etapa_atual: number;
  observacoes: string;
  midias: Midia[];
}

const EsteiraProducao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  const carregarAtendimento = useCallback(async () => {
    try {
      // Correção: Tipagem explícita na chamada da API remove o erro de 'any'
      const dados = await getAtendimento(Number(id)) as unknown as Atendimento;
      
      if (dados) {
        // Garante que etapa_atual seja tratada como número
        const etapaTratada = {
          ...dados,
          etapa_atual: parseInt(String(dados.etapa_atual || 1), 10)
        };
        setAtendimento(etapaTratada);
      }
    } catch (error) {
      console.error("Erro ao carregar atendimento:", error);
      setToastMessage('Erro ao carregar atendimento');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      carregarAtendimento();
    }
  }, [id, carregarAtendimento]);

  if (loading) {
    return (
      <IonPage style={{ background: '#000' }}>
        <IonContent style={{ '--background': '#000' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const etapaAtual = atendimento?.etapa_atual || 1;

  const etapas = [
    { id: 1, nome: 'Vistoria', icon: ClipboardCheck },
    { id: 2, nome: 'Lavagem', icon: Droplets },
    { id: 3, nome: 'Acabamento', icon: Sparkles },
    { id: 4, nome: 'Liberação', icon: Key },
  ];

  return (
    <IonPage style={{ background: '#000' }}>
      <IonContent style={{ '--background': '#000' }}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: '#000',
          borderBottom: '1px solid #1a1a1a'
        }}>
          <img src={logoImg} alt="Lava Me" style={{ height: '35px', borderRadius: '4px' }} />
          <button 
            onClick={() => history.push('/login')}
            style={{ background: 'transparent', border: 'none', color: '#ff4444', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
          >
            Sair <LogOut size={18} />
          </button>
        </div>

        <div style={{ padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
          <button 
            onClick={() => history.push('/atendimentos/hoje')}
            style={{ 
              position: 'absolute', left: '20px', top: '30px', 
              background: '#1a1a1a', border: 'none', borderRadius: '50%', 
              width: '40px', height: '40px', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: '#fff' 
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, margin: 0 }}>
            OS #{atendimento?.id.toString().padStart(4, '0')}
          </h1>
          <p style={{ color: '#888', fontSize: '14px', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {atendimento?.veiculo.modelo} • <span style={{ color: '#0066ff' }}>{atendimento?.veiculo.placa}</span>
          </p>
        </div>

        <div style={{ 
          background: '#0a0a0a', 
          padding: '20px 10px', 
          margin: '0 15px', 
          borderRadius: '16px',
          border: '1px solid #1a1a1a',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', top: '20px', left: '10%', right: '10%', 
              height: '2px', background: '#1a1a1a', zIndex: 0 
            }} />
            
            {etapas.map((etapa) => {
              const Icon = etapa.icon;
              const isCompleted = etapa.id < etapaAtual;
              const isActive = etapa.id === etapaAtual;

              return (
                <div key={etapa.id} style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '25%' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isActive ? '#0066ff' : isCompleted ? '#00cc66' : '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive || isCompleted ? '#fff' : '#444',
                    border: isActive ? '4px solid rgba(0, 102, 255, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ 
                    fontSize: '10px', 
                    marginTop: '8px', 
                    color: isActive ? '#0066ff' : isCompleted ? '#00cc66' : '#666', 
                    fontWeight: isActive ? 700 : 500,
                    textTransform: 'uppercase'
                  }}>
                    {etapa.nome}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ paddingBottom: '100px' }}>
          {atendimento && (
            <>
              {etapaAtual === 1 && <EstadoVistoria atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
              {etapaAtual === 2 && <EstadoLavagem atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
              {etapaAtual === 3 && <EstadoAcabamento atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
              {etapaAtual === 4 && <EstadoLiberacao atendimentoId={atendimento.id} onComplete={carregarAtendimento} />}
            </>
          )}
        </div>

        <TabBar activeTab="pátio" />
      </IonContent>

      <Toast 
        message={toastMessage}
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        color={toastColor}
      />
    </IonPage>
  );
};

export default EsteiraProducao;