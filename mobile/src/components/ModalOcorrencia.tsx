import React, { useState, useEffect, useRef } from 'react';
import { 
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, 
  IonButton, IonContent, IonTextarea, 
  IonSelect, IonSelectOption 
} from '@ionic/react';
import { Camera, Package, X } from 'lucide-react';
import { getTagsPeca } from '../services/api';

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
  
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFotoArquivo(null);
      setFotoPreview(null);
      setPecaSelecionada(undefined);
    }
  }, [isOpen]);

  const handleSelecionarFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (arquivo) {
      setFotoArquivo(arquivo);
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(arquivo);
    }
  };

  const handleConfirmar = () => {
    if (!pecaSelecionada) return alert("Selecione a peça afetada.");
    if (!descricao) return alert("Descreva o que aconteceu.");
    if (!fotoArquivo) return alert("A foto da evidência é obrigatória.");
    
    onConfirm({ 
      descricao, 
      tag_peca_id: pecaSelecionada, 
      foto: fotoArquivo 
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000', '--border-style': 'none' }}>
          <IonTitle style={{ color: '#fff', fontWeight: 800 }}>Relatar Ocorrência</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose} style={{ '--color': '#666' }}>Cancelar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#000' }}>
        
        {/* Input de arquivo invisível para acionar a câmera */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleSelecionarFoto} 
        />

        {/* Área de Captura de Foto */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div 
            style={fotoPreview ? styles.photoPreviewContainer : styles.photoPlaceholder}
            onClick={() => !fotoPreview && fileInputRef.current?.click()}
          >
            {fotoPreview ? (
              <>
                <img src={fotoPreview} alt="Evidência" style={styles.imgPreview} />
                <button 
                  style={styles.btnRemovePhoto} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setFotoPreview(null); 
                    setFotoArquivo(null); 
                  }}
                >
                  <X size={16} color="#fff" />
                </button>
              </>
            ) : (
              <>
                <Camera size={40} color="var(--lm-primary)" />
                <p style={{ color: '#444', fontSize: '13px', fontWeight: 700, marginTop: '8px' }}>
                  TIRAR FOTO DA AVARIA
                </p>
              </>
            )}
          </div>
        </div>

        {/* Seletor de Peça */}
        <div style={{ marginBottom: '24px' }}>
          <label style={styles.customLabel}>PEÇA AFETADA</label>
          <div style={styles.selectWrapper}>
            <Package size={18} color="var(--lm-primary)" style={{ marginLeft: '12px', zIndex: 10 }} />
            <IonSelect 
              placeholder="Selecione a peça..."
              value={pecaSelecionada}
              onIonChange={e => setPecaSelecionada(e.detail.value)}
              interface="popover"
              style={styles.ionSelectCustom}
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
        <div style={{ marginBottom: '24px' }}>
          <label style={styles.customLabel}>DETALHES</label>
          <IonTextarea 
            placeholder="O que aconteceu exatamente?" 
            value={descricao}
            onIonInput={e => setDescricao(e.detail.value!)}
            rows={4}
            style={styles.textareaCustom}
          />
        </div>

        <button onClick={handleConfirmar} style={styles.btnConfirm}>
          TRAVAR OS E NOTIFICAR GESTOR
        </button>
      </IonContent>
    </IonModal>
  );
};

const styles = {
  photoPlaceholder: { 
    height: '180px', background: '#0a0a0a', borderRadius: '20px', 
    display: 'flex', flexDirection: 'column' as const, 
    alignItems: 'center', justifyContent: 'center', border: '2px dashed #1a1a1a', cursor: 'pointer'
  },
  photoPreviewContainer: { 
    height: '180px', borderRadius: '20px', position: 'relative' as const, overflow: 'hidden' 
  },
  imgPreview: { width: '100%', height: '100%', objectFit: 'cover' as const },
  btnRemovePhoto: { 
    position: 'absolute' as const, top: '10px', right: '10px', background: 'rgba(255,0,0,0.8)', 
    border: 'none', borderRadius: '50%', width: '30px', height: '30px', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20
  },
  customLabel: {
    color: 'var(--lm-primary)', fontSize: '11px', fontWeight: 900, 
    display: 'block', marginBottom: '8px', textTransform: 'uppercase' as const
  },
  selectWrapper: {
    background: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center', minHeight: '60px'
  },
  ionSelectCustom: { color: '#fff', width: '100%', paddingLeft: '8px', fontWeight: '700' },
  textareaCustom: {
    '--background': '#0a0a0a', '--color': '#fff', '--border-radius': '16px',
    border: '1px solid #1a1a1a', minHeight: '100px'
  },
  btnConfirm: { 
    width: '100%', padding: '22px', borderRadius: '20px', background: '#ff3b30', 
    color: '#fff', fontWeight: 900, border: 'none', textTransform: 'uppercase' as const,
    boxShadow: '0 10px 30px rgba(255, 59, 48, 0.2)'
  }
};

export default ModalOcorrencia;