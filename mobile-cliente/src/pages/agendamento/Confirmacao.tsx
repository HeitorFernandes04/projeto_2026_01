import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonAlert,
  IonToast,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/react';
import { locationOutline, constructOutline, calendarOutline, carOutline, checkmarkCircleOutline, cashOutline, chevronDownOutline, checkmarkOutline } from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useHistory, useLocation } from 'react-router-dom';
import { createAgendamento, getVeiculos } from '../../services/api';
import type { Servico, Veiculo } from '../../services/api';
import './Confirmacao.css';

interface LocationState {
  slug: string;
  servico: Servico;
  estabelecimento_nome: string;
  data: string;
  horario: string;
  veiculo: Veiculo;
}

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${dia} de ${meses[Number(mes) - 1]}, ${ano}`;
}

function formatarCor(cor: string): string {
  if (!cor) return '';
  return cor.charAt(0).toUpperCase() + cor.slice(1).toLowerCase();
}

function formatarPlaca(placa: string): string {
  if (!placa) return '';
  const p = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (p.length === 7) {
    return `${p.substring(0, 3)}-${p.substring(3)}`;
  }
  return p;
}

const Confirmacao: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  
  const [stateData, setStateData] = useState<LocationState | null>(location.state);
  const [loadingData, setLoadingData] = useState(!location.state);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showAlerta, setShowAlerta] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  React.useEffect(() => {
    getVeiculos()
      .then(list => {
        setVeiculos(list);
        if (!stateData) {
          const pending = localStorage.getItem('lm_agendamento_pendente') || localStorage.getItem('lm_agendamento_temporario');
          if (pending) {
            const agendamentoData = JSON.parse(pending);
            if (list.length > 0) {
              setStateData({ ...agendamentoData, veiculo: list[0] });
            } else {
              history.replace('/veiculo/novo');
            }
            setLoadingData(false);
          } else {
            history.replace('/inicio');
            setLoadingData(false);
          }
        } else {
          setLoadingData(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!stateData) {
          history.replace('/inicio');
          setLoadingData(false);
        } else {
          setLoadingData(false);
        }
      });
  }, [stateData, history]);

  if (loadingData) {
    return (
      <IonPage>
        <IonContent className="ion-padding" style={{ textAlign: 'center', marginTop: '100px', color: 'white' }}>
          Carregando dados do agendamento...
        </IonContent>
      </IonPage>
    );
  }

  if (!stateData) {
    return null;
  }

  const { slug, servico, estabelecimento_nome, data, horario, veiculo } = stateData;

  const handleConfirmar = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await createAgendamento({
        slug,
        servico_id: servico.id,
        veiculo_id: veiculo.id,
        data_hora: `${data}T${horario}:00`, // Combina "YYYY-MM-DD" e "HH:MM" para formato ISO válido
      });

      localStorage.removeItem('lm_agendamento_temporario');
      localStorage.removeItem('lm_agendamento_pendente');

      setSucesso(true);
    } catch (e) {
      const err = e as Error & { status?: number };
      setLoading(false);
      setErroMsg(err.message ?? 'Erro ao comunicar com o servidor.');
      setShowAlerta(true);
    }
  };

  useEffect(() => {
    if (sucesso) {
      const timer = setTimeout(() => {
        history.replace('/inicio');
      }, 3500); // Tempo aumentado para o usuário apreciar mais a animação
      return () => clearTimeout(timer);
    }
  }, [sucesso, history]);

  if (sucesso) {
    return (
      <IonPage className="confirm-page">
        <IonContent className="ion-padding confirm-content success-view">
          <div className="success-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            
            {/* Box relativo para empilhar as animações (Ondas + Ícone) */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', width: '100px', height: '100px' }}>
              
              {/* Efeito Ripple (3 Ondas concêntricas) */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut"
                  }}
                  style={{
                    position: 'absolute',
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(56, 189, 248, 0.2)'
                  }}
                />
              ))}

              {/* Círculo Principal com Pulsação e Glow Effect Neon */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  position: 'relative',
                  zIndex: 10,
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)'
                }}
              >
                <IonIcon icon={checkmarkOutline} style={{ fontSize: '50px', color: '#38BDF8' }} />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.4,
                ease: "easeOut"
              }}
            >
              <h1 style={{ color: 'white', marginTop: 0, fontSize: '24px', fontWeight: 'bold' }}>Agendamento Confirmado!</h1>
              <p style={{ color: 'var(--conf-muted)', marginBottom: '40px', fontSize: '15px' }}>
                Redirecionando para o acompanhamento...
              </p>
            </motion.div>

          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="confirm-page">
      <IonHeader className="ion-no-border confirm-header">
        <IonToolbar className="confirm-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/agendamento" text="" className="confirm-back-button" />
          </IonButtons>
          <IonTitle className="confirm-title">Confirmação</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding confirm-content">
        
        {/* Bloco 1: Serviço (Estabelecimento, Nome, Data, Hora) */}
        <div className="confirm-card">
          <p className="confirm-card-header">Serviço</p>
          <div className="confirm-inner-box">
            <p className="confirm-info-row">
              <span className="confirm-icon"><IonIcon icon={locationOutline} /></span> {estabelecimento_nome}
            </p>
            <p className="confirm-info-row">
              <span className="confirm-icon"><IonIcon icon={constructOutline} /></span> {servico.nome}
            </p>
            <p className="confirm-info-row">
              <span className="confirm-icon"><IonIcon icon={calendarOutline} /></span> {formatarData(data)} às {horario}
            </p>
          </div>
        </div>

        {/* Bloco 2: Veículo (Marca, Modelo, Cor e Placa em caixa alta) */}
        <div className="confirm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p className="confirm-card-header" style={{ margin: 0 }}>Seu Veículo</p>
            <button 
              className="confirm-add-veiculo-btn" 
              onClick={() => {
                const agendamentoData = {
                  slug,
                  servico,
                  estabelecimento_nome,
                  data,
                  horario
                };
                localStorage.setItem('lm_agendamento_temporario', JSON.stringify(agendamentoData));
                history.push('/veiculo/novo');
              }}
              style={{ background: 'none', border: 'none', color: '#38BDF8', fontWeight: 700, fontSize: '15px', cursor: 'pointer', padding: 0 }}
            >
              + Adicionar Novo
            </button>
          </div>
          
          {veiculos.length > 0 ? (
            <div className="confirm-veiculo-select-container">
              <div 
                className="confirm-veiculo-select-display"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className="confirm-icon" style={{ fontSize: '28px' }}>
                  <IonIcon icon={carOutline} />
                </span>
                
                <div className="confirm-veiculo-select-text">
                  <span className="confirm-veiculo-name">{veiculo.marca} {veiculo.modelo} - {formatarCor(veiculo.cor)}</span>
                  <span className="confirm-veiculo-placa">{formatarPlaca(veiculo.placa)}</span>
                </div>

                <span className="confirm-icon" style={{ color: 'var(--conf-primary)', fontSize: '22px', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                  <IonIcon icon={chevronDownOutline} />
                </span>
              </div>
              
              {isDropdownOpen && (
                <div className="confirm-dropdown-menu">
                  {veiculos.map(v => (
                    <div 
                      key={v.id} 
                      className="confirm-dropdown-item"
                      onClick={() => {
                        setStateData(prev => prev ? { ...prev, veiculo: v } : null);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span className="confirm-icon" style={{ fontSize: '24px', color: veiculo.id === v.id ? 'var(--conf-primary)' : 'var(--conf-muted)' }}>
                        <IonIcon icon={carOutline} />
                      </span>
                      <div className="confirm-veiculo-select-text">
                        <span className="confirm-veiculo-name">{v.marca} {v.modelo} - {formatarCor(v.cor)}</span>
                        <span className="confirm-veiculo-placa">{formatarPlaca(v.placa)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="confirm-info-row">
              <span className="confirm-icon"><IonIcon icon={carOutline} /></span> 
              {veiculo.marca} {veiculo.modelo} ({veiculo.cor})
              <span className="confirm-placa">{veiculo.placa}</span>
            </div>
          )}
        </div>

        {/* Bloco 3: Total e Tempo */}
        <div className="confirm-card">
          <div className="confirm-total-row" style={{ alignItems: 'center' }}>
            <span className="confirm-total-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="confirm-icon" style={{ fontWeight: '500', fontSize: '24px', display: 'flex', alignItems: 'center' }}>$</span>
              Total:
            </span>
            <span className="confirm-total-valor" style={{ border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '12px', padding: '8px 16px' }}>
              R$ {Number(servico.preco).toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="confirm-duracao">Duração estimada: {servico.duracao_estimada_min} min</p>
        </div>

      </IonContent>

      <div className="confirm-footer">
        <IonButton
          className="confirm-btn-primary"
          expand="block"
          disabled={loading}
          onClick={handleConfirmar}
        >
          {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
        </IonButton>
      </div>

      <IonAlert
        isOpen={showAlerta}
        header="Atenção"
        message={erroMsg}
        buttons={['Entendi']}
        onDidDismiss={() => setShowAlerta(false)}
      />

      <IonToast
        isOpen={showToast}
        message="Agendamento confirmado!"
        duration={1500}
        color="success"
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
};

export default Confirmacao;
