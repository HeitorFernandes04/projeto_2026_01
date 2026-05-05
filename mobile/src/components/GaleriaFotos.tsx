import React, { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { uploadFotos } from '../services/api';
import { 
  IonModal, IonSpinner, IonIcon, IonHeader, 
  IonToolbar, IonTitle, IonButtons, IonButton, IonContent 
} from '@ionic/react';
import { closeOutline, addOutline } from 'ionicons/icons';

// Representa uma foto staged localmente (não enviada ao servidor ainda)
interface FotoLocal {
  blobUrl: string;   // URL object temporária para preview
  blob: Blob;        // Blob bruto pronto para upload
}

// Representa uma foto já salva no servidor
interface FotoSalva {
  id?: number;
  arquivo: string;
  momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO';
}

interface GaleriaFotosProps {
  ordemServicoId: number;
  momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO';
  fotosIniciais: FotoSalva[];
  onUploadSuccess?: () => void;
  somenteLeitura?: boolean;
  // Callback para o componente pai acionar o envio das fotos em staging
  onFotosStaged?: (blobs: Blob[], momento: string) => void;
}

const GaleriaFotos = React.forwardRef<{ enviarFotosStaged: () => void }, GaleriaFotosProps>(({ 
  ordemServicoId, momento, fotosIniciais, onUploadSuccess, somenteLeitura, onFotosStaged
}, ref) => {
  // Fotos já confirmadas no servidor (vindas da API)
  const [fotosSalvas, setFotosSalvas] = useState<FotoSalva[]>(
    fotosIniciais.filter((f) => f.momento === momento)
  );
  // Fotos capturadas localmente aguardando confirmação (staging)
  const [fotosStaged, setFotosStaged] = useState<FotoLocal[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);

  const totalFotos = fotosSalvas.length + fotosStaged.length;
  const limiteAtingido = totalFotos >= 5;

  React.useEffect(() => {
    setFotosSalvas(fotosIniciais.filter((f) => f.momento === momento));
  }, [fotosIniciais, momento]);

  const tirarFoto = async () => {
    if (limiteAtingido || somenteLeitura) return;

    try {
      const cameraPhoto = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (!cameraPhoto.dataUrl) return;

      // Converte DataUrl (Base64) para Blob — compatível com todos os WebViews
      const response = await fetch(cameraPhoto.dataUrl);
      const blob = await response.blob();
      // Usa o próprio dataUrl como preview (evita ObjectURL fantasma em WebView nativo)
      const blobUrl = cameraPhoto.dataUrl;

      const novaFoto: FotoLocal = { blobUrl, blob };
      const fotosAtualizadas = [...fotosStaged, novaFoto];
      setFotosStaged(fotosAtualizadas);

      // Notifica o pai com todos os blobs staged atuais
      if (onFotosStaged) {
        onFotosStaged(fotosAtualizadas.map((f) => f.blob), momento);
      }
    } catch (e) {
      console.log('Captura cancelada:', e);
    }
  };

  // Remove uma foto staged (ainda não enviada ao servidor)
  const removerFotoStaged = (index: number) => {
    const fotos = [...fotosStaged];
    fotos.splice(index, 1);
    setFotosStaged(fotos);
    if (onFotosStaged) {
      onFotosStaged(fotos.map((f) => f.blob), momento);
    }
  };

  // Envia todas as fotos staged de uma vez ao servidor
  const enviarFotosStaged = async () => {
    if (fotosStaged.length === 0 || enviando) return;
    setEnviando(true);
    try {
      console.log(`Enviando ${fotosStaged.length} fotos para OS ${ordemServicoId}, momento: ${momento}`);
      await uploadFotos(ordemServicoId, momento, fotosStaged.map((f) => f.blob));
      // Limpa o staging após sucesso (sem revokeObjectURL porque usamos DataUrl)
      setFotosStaged([]);
      if (onUploadSuccess) onUploadSuccess();
      console.log('Upload de fotos concluído com sucesso');
    } catch (e: any) {
      console.error('Erro no upload em lote:', e);
      
      // Tratamento detalhado de erros
      let errorMessage = 'Erro ao enviar fotos. Tente novamente.';
      
      if (e.response) {
        // Erro HTTP do backend
        const status = e.response.status;
        const data = e.response.data;
        
        if (status === 400) {
          errorMessage = data?.detail || 'Formato de arquivo inválido ou dados incorretos.';
        } else if (status === 401) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (status === 403) {
          errorMessage = 'Sem permissão para enviar fotos.';
        } else if (status === 413) {
          errorMessage = 'Arquivos muito grandes. Reduza a qualidade das fotos.';
        } else if (status >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente em alguns instantes.';
        }
      } else if (e.message) {
        // Erro de rede ou JavaScript
        errorMessage = e.message.includes('NetworkError') 
          ? 'Sem conexão com o servidor. Verifique sua internet.'
          : e.message;
      }
      
      alert(`Falha no Upload: ${errorMessage}`);
    } finally {
      setEnviando(false);
    }
  };

  // Expõe o método de envio ao componente pai via ref imperativo, se necessário
  // (Componentes pais com lógica de confirmar etapa devem chamar enviarFotosStaged)
  React.useImperativeHandle(ref, () => ({ enviarFotosStaged }));

  return (
    <div style={styles.container}>
      {/* Grade de 5 slots fixos */}
      {Array.from({ length: 5 }).map((_, slotIndex) => {
        // Determina qual foto ocupa este slot (salvas primeiro, depois staged)
        const fotoSalva = fotosSalvas[slotIndex];
        const indexStaged = slotIndex - fotosSalvas.length;
        const fotoStaged = !fotoSalva && indexStaged >= 0 ? fotosStaged[indexStaged] : undefined;
        const temFoto = !!(fotoSalva || fotoStaged);
        const srcPreview = fotoSalva?.arquivo ?? fotoStaged?.blobUrl ?? null;
        const ehStaged = !!fotoStaged;

        return (
          <div key={`slot-${slotIndex}`} style={{ ...styles.thumbWrapper, position: 'relative' }}>
            {temFoto ? (
              <>
                {/* Miniatura da foto */}
                <img
                  src={srcPreview!}
                  style={{ ...styles.thumb, opacity: ehStaged ? 0.85 : 1, cursor: 'pointer' }}
                  alt={`Foto ${slotIndex + 1}`}
                  onClick={() => setFotoSelecionada(srcPreview!)}
                  onError={(e) => {
                    console.error('Erro ao carregar imagem:', srcPreview, e);
                    // Tenta adicionar o domínio se for URL relativa
                    const img = e.target as HTMLImageElement;
                    if (srcPreview && !srcPreview.startsWith('http') && !srcPreview.startsWith('data:')) {
                      const urlCompleta = `http://127.0.0.1:8000${srcPreview}`;
                      console.log('Tentando URL completa:', urlCompleta);
                      img.src = urlCompleta;
                    } else {
                      // Se já falhou com URL completa, mostra placeholder
                      img.style.background = 'var(--lm-card)';
                      img.alt = 'Erro ao carregar';
                    }
                  }}
                />
                {/* Badge amarelo para fotos ainda não enviadas (staged) */}
                {ehStaged && <div style={styles.badgePendente} title="Aguardando confirmação" />}
                {/* Botão X — só em fotos staged pois as salvas não podem ser removidas aqui */}
                {ehStaged && !somenteLeitura && (
                  <button
                    style={styles.btnTrash}
                    onClick={(e) => { e.stopPropagation(); removerFotoStaged(indexStaged); }}
                    title="Remover foto"
                  >
                    <IonIcon icon={closeOutline} style={{ fontSize: 14, color: '#fff' }} />
                  </button>
                )}
              </>
            ) : (
              /* Slot vazio — clique abre a câmera */
              !somenteLeitura ? (
                <button
                  style={styles.btnSlotVazio}
                  onClick={tirarFoto}
                  title={`Adicionar foto ${slotIndex + 1}`}
                >
                  <IonIcon icon={addOutline} style={{ fontSize: 28, color: 'var(--lm-primary)' }} />
                </button>
              ) : (
                <div style={styles.btnSlotVazio} />
              )
            )}
          </div>
        );
      })}

      {/* Botão de envio em lote — só aparece se houver fotos staged */}
      {fotosStaged.length > 0 && !somenteLeitura && (
        <button style={styles.btnEnviar} onClick={enviarFotosStaged} disabled={enviando}>
          {enviando
            ? <IonSpinner name="crescent" style={{ color: '#fff' }} />
            : `Confirmar ${fotosStaged.length} foto(s)`}
        </button>
      )}

      {/* Modal para visualização em tela cheia */}
      <IonModal
        isOpen={!!fotoSelecionada}
        onDidDismiss={() => setFotoSelecionada(null)}
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
            <img src={fotoSelecionada || ''} style={styles.fullImage} alt="Evidência ampliada" />
          </div>
        </IonContent>
      </IonModal>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
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
    cursor: 'pointer',
  },
  btnTrash: {
    position: 'absolute',
    top: 4,
    right: 4,
    background: 'rgba(220,38,38,0.85)',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
  },
  badgePendente: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#f59e0b',
  },
  btnSlotVazio: {
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
  btnEnviar: {
    flex: '1 0 100%',
    padding: '12px',
    borderRadius: 12,
    background: 'var(--lm-primary)',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
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