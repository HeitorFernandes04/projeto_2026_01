import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import { getOrdemAtiva, getAcompanhamento } from '../../services/api';
import './Acompanhamento.css';

interface Etapa {
  label: string;
  status: string;
}

const ETAPAS: Etapa[] = [
  { label: 'NO PÁTIO', status: 'PATIO' },
  { label: 'EM VISTORIA', status: 'VISTORIA_INICIAL' },
  { label: 'EM EXECUÇÃO', status: 'EM_EXECUCAO' },
  { label: 'LIBERAÇÃO', status: 'LIBERACAO' },
  { label: 'FINALIZADO', status: 'FINALIZADO' },
];

const ORDEM_STATUS = ['PATIO', 'VISTORIA_INICIAL', 'EM_EXECUCAO', 'LIBERACAO', 'FINALIZADO'];

function getStatusIndex(status: string): number {
  const idx = ORDEM_STATUS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

const Acompanhamento: React.FC = () => {
  const [status, setStatus] = useState('');
  const [progresso, setProgresso] = useState(0);
  const [estabelecimento, setEstabelecimento] = useState('');
  const [tempoEstimado, setTempoEstimado] = useState<number | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [semOS, setSemOS] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      // Falha silenciosa — próxima tentativa no próximo tick
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
      .catch(() => setSemOS(true));
  });

  useIonViewWillLeave(() => {
    pararPolling();
  });

  const statusIndex = getStatusIndex(status);
  const isIncidente = status === 'BLOQUEADO_INCIDENTE';

  if (semOS) {
    return (
      <IonPage className="lm-page">
        <IonHeader className="ion-no-border">
          <IonToolbar className="acomp-toolbar">
            <IonTitle className="acomp-title">Acompanhamento</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="acomp-sem-os">
            <p className="acomp-sem-os-emoji">🚗</p>
            <p className="acomp-sem-os-texto">Nenhum serviço em andamento no momento.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="acomp-toolbar">
          <IonTitle className="acomp-title">Acompanhamento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="acomp-header">
          <p className="acomp-estabelecimento">{estabelecimento}</p>
          {tempoEstimado && !finalizado && (
            <p className="acomp-tempo">Tempo estimado: ~{tempoEstimado} min</p>
          )}
          <span className={`lm-badge ${isIncidente ? 'lm-badge-cancelado' : 'lm-badge-andamento'}`}>
            {isIncidente ? '⚠️ INCIDENTE' : status.replace('_', ' ')}
          </span>
        </div>

        <div className="acomp-carro-container">
          <span className={`acomp-carro-emoji ${finalizado ? '' : 'acomp-carro-animado'}`}>
            🚗
          </span>
        </div>

        {finalizado && (
          <div className="acomp-finalizado">
            <span className="acomp-check">✅</span>
            <p className="acomp-finalizado-texto">Seu veículo está pronto!</p>
          </div>
        )}

        <div className="acomp-progresso-row">
          <span className="acomp-progresso-label">Progresso geral</span>
          <span className="acomp-progresso-pct">{progresso}%</span>
        </div>
        <div className="acomp-progress-container">
          <div className="acomp-progress-bar" style={{ width: `${progresso}%` }} />
        </div>

        <div className="acomp-timeline">
          {ETAPAS.map((etapa, i) => {
            const concluida = i < statusIndex || finalizado;
            const atual = !finalizado && i === statusIndex && !isIncidente;
            return (
              <div key={etapa.status} className="acomp-etapa">
                <div className="acomp-etapa-linha">
                  <div className={`acomp-etapa-dot ${concluida ? 'dot-concluida' : atual ? 'dot-atual' : 'dot-futura'}`}>
                    {concluida ? '✅' : atual ? String(i + 1) : '○'}
                  </div>
                  {i < ETAPAS.length - 1 && (
                    <div className={`acomp-etapa-connector ${concluida ? 'connector-concluida' : 'connector-futura'}`} />
                  )}
                </div>
                <div className="acomp-etapa-texto">
                  <span className={`acomp-etapa-nome ${atual ? 'etapa-atual' : ''}`}>
                    {etapa.label}
                  </span>
                  {isIncidente && i === statusIndex && (
                    <span className="acomp-incidente-alerta"> ⚠️ Aguardando resolução</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Acompanhamento;
