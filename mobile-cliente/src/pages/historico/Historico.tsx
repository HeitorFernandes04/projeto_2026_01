import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonModal,
  IonIcon,
  useIonViewWillEnter,
} from '@ionic/react';
import { 
  calendarOutline, 
  locationOutline, 
  carOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline,
  alertCircleOutline,
  clipboardOutline
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import { useHistory } from 'react-router-dom';
import { getHistorico, type OrdemServico } from '../../services/api';
import Detalhes from './Detalhes';
import './Historico.css';

const STATUS_BADGE: Record<string, string> = {
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
  AGENDADO: 'andamento',
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
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<OrdemServico | null>(null);
  const history = useHistory();

  useIonViewWillEnter(() => {
    setLoading(true);
    getHistorico()
      .then(res => {
        setOrdens(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  });

  const getStatusIcon = (status: string) => {
    if (status === 'FINALIZADO') return checkmarkCircleOutline;
    if (status === 'CANCELADO') return closeCircleOutline;
    return alertCircleOutline;
  };

  const formatarData = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatarHora = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <IonPage className="historico-page">
      <IonHeader className="ion-no-border veiculo-header">
        <IonToolbar className="veiculo-toolbar-fluid">
          <div className="header-content-fluid">
            <h1 className="veiculo-title-premium">Histórico</h1>
            <p className="veiculo-subtitle-premium">Seus serviços realizados</p>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="veiculo-content-premium" scrollY={true}>
        <div className="historico-main-container">

          {loading ? (
            <div className="historico-lista-vertical">
              {[1, 2, 3].map(i => (
                <div key={i} className="hist-card-interactive" style={{ opacity: 0.5 }}>
                  <div className="hist-card-top">
                    <div className="hist-icon-box andamento" style={{ background: '#334155' }}></div>
                    <div className="hist-title-block">
                      <div style={{ width: '120px', height: '16px', background: '#334155', borderRadius: '4px' }}></div>
                      <div style={{ width: '60px', height: '16px', background: '#334155', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ordens.length === 0 ? (
            <div className="hist-vazio">
              <IonIcon icon={clipboardOutline} className="hist-vazio-icon" />
              <p className="hist-vazio-texto">
                Sua folha de serviços está limpa. Que tal agendar um brilho especial para o seu veículo hoje?
              </p>
              <button className="hist-cta-btn" onClick={() => history.push('/mapa')}>
                Encontrar um Lava-Me
              </button>
            </div>
          ) : (
            <div className="historico-lista-vertical">
              {ordens.map(os => (
                <motion.div 
                  key={os.id} 
                  className="hist-card-interactive"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="hist-card-top">
                    <div className={`hist-icon-box ${STATUS_BADGE[os.status] ?? 'andamento'}`}>
                      <IonIcon icon={getStatusIcon(os.status)} />
                    </div>
                    <div className="hist-title-block">
                      <h3 className="hist-servico-nome">{os.servico_nome}</h3>
                      <span className="hist-servico-preco">R$ {Number(os.valor).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <div className="hist-details-body">
                    <div className="hist-info-row">
                      <IonIcon icon={calendarOutline} />
                      <span>{os.data_agendamento || formatarData(os.data_hora)} às {os.horario || formatarHora(os.data_hora)}</span>
                    </div>
                    <div className="hist-info-row">
                      <IonIcon icon={locationOutline} />
                      <span>{os.estabelecimento_nome}</span>
                    </div>
                    <div className="hist-info-row">
                      <IonIcon icon={carOutline} />
                      <span>{os.veiculo_modelo} • Placa {os.veiculo_placa}</span>
                    </div>
                  </div>

                  <div className="hist-card-footer-row">
                    <span className={`hist-badge ${STATUS_BADGE[os.status] ?? 'andamento'}`}>
                      {STATUS_LABEL[os.status] ?? os.status}
                    </span>
                    <button className="hist-detalhe-btn" onClick={() => setDetalhe(os)}>
                      Ver detalhes ›
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </IonContent>

      {/* CORREÇÃO CRÍTICA: Removido 'breakpoints' para abrir em Tela Inteira Nativa */}
      <IonModal
        isOpen={!!detalhe}
        onDidDismiss={() => setDetalhe(null)}
      >
        {detalhe && (
          <Detalhes 
            ordem={detalhe} 
            onClose={() => setDetalhe(null)} 
          />
        )}
      </IonModal>
    </IonPage>
  );
};

export default Historico;