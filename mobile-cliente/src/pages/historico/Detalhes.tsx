import React, { useState } from 'react';
import { IonToolbar, IonIcon, IonContent, IonHeader, IonModal } from '@ionic/react';
import { calendarOutline, locationOutline, carOutline, documentTextOutline, chevronBackOutline, closeOutline } from 'ionicons/icons';
import type { OrdemServico } from '../../services/api';
import './Detalhes.css';

interface DetalhesProps {
  ordem: OrdemServico;
  onClose: () => void;
}

const Detalhes: React.FC<DetalhesProps> = ({ ordem, onClose }) => {
  // Estado para capturar e maximizar a foto selecionada em tela cheia
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  // Mock estático de 5 fotos da esteira de produção para o ANTES (Vistoria Inicial)
  const fotosAntes = [
    "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80"
  ];

  // Mock estático de 5 fotos da esteira de produção para o DEPOIS (Liberação Final)
  const fotosDepois = [
    "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=300&q=80",
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80"
  ];

  const observacaoMock = "Lavagem técnica finalizada com sucesso. Remoção completa de resíduos ferrosos na lataria e aplicação de cera protetiva de carnaúba. Nenhuma pendência prévia identificada na vistoria de entrada.";

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

          {/* Bloco 2: Card Isolado do ANTES com as 5 fotos clicáveis */}
          <div className="detalhes-info-card">
            <span className="detalhes-section-header">Antes (Vistoria Inicial)</span>
            <div className="detalhes-photos-scroll">
              {fotosAntes.map((foto, index) => (
                <div 
                  key={`antes-${index}`} 
                  className="detalhes-image-wrapper interactive-photo"
                  onClick={() => setFotoAmpliada(foto)}
                >
                  <img src={foto} alt={`Vistoria Inicial ${index + 1}`} className="detalhes-img-render" />
                </div>
              ))}
            </div>
          </div>

          {/* Bloco 3: Card Isolado do DEPOIS com as 5 fotos clicáveis */}
          <div className="detalhes-info-card">
            <span className="detalhes-section-header">Depois (Vistoria Final)</span>
            <div className="detalhes-photos-scroll">
              {fotosDepois.map((foto, index) => (
                <div 
                  key={`depois-${index}`} 
                  className="detalhes-image-wrapper interactive-photo"
                  onClick={() => setFotoAmpliada(foto)}
                >
                  <img src={foto} alt={`Entrega Final ${index + 1}`} className="detalhes-img-render" />
                </div>
              ))}
            </div>
          </div>

          {/* Bloco 4: Observações Técnicas da Liberação */}
          <div className="detalhes-obs-card">
            <div className="detalhes-row" style={{ marginBottom: '8px' }}>
              <IonIcon icon={documentTextOutline} style={{ color: '#38BDF8' }} />
              <span className="detalhes-section-header" style={{ color: '#38BDF8', margin: 0 }}>Observações do Operador</span>
            </div>
            <p className="detalhes-obs-text">
              {observacaoMock ?? "Nenhuma observação registrada pelo operador nesta lavagem."}
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