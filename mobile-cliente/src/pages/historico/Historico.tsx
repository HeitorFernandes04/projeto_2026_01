import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonModal,
  IonButton,
  useIonViewWillEnter,
} from '@ionic/react';
import { getHistorico } from '../../services/api';
import type { OrdemServico } from '../../services/api';
import './Historico.css';

const STATUS_BADGE: Record<string, string> = {
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
  AGENDADO: 'agendado',
  EM_EXECUCAO: 'andamento',
  PATIO: 'andamento',
  VISTORIA_INICIAL: 'andamento',
  LIBERACAO: 'andamento',
};

const STATUS_LABEL: Record<string, string> = {
  FINALIZADO: 'Concluído',
  CANCELADO: 'Cancelado',
  AGENDADO: 'Agendado',
  EM_EXECUCAO: 'Em Execução',
  PATIO: 'No Pátio',
  VISTORIA_INICIAL: 'Em Vistoria',
  LIBERACAO: 'Liberação',
};

const Historico: React.FC = () => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [detalhe, setDetalhe] = useState<OrdemServico | null>(null);

  useIonViewWillEnter(() => {
    getHistorico()
      .then(setOrdens)
      .catch(() => {});
  });

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="hist-toolbar">
          <IonTitle className="hist-title">Histórico</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <p className="hist-subtitulo">Seus serviços realizados</p>

        {ordens.length === 0 ? (
          <div className="hist-vazio">
            <span className="hist-vazio-emoji">📋</span>
            <p className="hist-vazio-texto">Nenhum serviço realizado ainda.</p>
          </div>
        ) : (
          ordens.map(os => (
            <div key={os.id} className="lm-card hist-card">
              <div className="hist-card-header">
                <span className="hist-servico">{os.servico_nome}</span>
                <span className="hist-preco">R$ {Number(os.valor).toFixed(2)}</span>
              </div>
              <p className="hist-info">📅 {os.data_agendamento} 🕐 {os.horario}</p>
              <p className="hist-info">📍 {os.estabelecimento_nome}</p>
              <p className="hist-info">🚗 {os.veiculo_modelo} {os.veiculo_placa}</p>

              <div className="hist-card-footer">
                <span className={`lm-badge lm-badge-${STATUS_BADGE[os.status] ?? 'agendado'}`}>
                  {STATUS_LABEL[os.status] ?? os.status}
                </span>
                <button className="hist-detalhe-btn" onClick={() => setDetalhe(os)}>
                  Ver detalhes ›
                </button>
              </div>
            </div>
          ))
        )}
      </IonContent>

      {/* Modal de detalhe */}
      <IonModal
        isOpen={!!detalhe}
        onDidDismiss={() => setDetalhe(null)}
        breakpoints={[0, 0.75]}
        initialBreakpoint={0.75}
      >
        <IonContent className="lm-page ion-padding">
          {detalhe && (
            <div className="hist-modal-content">
              <h2 className="hist-modal-titulo">{detalhe.servico_nome}</h2>
              <p className="hist-modal-info">📍 {detalhe.estabelecimento_nome}</p>
              <p className="hist-modal-info">📅 {detalhe.data_agendamento}</p>
              <p className="hist-modal-info">🕐 {detalhe.horario}</p>
              <p className="hist-modal-info">🚗 {detalhe.veiculo_modelo} {detalhe.veiculo_placa}</p>
              <p className="hist-modal-preco">R$ {Number(detalhe.valor).toFixed(2)}</p>
              <span className={`lm-badge lm-badge-${STATUS_BADGE[detalhe.status] ?? 'agendado'}`}>
                {STATUS_LABEL[detalhe.status] ?? detalhe.status}
              </span>
              <IonButton
                className="lm-btn-primary"
                expand="block"
                onClick={() => setDetalhe(null)}
                style={{ marginTop: '24px' }}
              >
                Fechar
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Historico;
