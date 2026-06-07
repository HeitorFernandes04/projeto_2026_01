import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { locationOutline, timeOutline, navigateOutline, sparklesOutline, closeOutline } from 'ionicons/icons';
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

  if (!estabelecimento) return null;

  const distancia = posicaoUsuario && estabelecimento.latitude && estabelecimento.longitude
    ? haversine(posicaoUsuario[0], posicaoUsuario[1], estabelecimento.latitude, estabelecimento.longitude)
    : null;

  const aberto = isAberto(estabelecimento);

  return (
    <div className="floating-card-wrapper">
      {/* Background invisível para detectar clique fora e fechar */}
      <div className="floating-card-backdrop" onClick={onClose}></div>
      
      <div className="floating-card">
        {/* Botão de Fechar */}
        <button className="floating-close-btn" onClick={onClose}>
          <IonIcon icon={closeOutline} />
        </button>

        {/* Conteúdo Principal Superior (Textos na Esquerda, Logo na Direita) */}
        <div className="fc-main-content">
          <div className="fc-info-column">
            <div className="fc-title-group">
              <h2 className="fc-nome">{estabelecimento.nome_fantasia}</h2>
              <span className={`fc-badge ${aberto ? 'fc-badge-aberto' : 'fc-badge-fechado'}`}>
                {aberto ? 'ABERTO' : 'FECHADO'}
              </span>
            </div>

            {/* Linha 2: Distância e Tempo Lado a Lado */}
            {distancia != null && (
              <div className="fc-row-2">
                <div className="fc-metrica">
                  <IonIcon icon={locationOutline} className="fc-icon" />
                  <span>{distancia.toFixed(1)} km</span>
                </div>
                <div className="fc-metrica">
                  <IonIcon icon={timeOutline} className="fc-icon" />
                  <span>~{Math.max(1, Math.round(distancia * 2))} min</span>
                </div>
              </div>
            )}

            {/* Linha 3: Endereço */}
            <p className="fc-endereco">{estabelecimento.endereco_completo}</p>
          </div>

          <div className="fc-logo-container">
            {estabelecimento.logo && (
              <img
                src={estabelecimento.logo}
                alt={`Logo ${estabelecimento.nome_fantasia}`}
                className="fc-logo-right"
                crossOrigin="anonymous"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>

        {/* Linha 4: Botões */}
        <div className="fc-row-4">
          <IonButton
            className="fc-btn-outline"
            fill="outline"
            onClick={handleComoChegar}
          >
            <IonIcon icon={navigateOutline} slot="start" />
            COMO CHEGAR
          </IonButton>
          <IonButton
            className="fc-btn-solid"
            onClick={handleVerServicos}
          >
            <IonIcon icon={sparklesOutline} slot="start" />
            VER SERVIÇOS
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default EstabelecimentoDrawer;
