import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonModal,
  IonIcon,
} from '@ionic/react';
import { 
  calendarOutline, 
  locationOutline, 
  carOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { motion } from 'framer-motion';
import type { OrdemServico } from '../../services/api';
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
  const [ordens] = useState<OrdemServico[]>([
    {
      id: 1,
      servico_nome: 'Lavagem Completa',
      estabelecimento_nome: 'Lava-Me Centro',
      data_agendamento: '10/05/2026',
      horario: '14:00',
      valor: 80.00,
      status: 'FINALIZADO',
      veiculo_modelo: 'Toyota Corolla',
      veiculo_placa: 'ABC-1234',
      veiculo_cor: 'Preto'
    },
    {
      id: 2,
      servico_nome: 'Higienização Interna',
      estabelecimento_nome: 'Lava Rápido Premium',
      data_agendamento: '28/04/2026',
      horario: '09:30',
      valor: 150.00,
      status: 'FINALIZADO',
      veiculo_modelo: 'Honda Civic',
      veiculo_placa: 'XYZ-5678',
      veiculo_cor: 'Prata'
    },
    {
      id: 3,
      servico_nome: 'Enceramento Técnico',
      estabelecimento_nome: 'Lava-Me Centro',
      data_agendamento: '15/03/2026',
      horario: '16:15',
      valor: 120.00,
      status: 'CANCELADO',
      veiculo_modelo: 'Toyota Corolla',
      veiculo_placa: 'ABC-1234',
      veiculo_cor: 'Preto'
    }
  ]);

  const [detalhe, setDetalhe] = useState<OrdemServico | null>(null);

  const getStatusIcon = (status: string) => {
    if (status === 'FINALIZADO') return checkmarkCircleOutline;
    if (status === 'CANCELADO') return closeCircleOutline;
    return alertCircleOutline;
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

          {ordens.length === 0 ? (
            <div className="hist-vazio">
              <span className="hist-vazio-emoji">📋</span>
              <p className="hist-vazio-texto">Nenhum serviço realizado ainda.</p>
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
                      <span>{os.data_agendamento} às {os.horario}</span>
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