import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOrdemAtiva, getOrdens, getVeiculos } from '../../services/api';
import type { OrdemAtiva, OrdemServico, Veiculo } from '../../services/api';
import './HomeDashboard.css';

const STATUS_LABEL: Record<string, string> = {
  AGENDADO: 'Agendado',
  PATIO: 'No Pátio',
  VISTORIA_INICIAL: 'Em Vistoria',
  EM_EXECUCAO: 'Em Execução',
  LIBERACAO: 'Liberação',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  BLOQUEADO_INCIDENTE: 'Bloqueado',
};

const STATUS_BADGE: Record<string, string> = {
  AGENDADO: 'agendado',
  PATIO: 'andamento',
  VISTORIA_INICIAL: 'andamento',
  EM_EXECUCAO: 'andamento',
  LIBERACAO: 'andamento',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
  BLOQUEADO_INCIDENTE: 'cancelado',
};

const HomeDashboard: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [ordemAtiva, setOrdemAtiva] = useState<OrdemAtiva | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  useIonViewWillEnter(() => {
    Promise.all([
      getOrdemAtiva().catch(() => null),
      getOrdens().catch(() => []),
      getVeiculos().catch(() => []),
    ]).then(([ativa, listaOrdens, listaVeiculos]) => {
      setOrdemAtiva(ativa);
      setOrdens(listaOrdens.slice(0, 3));
      setVeiculos(listaVeiculos.slice(0, 2));
    });
  });

  const nome = user?.nome?.split(' ')[0] ?? 'Cliente';

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="dashboard-toolbar">
          <IonTitle className="dashboard-title">Início</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <p className="dashboard-saudacao">Olá, {nome}!</p>
        <p className="dashboard-subtitulo">Bem-vindo de volta</p>

        {/* Card de Serviço Ativo */}
        {ordemAtiva && (
          <div className="lm-card dashboard-ativo-card">
            <div className="ativo-header">
              <span className="ativo-badge lm-badge lm-badge-andamento btn-pulse">
                🔵 SERVIÇO ATIVO
              </span>
            </div>
            <p className="ativo-descricao">Seu veículo está em execução</p>
            <p className="ativo-info">📍 {ordemAtiva.estabelecimento_nome}</p>
            <p className="ativo-info">🚗 {ordemAtiva.veiculo_modelo} {ordemAtiva.veiculo_placa}</p>
            {ordemAtiva.tempo_estimado_min && (
              <p className="ativo-info">⏱ ~{ordemAtiva.tempo_estimado_min} min restantes</p>
            )}
            <div className="ativo-progress-container">
              <div
                className="ativo-progress-bar"
                style={{ width: `${ordemAtiva.progresso}%` }}
              />
            </div>
            <span className="ativo-progresso-label">{ordemAtiva.progresso}%</span>
            <IonButton
              className="lm-btn-primary"
              expand="block"
              onClick={() => history.push('/acompanhamento')}
            >
              ⚡ Acompanhar
            </IonButton>
          </div>
        )}

        {/* Agendamentos Recentes */}
        {ordens.length > 0 && (
          <>
            <h3 className="dashboard-section-title">Agendamentos recentes</h3>
            {ordens.map(os => (
              <div key={os.id} className="lm-card dashboard-os-card">
                <div className="os-card-header">
                  <span className="os-servico">{os.servico_nome}</span>
                  <span className={`lm-badge lm-badge-${STATUS_BADGE[os.status] ?? 'agendado'}`}>
                    {STATUS_LABEL[os.status] ?? os.status}
                  </span>
                </div>
                <p className="os-info">📅 {os.data_agendamento} 🕐 {os.horario}</p>
                <p className="os-info">📍 {os.estabelecimento_nome}</p>
                <p className="os-valor">R$ {Number(os.valor).toFixed(2)}</p>
              </div>
            ))}
          </>
        )}

        {/* Veículos */}
        {veiculos.length > 0 && (
          <>
            <h3 className="dashboard-section-title">Meus veículos</h3>
            {veiculos.map(v => (
              <div
                key={v.id}
                className="lm-card dashboard-veiculo-card"
                onClick={() => history.push(`/veiculo/${v.id}`)}
              >
                <span className="veiculo-icon">🚗</span>
                <div className="veiculo-info">
                  <span className="veiculo-nome">{v.marca} {v.modelo}</span>
                  <span className="veiculo-placa">{v.placa} · {v.cor}</span>
                </div>
                <span className="veiculo-chevron">›</span>
              </div>
            ))}
          </>
        )}

        <IonButton
          className="lm-btn-primary dashboard-agendar-btn"
          expand="block"
          onClick={() => history.push('/mapa')}
        >
          📅 Agendar nova lavagem
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default HomeDashboard;
