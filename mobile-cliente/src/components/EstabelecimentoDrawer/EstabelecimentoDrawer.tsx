import React from 'react';
import { IonModal, IonContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { EstabelecimentoMapa } from '../../services/api';
import './EstabelecimentoDrawer.css';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isAberto(e: EstabelecimentoMapa): boolean {
  if (!e.horario_abertura || !e.horario_fechamento) return true;
  const now = new Date();
  const [hA, mA] = e.horario_abertura.split(':').map(Number);
  const [hF, mF] = e.horario_fechamento.split(':').map(Number);
  const min = now.getHours() * 60 + now.getMinutes();
  return min >= hA * 60 + mA && min <= hF * 60 + mF;
}

interface Props {
  estabelecimento: EstabelecimentoMapa | null;
  posicaoUsuario: [number, number] | null;
  onClose: () => void;
}

const EstabelecimentoDrawer: React.FC<Props> = ({ estabelecimento, posicaoUsuario, onClose }) => {
  const { token } = useAuth();
  const history = useHistory();

  const handleVerServicos = () => {
    if (!estabelecimento) return;
    onClose();
    history.push(`/servicos/${estabelecimento.slug}`);
  };

  const handleComoChegar = () => {
    if (!estabelecimento) return;
    const { latitude, longitude, nome_fantasia } = estabelecimento;
    window.open(
      `geo:${latitude},${longitude}?q=${encodeURIComponent(nome_fantasia)}`,
      '_system',
    );
  };

  const distancia = estabelecimento && posicaoUsuario && estabelecimento.latitude && estabelecimento.longitude
    ? haversine(posicaoUsuario[0], posicaoUsuario[1], estabelecimento.latitude, estabelecimento.longitude)
    : null;

  const aberto = estabelecimento ? isAberto(estabelecimento) : false;

  return (
    <IonModal
      isOpen={!!estabelecimento}
      onDidDismiss={onClose}
      breakpoints={[0, 0.5, 0.85]}
      initialBreakpoint={0.5}
      backdropBreakpoint={0.5}
      backdropDismiss
    >
      <IonContent className="lm-page">
        {estabelecimento && (
          <div className="drawer-content">
            <div className="drawer-handle" />

            <div className="drawer-header">
              {estabelecimento.logo && (
                <img
                  src={estabelecimento.logo}
                  alt={`Logo ${estabelecimento.nome_fantasia}`}
                  className="drawer-logo"
                  crossOrigin="anonymous"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="drawer-header-info">
                <h2 className="drawer-nome">{estabelecimento.nome_fantasia}</h2>
                <span className={`lm-badge ${aberto ? 'lm-badge-finalizado' : 'lm-badge-cancelado'}`}>
                  {aberto ? 'Aberto' : 'Fechado'}
                </span>
              </div>
            </div>

            <div className="drawer-metricas">
              {estabelecimento.avaliacao != null && (
                <span className="drawer-metrica">⭐ {estabelecimento.avaliacao.toFixed(1)}</span>
              )}
              {distancia != null && (
                <>
                  <span className="drawer-metrica">📍 {distancia.toFixed(1)} km</span>
                  <span className="drawer-metrica">⏱ ~{Math.round(distancia * 2)} min</span>
                </>
              )}
            </div>

            <p className="drawer-endereco">{estabelecimento.endereco_completo}</p>

            {estabelecimento.descricao && (
              <p className="drawer-descricao">{estabelecimento.descricao}</p>
            )}

            <div className="drawer-acoes">
              <IonButton
                className="drawer-btn-secundario"
                fill="outline"
                onClick={handleComoChegar}
              >
                📍 Como chegar
              </IonButton>
              <IonButton
                className="lm-btn-primary drawer-btn-primary"
                onClick={handleVerServicos}
              >
                Ver Serviços
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default EstabelecimentoDrawer;
