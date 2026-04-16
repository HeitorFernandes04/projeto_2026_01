import React, { useState, useEffect } from 'react';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonContent, IonTextarea, 
  IonSelect, IonSelectOption 
} from '@ionic/react';
import { Camera as LucideCamera, Package, X, ZoomIn } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { getTagsPeca } from '../services/api';
import './ModalOcorrencia.css';

interface TagPeca {
  id: number;
  nome: string;
  categoria: string;
}

interface DadosIncidente {
  descricao: string;
  tag_peca_id: number;
  foto: File | null;
}

interface ModalOcorrenciaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: DadosIncidente) => void;
}

const ModalOcorrencia: React.FC<ModalOcorrenciaProps> = ({ isOpen, onClose, onConfirm }) => {
  const [descricao, setDescricao] = useState('');
  const [pecas, setPecas] = useState<TagPeca[]>([]);
  const [pecaSelecionada, setPecaSelecionada] = useState<number | undefined>(undefined);
  
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [zoomAberto, setZoomAberto] = useState(false);

  const handleSelecionarFoto = async () => {
    try {
      const foto = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (!foto.dataUrl) return;
      setFotoPreview(foto.dataUrl);
      // Converte dataUrl em Blob para envio posterior
      const res = await fetch(foto.dataUrl);
      setFotoBlob(await res.blob());
    } catch (e) {
      console.log('Captura cancelada ou falhou:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const carregarTags = async () => {
        try {
          const data = await getTagsPeca();
          setPecas(data);
        } catch (error) {
          console.error('Erro ao buscar peças:', error);
        }
      };
      carregarTags();
    } else {
      // Resetar estados ao fechar o modal
      setDescricao('');
      setFotoBlob(null);
      setFotoPreview(null);
      setPecaSelecionada(undefined);
    }
  }, [isOpen]);



  const handleConfirmar = () => {
    if (!pecaSelecionada) return alert('Selecione a peça afetada.');
    if (!descricao) return alert('Descreva o que aconteceu.');
    if (!fotoBlob) return alert('A foto do problema é obrigatória.');
    
    // Converte Blob para File para manter compatibilidade com a interface DadosIncidente
    const fotoFile = new File([fotoBlob], 'evidencia.jpg', { type: 'image/jpeg' });
    onConfirm({ 
      descricao, 
      tag_peca_id: pecaSelecionada, 
      foto: fotoFile
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000', '--border-style': 'none' }}>
          <IonTitle style={{ color: '#fff', fontWeight: 800 }}>Relatar Problema</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ '--color': '#666' }}>Cancelar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#000' }}>
        

        {/* Área de Captura de Foto */}
        <div className="mo-photo-area">
          <div 
            className={fotoPreview ? 'mo-photo-preview-container' : 'mo-photo-placeholder'}
            onClick={() => !fotoPreview && handleSelecionarFoto()}
          >
            {fotoPreview ? (
              <>
                <img src={fotoPreview} alt="Evidência" className="mo-img-preview" />
                {/* Botão X para remover e retirar nova foto */}
                <button 
                  className="mo-btn-remove-photo"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setFotoPreview(null); 
                    setFotoBlob(null); 
                  }}
                >
                  <X size={16} color="#fff" />
                </button>
                {/* Botão de zoom para verificar qualidade */}
                <button
                  style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    borderRadius: '50%', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 10
                  }}
                  onClick={(e) => { e.stopPropagation(); setZoomAberto(true); }}
                >
                  <ZoomIn size={14} color="#fff" />
                </button>
              </>
            ) : (
              <>
                <LucideCamera size={40} color="var(--lm-primary)" />
                <p className="mo-photo-hint">TIRAR FOTO DO PROBLEMA</p>
              </>
            )}
          </div>
        </div>

        {/* Modal de zoom da evidência */}
        <IonModal isOpen={zoomAberto} onDidDismiss={() => setZoomAberto(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar style={{ '--background': '#000', '--color': '#fff' }}>
              <IonTitle>Detalhes do Registro</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setZoomAberto(false)}>
                  <X size={20} color="#fff" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ '--background': '#000' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <img src={fotoPreview || ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Zoom evidência" />
            </div>
          </IonContent>
        </IonModal>

        {/* Seletor de Peça */}
        <div className="mo-select-wrapper-outer">
          <label className="mo-custom-label">PEÇA AFETADA</label>
          <div className="mo-select-wrapper">
            <Package size={18} color="var(--lm-primary)" style={{ marginLeft: '12px', zIndex: 10 }} />
            <IonSelect 
              placeholder="Selecione a peça..."
              value={pecaSelecionada}
              onIonChange={e => setPecaSelecionada(e.detail.value)}
              interface="popover"
              className="mo-ion-select"
              toggleIcon="" 
            >
              {pecas.map((p) => (
                <IonSelectOption key={p.id} value={p.id}>
                  {p.nome.toUpperCase()}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>
        </div>

        {/* Campo de Descrição */}
        <div className="mo-textarea-wrapper">
          <label className="mo-custom-label">DETALHES</label>
          <IonTextarea 
            placeholder="O que aconteceu exatamente?" 
            value={descricao}
            onIonInput={e => setDescricao(e.detail.value!)}
            rows={4}
            style={{ '--background': 'var(--lm-card)', '--color': 'var(--lm-text)', '--border-radius': '16px', border: '1px solid var(--lm-border)', minHeight: '100px' }}
          />
        </div>

        <button onClick={handleConfirmar} className="mo-btn-confirm">
          COMUNICAR PROBLEMA E AGUARDAR GESTOR
        </button>
      </IonContent>
    </IonModal>
  );
};

export default ModalOcorrencia;
