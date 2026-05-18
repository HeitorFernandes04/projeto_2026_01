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
  'Amarelo', 'Outro',
];

const REGEX_TRADICIONAL = /^[A-Z]{3}[0-9]{4}$/;
const REGEX_MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

function isPlacaValida(placa: string): boolean {
  const clean = placa.replace('-', '');
  return REGEX_TRADICIONAL.test(clean) || REGEX_MERCOSUL.test(clean);
}

const SeuVeiculo: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const isEdit = !!id && id !== 'novo';

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('Preto');
  const [placaErro, setPlacaErro] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setPlaca('');
    setMarca('');
    setModelo('');
    setCor('Preto');
    setPlacaErro('');
  };

  useIonViewWillEnter(() => {
    if (isEdit) {
      getVeiculo(Number(id))
        .then(v => {
          let rawPlaca = v.placa.toUpperCase();
          if (rawPlaca.length === 7) {
            const isMercosul = isNaN(Number(rawPlaca[4]));
            if (!isMercosul) {
              rawPlaca = rawPlaca.slice(0, 3) + '-' + rawPlaca.slice(3);
            }
          }
          setPlaca(rawPlaca);
          setMarca(v.marca);
          setModelo(v.modelo);
          setCor(v.cor);
        })
        .catch(() => history.goBack());
    }
  });

  useIonViewWillLeave(() => {
    resetForm();
  });


  const handlePlacaInput = (valor: string) => {
    let clean = valor.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length > 7) clean = clean.slice(0, 7);
    
    let formatted = clean;
    if (clean.length > 3) {
      const isMercosul = clean.length >= 5 && isNaN(Number(clean[4]));
      if (!isMercosul && !isNaN(Number(clean[3]))) {
        formatted = clean.slice(0, 3) + '-' + clean.slice(3);
      }
    }
    
    setPlaca(formatted);
    if (clean && !isPlacaValida(clean)) {
      setPlacaErro('Placa inválida. Ex: ABC-1234 ou ABC1A23');
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
    const cleanPlaca = placa.replace('-', '');
    try {
      let veiculoSalvo;
      if (isEdit) {
        veiculoSalvo = await updateVeiculo(Number(id), { placa: cleanPlaca, marca, modelo, cor });
      } else {
        const temAgendamento = localStorage.getItem('lm_agendamento_temporario') || localStorage.getItem('lm_agendamento_pendente');
        let slug = '';
        if (temAgendamento) {
          const agendamentoData = JSON.parse(temAgendamento);
          slug = agendamentoData.slug;
        }
        veiculoSalvo = await createVeiculo({ placa: cleanPlaca, marca, modelo, cor, estabelecimento_slug: slug });
      }
      
      if (!veiculoSalvo || !veiculoSalvo.id) {
         veiculoSalvo = { id: isEdit ? Number(id) : 999, placa: cleanPlaca, marca, modelo, cor };
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
                maxlength={8}
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