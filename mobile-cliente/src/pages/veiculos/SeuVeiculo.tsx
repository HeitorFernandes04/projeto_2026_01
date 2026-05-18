import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonLabel,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { getVeiculo, createVeiculo, updateVeiculo } from '../../services/api';
import './Veiculos.css';

const CORES = [
  'Preto', 'Branco', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde',
  'Amarelo', 'Laranja', 'Marrom', 'Bege', 'Dourado', 'Roxo', 'Rosa', 'Outra',
];

const REGEX_TRADICIONAL = /^[A-Z]{3}[0-9]{4}$/;
const REGEX_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

function isPlacaValida(placa: string): boolean {
  return REGEX_TRADICIONAL.test(placa) || REGEX_MERCOSUL.test(placa);
}

const SeuVeiculo: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const isEdit = !!id && id !== 'novo';

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [placaErro, setPlacaErro] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setPlaca('');
    setMarca('');
    setModelo('');
    setCor('');
    setPlacaErro('');
  };

  useIonViewWillEnter(() => {
    if (isEdit) {
      getVeiculo(Number(id))
        .then(v => {
          setPlaca(v.placa);
          setMarca(v.marca);
          setModelo(v.modelo);
          setCor(v.cor);
        })
        .catch(() => history.goBack());
    }
  });

  useIonViewWillLeave(() => {
    if (!isEdit) resetForm();
  });

  const handlePlacaInput = (valor: string) => {
    const upper = valor.toUpperCase();
    setPlaca(upper);
    if (upper && !isPlacaValida(upper)) {
      setPlacaErro('Placa inválida. Ex: ABC1234 ou ABC1D23');
    } else {
      setPlacaErro('');
    }
  };

  const isFormValido =
    isPlacaValida(placa) && marca.trim() !== '' && modelo.trim() !== '' && cor !== '';

  const handleSalvar = async () => {
    if (!isFormValido || loading) return;
    setLoading(true);
    try {
      if (isEdit) {
        await updateVeiculo(Number(id), { placa, marca, modelo, cor });
      } else {
        await createVeiculo({ placa, marca, modelo, cor });
      }
      history.goBack();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="veiculo-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/veiculos" text="Voltar" />
          </IonButtons>
          <IonTitle className="veiculo-title">Seu Veículo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="veiculo-icon-container lm-card">
          <span className="veiculo-emoji">🚗</span>
        </div>

        <IonItem className="lm-input" lines="none">
          <IonLabel position="stacked" className="campo-label">Placa</IonLabel>
          <IonInput
            value={placa}
            placeholder="ABC1234"
            maxlength={7}
            onIonInput={e => handlePlacaInput(String(e.detail.value ?? ''))}
          />
        </IonItem>
        {placaErro && <p className="campo-erro">{placaErro}</p>}

        <IonItem className="lm-input" lines="none">
          <IonLabel position="stacked" className="campo-label">Marca</IonLabel>
          <IonInput
            value={marca}
            placeholder="Toyota"
            onIonInput={e => setMarca(String(e.detail.value ?? ''))}
          />
        </IonItem>

        <IonItem className="lm-input" lines="none">
          <IonLabel position="stacked" className="campo-label">Modelo</IonLabel>
          <IonInput
            value={modelo}
            placeholder="Corolla"
            onIonInput={e => setModelo(String(e.detail.value ?? ''))}
          />
        </IonItem>

        <IonItem className="lm-input" lines="none">
          <IonLabel position="stacked" className="campo-label">Cor</IonLabel>
          <IonSelect
            value={cor}
            placeholder="Selecione a cor"
            onIonChange={e => setCor(e.detail.value)}
          >
            {CORES.map(c => (
              <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonButton
          className="lm-btn-primary"
          expand="block"
          disabled={!isFormValido || loading}
          onClick={handleSalvar}
          style={{ marginTop: '24px' }}
        >
          {loading ? 'Salvando...' : isEdit ? 'Atualizar Veículo' : 'Salvar Veículo'}
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default SeuVeiculo;
