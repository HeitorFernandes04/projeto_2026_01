import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonAlert,
  IonToast,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  timeOutline,
  star,
  starOutline,
} from 'ionicons/icons';
import { getOrdemAtiva, getAcompanhamento, cancelarAgendamento, avaliarOrdemServico, type OrdemAtiva } from '../../services/api';
import './Acompanhamento.css';

interface Etapa {
  label: string;
  status: string;
  desc: string;
}

const ETAPAS: Etapa[] = [
  { label: 'NO PÁTIO', status: 'PATIO', desc: 'Veículo chegou e aguarda início' },
  { label: 'EM VISTORIA', status: 'VISTORIA_INICIAL', desc: 'Inspeção do veículo' },
  { label: 'EM EXECUÇÃO', status: 'EM_EXECUCAO', desc: 'Lavagem em andamento' },
  { label: 'EM LIBERAÇÃO', status: 'LIBERACAO', desc: 'Finalização e liberação' },
];

const Acompanhamento: React.FC = () => {
  const history = useHistory();
  const [status, setStatus] = useState('PATIO');
  const [estabelecimento, setEstabelecimento] = useState('Lava Rápido');
  const [tempoEstimado, setTempoEstimado] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [semOS, setSemOS] = useState(false);
  const [agendamentoFuturo, setAgendamentoFuturo] = useState(false);
  const [dadosFuturo, setDadosFuturo] = useState<OrdemAtiva | null>(null);
  const [isIncidente, setIsIncidente] = useState(false);
  const [slugCancelamento, setSlugCancelamento] = useState<string | null>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Avaliação
  const [osId, setOsId] = useState<number | null>(null);
  const [avaliacao, setAvaliacao] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [isAvaliado, setIsAvaliado] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStatusIndex = (statusStr: string) => {
    if (statusStr === 'BLOQUEADO_INCIDENTE') return 2; // Mapeia para EM EXECUÇÃO
    return ETAPAS.findIndex(e => e.status === statusStr);
  };

  const pararPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const poll = async (id: number) => {
    try {
      const data = await getAcompanhamento(id);
      setStatus(data.status);
      setIsIncidente(data.status === 'BLOQUEADO_INCIDENTE');
      setSlugCancelamento(data.slug_cancelamento || null);

      if (data.status === 'FINALIZADO') {
        setFinalizado(true);
        pararPolling();
      }
    } catch {
      // Falha silenciosa e resiliente
    }
  };

  useIonViewWillEnter(() => {
    setSemOS(false);
    setAgendamentoFuturo(false);
    setDadosFuturo(null);

    getOrdemAtiva()
      .then(ativa => {
        if (!ativa) {
          setSemOS(true);
          return;
        }

        // Validação de data para status PATIO
        const todayStr = new Date().toISOString().split('T')[0];
        const dateStr = ativa.data_hora ? ativa.data_hora.split('T')[0] : '';

        if (ativa.status === 'PATIO' && dateStr !== todayStr) {
          setAgendamentoFuturo(true);
          setDadosFuturo(ativa);
          setSlugCancelamento(ativa.slug_cancelamento || null);
          return;
        }

        setEstabelecimento(ativa.estabelecimento_nome);
        setTempoEstimado(ativa.tempo_estimado_min);
        setStatus(ativa.status);
        setIsIncidente(ativa.status === 'BLOQUEADO_INCIDENTE');
        setFinalizado(ativa.status === 'FINALIZADO');
        setSlugCancelamento(ativa.slug_cancelamento || null);
        setOsId(ativa.id);
        setAvaliacao(ativa.avaliacao_estrelas ?? null);
        setIsAvaliado(!!ativa.avaliacao_estrelas);

        if (ativa.status !== 'FINALIZADO') {
          poll(ativa.id);
          intervalRef.current = setInterval(() => poll(ativa.id), 15_000);
        }
      })
      .catch(() => {
        setSemOS(true);
      });
  });

  useIonViewWillLeave(() => {
    pararPolling();
  });

  const statusIndex = getStatusIndex(status);

  const executarCancelamento = async () => {
    if (!slugCancelamento || cancelLoading) return;
    setCancelLoading(true);
    try {
      await cancelarAgendamento(slugCancelamento, 'Cancelado pelo cliente pelo portal Mobile.');
      setToastMessage('Agendamento cancelado com sucesso!');
      setShowToast(true);
      setSemOS(true);
      setSlugCancelamento(null);
      setStatus('CANCELADO');
      setFinalizado(true);
      pararPolling();
    } catch (err: any) {
      console.error(err);
      setToastMessage('Falha ao cancelar o agendamento. Tente novamente.');
      setShowToast(true);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleAvaliar = async (nota: number) => {
    if (!osId) return;
    setAvaliacao(nota);
    try {
      await avaliarOrdemServico(osId, nota);
      setIsAvaliado(true);
      setToastMessage('Avaliação enviada com sucesso!');
      setShowToast(true);
    } catch (e) {
      setToastMessage('Erro ao enviar avaliação.');
      setShowToast(true);
      setAvaliacao(null);
    }
  };

  return (
    <IonPage className="acompanhamento-page">
      <IonContent className="custom-content" fullscreen>
        {semOS ? (
          <div className="empty-state-container">
            <div className="radar-icon-box">
              <IonIcon icon={timeOutline} className="radar-icon" />
            </div>
            <h1 className="empty-title">Nenhum veículo na esteira</h1>
            <p className="empty-subtitle">
              Seu histórico está limpo. Que tal dar aquele brilho e proteção que o seu veículo merece hoje?
            </p>
            <button className="lm-btn-primary" onClick={() => history.push('/mapa')}>
              Agendar Nova Lavagem
            </button>
          </div>
        ) : agendamentoFuturo ? (
          <div className="empty-state-container">
            <div className="reserva-card">
              <span className="reserva-badge">AGENDAMENTO RESERVADO</span>
              <div className="reserva-details">
                <h2 className="reserva-estabelecimento">{dadosFuturo?.estabelecimento_nome}</h2>
                <p className="reserva-servico">{dadosFuturo?.servico_nome}</p>
                <p className="reserva-data">
                  {dadosFuturo?.data_hora ? new Date(dadosFuturo.data_hora).toLocaleString('pt-BR') : ''}
                </p>
              </div>
            </div>
            <p className="reserva-info">
              O monitoramento da esteira em tempo real será ativado automaticamente assim que o veículo der entrada no pátio do estabelecimento na data agendada.
            </p>
          </div>
        ) : (
          <div className="content-wrapper">
            {/* Header Superior */}
            <div className="header-section">
              <div className="header-top">
                <h1 className="title-premium">{estabelecimento}</h1>
                <span className="badge-status">
                  {finalizado ? 'CONCLUÍDO' : 'EM EXECUÇÃO'}
                </span>
              </div>
              <p className="eta-text">Tempo estimado: ~{tempoEstimado ?? '--'} min</p>
            </div>

            {/* Box Central de Animação */}
            <div className="animation-box">
              <div className="glow-square square-large-2"></div>
              <div className="glow-square square-large-1"></div>
              <div className="glow-square square-1"></div>
              <div className="glow-square square-2"></div>
              <div className="glow-square square-3"></div>

              <div className="car-container">
                <svg className="abstract-car" viewBox="0 0 100 100" width="100" height="100">
                  <path d="M 5,60 L 15,60 C 15,50 25,50 25,60 L 65,60 C 65,50 75,50 75,60 L 95,60 C 97,55 97,50 95,45 C 90,35 80,35 75,35 C 70,35 60,15 50,15 L 30,15 C 20,15 15,30 10,40 L 5,50 Z" fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="20" cy="60" r="5" fill="none" stroke="#38BDF8" strokeWidth="2" />
                  <circle cx="70" cy="60" r="5" fill="none" stroke="#38BDF8" strokeWidth="2" />
                </svg>
              </div>

              <div className="particle p1"></div>
              <div className="particle p2"></div>
              <div className="particle p3"></div>
              <div className="bubble b1"></div>
              <div className="bubble b2"></div>
              <div className="bubble b3"></div>
              <div className="bubble b4"></div>
              <div className="bubble b5"></div>
              <div className="bubble b6"></div>
              <div className="bubble b7"></div>
              <div className="bubble b8"></div>
              <div className="bubble b9"></div>
              <div className="bubble b10"></div>
              <div className="vapor v1"></div>
              <div className="vapor v2"></div>
            </div>



            {/* Timeline Cards */}
            <div className="timeline-cards">
              {ETAPAS.map((etapa, i) => {
                const concluida = i < statusIndex || finalizado;
                const atual = !finalizado && i === statusIndex;

                return (
                  <div key={etapa.status} className={`timeline-card ${concluida ? 'concluida' : ''} ${atual ? 'atual' : ''}`}>
                    <div className="card-icon-container">
                      {concluida ? (
                        <div className="icon-success">
                          <svg viewBox="0 0 24 24" width="16" height="16">
                            <path d="M5 13l4 4L19 7" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      ) : (
                        <div className="icon-number">{i + 1}</div>
                      )}
                    </div>
                    <div className="card-text">
                      <h3>{etapa.label}</h3>
                      <p>{etapa.desc}</p>
                    </div>
                    {atual && <div className="pulse-dot"></div>}
                  </div>
                );
              })}
            </div>

            {/* Banner de Sucesso */}
            {finalizado && (
              <div style={{ marginTop: '20px', background: 'rgba(52, 211, 153, 0.1)', color: '#34D399', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Seu veículo está pronto!</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>Pode passar para retirar.</p>
              </div>
            )}

            {/* Avaliação (Apenas se finalizado) */}
            {finalizado && (
              <div className="avaliacao-container">
                {isAvaliado ? (
                  <div className="avaliacao-success">
                    <h3 className="avaliacao-title">Avaliação Registrada!</h3>
                    <div className="stars-display">
                      {[1,2,3,4,5].map(v => (
                        <IonIcon 
                          key={v} 
                          icon={v <= (avaliacao || 0) ? star : starOutline} 
                          className="star-icon filled" 
                        />
                      ))}
                    </div>
                    <p className="avaliacao-subtitle">Agradecemos o seu feedback.</p>
                  </div>
                ) : (
                  <div className="avaliacao-box">
                    <h3 className="avaliacao-title">Como foi o serviço?</h3>
                    <p className="avaliacao-subtitle">Sua opinião é importante para o estabelecimento.</p>
                    <div className="stars-interactive">
                      {[1,2,3,4,5].map(v => (
                        <IonIcon 
                          key={v} 
                          icon={v <= (hoverStar || avaliacao || 0) ? star : starOutline}
                          className={`star-icon interactive ${v <= (hoverStar || avaliacao || 0) ? 'filled' : ''}`}
                          onMouseEnter={() => setHoverStar(v)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => handleAvaliar(v)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


          </div>
        )}
      </IonContent>



      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={3000}
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
};

export default Acompanhamento;
