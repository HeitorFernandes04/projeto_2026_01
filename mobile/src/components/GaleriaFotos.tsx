import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadFotos } from '../services/api';
import { 
  IonModal, IonSpinner, IonIcon, IonHeader, 
  IonToolbar, IonTitle, IonButtons, IonButton, IonContent 
} from '@ionic/react';
import { closeOutline, addOutline } from 'ionicons/icons';

interface Foto {
  id?: number;
  arquivo: string; // URL da API ou Blob local temporário
  momento: 'ANTES' | 'DEPOIS';
  enviando?: boolean;
  erro?: boolean;
}

interface GaleriaFotosProps {
  atendimentoId: number;
  momento: 'ANTES' | 'DEPOIS';
  fotosIniciais: Foto[];
  onUploadSuccess?: () => void;
  somenteLeitura?: boolean;
}

const GaleriaFotos: React.FC<GaleriaFotosProps> = ({ 
  atendimentoId, momento, fotosIniciais, onUploadSuccess, somenteLeitura 
}) => {
  const [fotos, setFotos] = useState<Foto[]>(
    fotosIniciais.filter((f) => f.momento === momento)
  );
  
  // Estado para controlar qual foto está sendo visualizada em tela cheia
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);

  React.useEffect(() => {
    setFotos(fotosIniciais.filter((f) => f.momento === momento));
  }, [fotosIniciais, momento]);

  const tirarFoto = async () => {
    if (fotos.length >= 5) return; // RN-09: Limite de 5 fotos

    try {
      const cameraPhoto = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!cameraPhoto.webPath) return;

      const novaFoto: Foto = {
        arquivo: cameraPhoto.webPath,
        momento,
        enviando: true,
      };

      setFotos((prev) => [...prev, novaFoto]);

      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();

      try {
        const result = await uploadFotos(atendimentoId, momento, blob);
        const fotoSalva = result[0];
        
        setFotos((prev) => 
          prev.map((f) => f.arquivo === cameraPhoto.webPath ? { ...fotoSalva, enviando: false } : f)
        );
        
        if (onUploadSuccess) onUploadSuccess();
      } catch (e) {
        console.error('Erro no upload:', e);
        setFotos((prev) => 
          prev.map((f) => f.arquivo === cameraPhoto.webPath ? { ...f, enviando: false, erro: true } : f)
        );
      }
    } catch (e) {
      console.log('Captura cancelada:', e);
    }
  };

  return (
    <div style={styles.container}>
      {/* Exibição das Miniaturas conforme as fotos enviadas */}
      {fotos.map((foto, idx) => (
        <div 
          key={foto.id || `temp-${idx}`} 
          style={{ ...styles.thumbWrapper, cursor: 'pointer' }} 
          onClick={() => setFotoSelecionada(foto.arquivo)} // Clique para expandir
        >
          <img 
            src={foto.arquivo} 
            style={{ ...styles.thumb, opacity: foto.enviando ? 0.5 : 1 }} 
            alt={`Evidência ${idx + 1}`} 
          />
          
          {foto.enviando && (
            <div style={styles.overlay}>
              <IonSpinner name="crescent" style={{ color: '#fff' }} />
            </div>
          )}
          {foto.erro && (
            <div style={styles.overlay}>
              <span style={{ color: 'var(--lm-red)', fontSize: 24, fontWeight: 'bold' }}>✖</span>
            </div>
          )}
        </div>
      ))}

      {/* Botão de Adição (Estilo industrial da sua branch) */}
      {!somenteLeitura && fotos.length < 5 && (
        <button style={styles.btnAdd} onClick={tirarFoto}>
          <IonIcon icon={addOutline} style={{ fontSize: 32 }} />
        </button>
      )}

      {/* Modal para Visualização em Tela Cheia (Solicitação do usuário) */}
      <IonModal 
        isOpen={!!fotoSelecionada} 
        onDidDismiss={() => setFotoSelecionada(null)}
        style={{ '--background': 'rgba(0,0,0,0.9)' }}
      >
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': '#000', '--color': '#fff' }}>
            <IonTitle>Visualizar Evidência</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setFotoSelecionada(null)}>
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ '--background': '#000' }}>
          <div style={styles.modalContent}>
            <img 
              src={fotoSelecionada || ''} 
              style={styles.fullImage} 
              alt="Evidência ampliada" 
            />
          </div>
        </IonContent>
      </IonModal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    paddingBottom: 8,
    alignItems: 'center',
    minHeight: 84,
  },
  thumbWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    flexShrink: 0,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--lm-border)',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
  },
  btnAdd: {
    width: 80,
    height: 80,
    flexShrink: 0,
    borderRadius: 12,
    border: '2px dashed var(--lm-border)',
    background: 'var(--lm-card)',
    color: 'var(--lm-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  modalContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    background: '#000'
  },
  fullImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  }
};

export default GaleriaFotos;