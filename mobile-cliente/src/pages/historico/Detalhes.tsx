import React, { useState, useEffect } from 'react';
import { IonToolbar, IonIcon, IonContent, IonHeader, IonModal } from '@ionic/react';
import { calendarOutline, locationOutline, carOutline, documentTextOutline, chevronBackOutline, closeOutline } from 'ionicons/icons';
import { getGaleriaHistorico, type OrdemServico, type GaleriaHistorico } from '../../services/api';
import './Detalhes.css';

interface DetalhesProps {
  ordem: OrdemServico;
  onClose: () => void;
}

const Detalhes: React.FC<DetalhesProps> = ({ ordem, onClose }) => {
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  const [galeria, setGaleria] = useState<GaleriaHistorico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGaleriaHistorico(ordem.id)
      .then(res => {
        setGaleria(res);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [ordem.id]);

  return (
    /* CORREÇÃO CRÍTICA: Trocado IonPage por div com a classe 'ion-page' para não quebrar a navegação do Ionic */
    <div className="ion-page detalhes-page">
      {/* Header Premium com fundo Slate e alinhamento flex */}
      <IonHeader className="ion-no-border detalhes-header">
        <IonToolbar className="detalhes-toolbar-fluid">
          <div className="header-content-fluid-flex">
            <button className="detalhes-back-btn" onClick={onClose}>
              <IonIcon icon={chevronBackOutline} />
            </button>
            <div className="detalhes-title-group">
              <h1 className="detalhes-title-premium">Detalhes</h1>
              <p className="detalhes-subtitle-premium">Conferência de imagens e laudo técnico</p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="veiculo-content-premium" scrollY={true}>
        <div className="detalhes-main-container">
          
          {/* Bloco 1: Resumo do Atendimento */}
          <div className="detalhes-info-card">
            <span className="detalhes-section-header">Resumo do Atendimento</span>
            
            <div className="detalhes-row">
              <IonIcon icon={carOutline} />
              <span>{ordem.veiculo_modelo} • Placa <strong>{ordem.veiculo_placa}</strong></span>
            </div>

            <div className="detalhes-row">
              <IonIcon icon={calendarOutline} />
              <span>Realizado em {ordem.data_agendamento} às {ordem.horario}</span>
            </div>

            <div className="detalhes-row">
              <IonIcon icon={locationOutline} />
              <span>{ordem.estabelecimento_nome}</span>
            </div>

            <div className="detalhes-row">
              <span className="detalhes-preco-tag">R$ {Number(ordem.valor).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {/* Bloco 2: Card Isolado do ANTES */}
          <div className="detalhes-info-card">
            <span className="detalhes-section-header">Antes (Vistoria Inicial)</span>
            <div className="detalhes-photos-scroll">
              {loading ? (
                <div className="detalhes-image-placeholder"><span>Carregando...</span></div>
              ) : galeria?.entrada.length === 0 ? (
                <div className="detalhes-image-placeholder">
                  <span>Registro de imagem não disponível para este atendimento</span>
                </div>
              ) : (
                galeria?.entrada.map((foto) => (
                  <div 
                    key={foto.id} 
                    className="detalhes-image-wrapper interactive-photo"
                    onClick={() => setFotoAmpliada(foto.arquivo_url)}
                  >
                    <img src={foto.arquivo_url} alt="Vistoria Inicial" className="detalhes-img-render" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bloco 3: Card Isolado do DEPOIS */}
          <div className="detalhes-info-card">
            <span className="detalhes-section-header">Depois (Vistoria Final)</span>
            <div className="detalhes-photos-scroll">
              {loading ? (
                <div className="detalhes-image-placeholder"><span>Carregando...</span></div>
              ) : galeria?.finalizacao.length === 0 ? (
                <div className="detalhes-image-placeholder">
                  <span>Registro de imagem não disponível para este atendimento</span>
                </div>
              ) : (
                galeria?.finalizacao.map((foto) => (
                  <div 
                    key={foto.id} 
                    className="detalhes-image-wrapper interactive-photo"
                    onClick={() => setFotoAmpliada(foto.arquivo_url)}
                  >
                    <img src={foto.arquivo_url} alt="Entrega Final" className="detalhes-img-render" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bloco 4: Observações Técnicas da Liberação */}
          <div className="detalhes-obs-card">
            <div className="detalhes-row" style={{ marginBottom: '8px' }}>
              <IonIcon icon={documentTextOutline} style={{ color: '#38BDF8' }} />
              <span className="detalhes-section-header" style={{ color: '#38BDF8', margin: 0 }}>Observações do Operador</span>
            </div>
            <p className="detalhes-obs-text">
              {galeria?.laudo_tecnico.observacoes || ordem.observacoes || "Nenhuma observação registrada pelo operador nesta lavagem."}
            </p>
          </div>

          {/* Botão de Retorno */}
          <button className="btn-close-detalhes" onClick={onClose}>
            Fechar Detalhes
          </button>

        </div>
      </IonContent>

      {/* overlay de Zoom em Tela Cheia para Maximizar as Fotos */}
      <IonModal 
        isOpen={!!fotoAmpliada} 
        onDidDismiss={() => setFotoAmpliada(null)}
        className="foto-detalhe-zoom-modal"
      >
        <div className="foto-zoom-overlay" onClick={() => setFotoAmpliada(null)}>
          <button className="foto-zoom-close-btn">
            <IonIcon icon={closeOutline} />
          </button>
          <div className="foto-zoom-wrapper" onClick={(e) => e.stopPropagation()}>
            <img src={fotoAmpliada || ''} alt="Visualização expandida" className="foto-zoom-img" />
          </div>
          <p className="foto-zoom-hint">Toque em qualquer lugar para fechar</p>
        </div>
      </IonModal>
    </div>
  );
};

export default Detalhes;