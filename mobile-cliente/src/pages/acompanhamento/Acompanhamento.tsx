import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonContent,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import { getOrdemAtiva, getAcompanhamento } from '../../services/api';
import './Acompanhamento.css';

interface Etapa {
  label: string;
  status: string;
  desc: string;
}

const ETAPAS: Etapa[] = [
  { label: 'NO PÁTIO', status: 'PATIO', desc: 'Veículo chegou e aguarda início' },
  { label: 'EM VISTORIA', status: 'VISTORIA', desc: 'Inspeção do veículo' },
  { label: 'EM EXECUÇÃO', status: 'EXECUCAO', desc: 'Lavagem em andamento' },
  { label: 'EM LIBERAÇÃO', status: 'LIBERACAO', desc: 'Finalização e liberação' },
];

const Acompanhamento: React.FC = () => {
  const [progresso, setProgresso] = useState(100); // Para bater com o protótipo
  const [status, setStatus] = useState('EXECUCAO'); // Para bater com o protótipo
  const [estabelecimento, setEstabelecimento] = useState('Lava Rápido Premium');
  const [tempoEstimado, setTempoEstimado] = useState<number | null>(15);
  const [finalizado, setFinalizado] = useState(false);
  const [semOS, setSemOS] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStatusIndex = (statusStr: string) => {
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
      setProgresso(data.etapa_atual);
      setStatus(data.status);
      if (data.status === 'FINALIZADO') {
        setFinalizado(true);
        pararPolling();
      }
    } catch {
      // Falha silenciosa
    }
  };

  useIonViewWillEnter(() => {
    getOrdemAtiva()
      .then(ativa => {
        if (!ativa) {
          setSemOS(true);
          return;
        }
        setEstabelecimento(ativa.estabelecimento_nome);
        setTempoEstimado(ativa.tempo_estimado_min);
        setStatus(ativa.status);
        setProgresso(ativa.progresso);
        setSemOS(false);
        setFinalizado(ativa.status === 'FINALIZADO');

        poll(ativa.id);
        intervalRef.current = setInterval(() => poll(ativa.id), 15_000);
      })
      .catch(() => {
        // Mantém dados mockados se a API falhar para visualização
        setSemOS(false);
      });
  });

  useIonViewWillLeave(() => {
    pararPolling();
  });

  const statusIndex = getStatusIndex(status);

  return (
    <IonPage className="acompanhamento-page">
      <IonContent className="custom-content" fullscreen>
        <div className="content-wrapper">
          {/* Header Superior */}
          <div className="header-section">
            <div className="header-top">
              <h1 className="title-premium">{estabelecimento}</h1>
              <span className="badge-status">EM EXECUÇÃO</span>
            </div>
            <p className="eta-text">Tempo estimado: ~{tempoEstimado} min</p>
          </div>

          {/* Box Central de Animação */}
          <div className="animation-box">
            <div className="glow-square square-large-2"></div>
            <div className="glow-square square-large-1"></div>
            <div className="glow-square square-1"></div>
            <div className="glow-square square-2"></div>
            <div className="glow-square square-3"></div>
            
            <div className="car-container">
              {/* SVG para o carro abstrato */}
              <svg className="abstract-car" viewBox="0 0 100 100" width="100" height="100">
                <path 
                  d="M 5,60 
                     L 15,60 
                     C 15,50 25,50 25,60 
                     L 65,60 
                     C 65,50 75,50 75,60 
                     L 95,60 
                     C 97,55 97,50 95,45 
                     C 90,35 80,35 75,35 
                     C 70,35 60,15 50,15 
                     L 30,15 
                     C 20,15 15,30 10,40 
                     L 5,50 
                     Z" 
                  fill="none" 
                  stroke="#38BDF8" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="20" cy="60" r="5" fill="none" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="70" cy="60" r="5" fill="none" stroke="#38BDF8" strokeWidth="2" />
              </svg>
            </div>

            {/* Partículas e Atmosfera */}
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

          {/* Barra de Progresso */}
          <div className="progress-section">
            <div className="progress-header">
              <span>Progresso geral</span>
              <span>{progresso}%</span>
            </div>
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
                          <path d="M5 13l4 4L19 7" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Acompanhamento;
