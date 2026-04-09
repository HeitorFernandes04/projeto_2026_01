import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadFotos } from '../services/api';
import { IonModal, IonSpinner, IonIcon, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

interface Foto {
  id?: number;
  arquivo: string; // URL ou Blob local
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

const GaleriaFotos: React.FC<GaleriaFotosProps> = ({ atendimentoId, momento, fotosIniciais, onUploadSuccess, somenteLeitura }) => {
  const [fotos, setFotos] = useState<Foto[]>(
    fotosIniciais.filter((f) => f.momento === momento)
  );
  
  // Mantive apenas o estado que você já estava usando para o Modal
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);

  React.useEffect(() => {
    setFotos(fotosIniciais.filter((f) => f.momento === momento));
  }, [fotosIniciais, momento]);

  const tirarFoto = async () => {
    if (fotos.length >= 5) return;

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
          prev.map((f) => f === novaFoto ? { ...fotoSalva, enviando: false } : f)
        );
        
        if (onUploadSuccess) onUploadSuccess();
      } catch (e) {
        console.error('Erro no upload', e);
        setFotos((prev) => 
          prev.map((f) => f === novaFoto ? { ...f, enviando: false, erro: true } : f)
        );
      }
    } catch (e) {
      console.log('Câmera cancelada ou erro:', e);
    }
  };

  return (
    <div style={styles.container}>
      {fotos.map((foto, idx) => (
        /* ADICIONADO: onClick para definir a foto que será ampliada */
        <div 
          key={foto.id || `temp-${idx}`} 
          style={{ ...styles.thumbWrapper, cursor: 'pointer' }} 
          onClick={() => setFotoSelecionada(foto.arquivo)}
        >
          <img src={foto.arquivo} style={{ ...styles.thumb, opacity: foto.enviando ? 0.5 : 1 }} alt="" />
          {foto.enviando && (
            <div style={styles.overlay}>
              <IonSpinner name="crescent" style={{ color: '#fff' }} />
            </div>
          )}
          {foto.erro && (
            <div style={styles.overlay}>
              <span style={{ color: '#ef4444', fontSize: 24, fontWeight: 'bold' }}>✖</span>
            </div>
          )}
        </div>
      ))}

  {!somenteLeitura && fotos.length < 5 && (
    <button style={styles.btnAdd} onClick={tirarFoto}>
      <span style={styles.iconAdd}>+</span>
    </button>
  )}

  {fotos.length === 0 && (
    <p style={{ color: '#8899aa', fontSize: 13, alignSelf: 'center', marginLeft: 8, margin: 0 }}>
      Nenhuma foto adicionada.
    </p>
  )}

  {/* MODAL PARA VISUALIZAÇÃO AMPLIADA - Agora funcional via estado fotoSelecionada */}
  <IonModal isOpen={!!fotoSelecionada} onDidDismiss={() => setFotoSelecionada(null)}>
    <IonHeader className="ion-no-border">
      <IonToolbar style={{ '--background': '#000', '--color': '#fff' }}>
        <IonTitle>Visualizar Foto</IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={() => setFotoSelecionada(null)}>
            <IonIcon icon={closeOutline} slot="icon-only" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent style={{ '--background': '#000' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: '#000'
      }}>
        <img 
          src={fotoSelecionada || ''} 
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
          alt="Foto ampliada" 
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
    minHeight: 84, // Garante altura mínima do scroll
  },
  thumbWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    flexShrink: 0,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #1e2d40',
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
    background: 'rgba(0,0,0,0.4)',
  },
  btnAdd: {
    width: 80,
    height: 80,
    flexShrink: 0,
    borderRadius: 12,
    border: '2px dashed #1e2d40',
    background: '#161b27',
    color: '#00b4d8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  iconAdd: {
    fontSize: 32,
    fontWeight: 300,
  },
  modalContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.8)',
    position: 'relative',
  },
  fullImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    objectFit: 'contain',
  },
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 32,
    color: '#fff',
    cursor: 'pointer',
  },
};

export default GaleriaFotos;
