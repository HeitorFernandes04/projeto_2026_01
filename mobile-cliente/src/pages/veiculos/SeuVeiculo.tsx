import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  useIonViewWillEnter,
  useIonViewWillLeave,
  IonIcon,
} from '@ionic/react';
import { carOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { getVeiculo, createVeiculo, updateVeiculo } from '../../services/api';
// Importação do arquivo de estilo modular e exclusivo da tela de cadastro
import './SeuVeiculo.css';

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
    const upper = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setPlaca(upper);
    if (upper && !isPlacaValida(upper)) {
      setPlacaErro('Placa inválida. Ex: ABC1234 ou ABC1D23');
    } else {
      setPlacaErro('');
    }
  };

  const isFormValido =
    isPlacaValida(placa) && marca.trim() !== '' && modelo.trim() !== '' && cor !== '';

  const processarRedirecionamento = (veiculoSalvo: { id?: number; placa?: string; marca?: string; modelo?: string; cor?: string }) => {
    const temAgendamento = localStorage.getItem('lm_agendamento_temporario') || localStorage.getItem('lm_agendamento_pendente');
    
    if (temAgendamento) {
      const agendamentoData = JSON.parse(temAgendamento);
      history.replace('/agendamento/confirmacao', { ...agendamentoData, veiculo: veiculoSalvo });
    } else {
      history.goBack();
    }
  };

  const handleSalvar = async () => {
    if (!isFormValido || loading) return;
    setLoading(true);
    try {
      let veiculoSalvo;
      if (isEdit) {
        veiculoSalvo = await updateVeiculo(Number(id), { placa, marca, modelo, cor });
      } else {
        const temAgendamento = localStorage.getItem('lm_agendamento_temporario') || localStorage.getItem('lm_agendamento_pendente');
        let slug = '';
        if (temAgendamento) {
          const agendamentoData = JSON.parse(temAgendamento);
          slug = agendamentoData.slug;
        }
        veiculoSalvo = await createVeiculo({ placa, marca, modelo, cor, estabelecimento_slug: slug });
      }
      
      if (!veiculoSalvo || !veiculoSalvo.id) {
         veiculoSalvo = { id: isEdit ? Number(id) : 999, placa, marca, modelo, cor };
      }
      
      processarRedirecionamento(veiculoSalvo);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="veiculo-reg-page">
      {/* Header unificado com fundo Slate (#1E293B) do Figma */}
      <IonHeader className="ion-no-border veiculo-reg-header">
        <IonToolbar className="veiculo-reg-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/veiculos" text="" className="veiculo-reg-back-button" />
          </IonButtons>
          <IonTitle className="veiculo-reg-title">Seu Veículo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="veiculo-reg-content" scrollY={true}>
        <div className="veiculo-reg-container">
          
          {/* Box de Carro com preenchimento translúcido e proporções do Figma */}
          <div className="veiculo-reg-emoji-box">
            <IonIcon icon={carOutline} />
          </div>

          {/* Form Groups Empilhados */}
          <div className="veiculo-reg-form-group">
            <label className="veiculo-reg-label">Placa</label>
            <IonItem className="veiculo-reg-input-item" lines="none">
              <IonInput
                value={placa}
                placeholder="ABC-1234"
                maxlength={7}
                onIonInput={e => handlePlacaInput(String(e.detail.value ?? ''))}
              />
            </IonItem>
            {placaErro && <p className="veiculo-reg-erro-text">{placaErro}</p>}
          </div>

          <div className="veiculo-reg-form-group">
            <label className="veiculo-reg-label">Marca</label>
            <IonItem className="veiculo-reg-input-item" lines="none">
              <IonInput
                value={marca}
                placeholder="Toyota"
                onIonInput={e => setMarca(String(e.detail.value ?? ''))}
              />
            </IonItem>
          </div>

          <div className="veiculo-reg-form-group">
            <label className="veiculo-reg-label">Modelo</label>
            <IonItem className="veiculo-reg-input-item" lines="none">
              <IonInput
                value={modelo}
                placeholder="Corolla"
                onIonInput={e => setModelo(String(e.detail.value ?? ''))}
              />
            </IonItem>
          </div>

          <div className="veiculo-reg-form-group">
            <label className="veiculo-reg-label">Cor</label>
            <IonItem className="veiculo-reg-input-item" lines="none">
              <IonSelect
                value={cor}
                placeholder="Preto"
                onIonChange={e => setCor(e.detail.value)}
                interface="popover" /* Transforma a lista de cores em um menu compacto suspenso */
              >
                {CORES.map(c => (
                  <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </div>

        </div>
      </IonContent>

      {/* Rodapé Fixo com Fundo Slate e Botão de Ação Primária */}
      <div className="veiculo-reg-footer">
        <button
          className="veiculo-reg-btn-primary"
          disabled={!isFormValido || loading}
          onClick={handleSalvar}
        >
          {loading ? 'Processando...' : isEdit ? 'Atualizar Veículo' : 'Salvar Veículo'}
        </button>
      </div>
    </IonPage>
  );
};

export default SeuVeiculo;