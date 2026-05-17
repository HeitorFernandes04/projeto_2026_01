import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { checkmarkOutline } from 'ionicons/icons';
import { getEstabelecimento, getVeiculos } from '../../services/api';
import type { Servico } from '../../services/api';
import './Servicos.css';

const Servicos: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const history = useHistory();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selecionado, setSelecionado] = useState<Servico | null>(null);
  const [estabelecimentoNome, setEstabelecimentoNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEstabelecimento(slug)
      .then(e => {
        setEstabelecimentoNome(e.nome_fantasia);
        setServicos(e.servicos.filter(s => s.is_active));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleContinuar = async () => {
    if (!selecionado) return;
    try {
      const veiculos = await getVeiculos();
      if (veiculos.length === 0) {
        history.push('/veiculo/novo', { next: 'agendamento', slug, servico: selecionado });
      } else {
        history.push('/agendamento', { slug, servico: selecionado, estabelecimento_nome: estabelecimentoNome });
      }
    } catch {
      history.push('/agendamento', { slug, servico: selecionado, estabelecimento_nome: estabelecimentoNome });
    }
  };

  return (
    <IonPage className="sv-page">
      <IonHeader className="ion-no-border sv-header">
        <IonToolbar className="sv-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mapa" text="Voltar" className="sv-back-button" />
          </IonButtons>
          <IonTitle className="sv-title">Serviços</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding sv-content">
        {estabelecimentoNome && (
          <p className="sv-estab">{estabelecimentoNome}</p>
        )}

        {loading && <p className="sv-carregando">Carregando serviços...</p>}

        {servicos.map(s => (
          <div
            key={s.id}
            className={`sv-card ${selecionado?.id === s.id ? 'sv-card-ativo' : ''}`}
            onClick={() => setSelecionado(s)}
          >
            <div className="sv-card-header">
              <span className="sv-nome">{s.nome}</span>
              <div className={`sv-radio ${selecionado?.id === s.id ? 'sv-radio-ativo' : ''}`}>
                {selecionado?.id === s.id && (
                  <IonIcon icon={checkmarkOutline} className="sv-check-icon" />
                )}
              </div>
            </div>
            <p className="sv-descricao">{s.descricao}</p>
            <div className="sv-footer">
              <span className="sv-preco">R$ {Number(s.preco).toFixed(2)}</span>
              <span className="sv-duracao">{s.duracao_estimada_min} min</span>
            </div>
          </div>
        ))}
      </IonContent>

      <div className="sv-checkout">
        <div className="sv-checkout-info">
          <div className="sv-checkout-total">
            <span className="sv-checkout-total-label">Total</span>
            <span className="sv-checkout-total-valor">
              R$ {selecionado ? Number(selecionado.preco).toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="sv-checkout-duracao">
            {selecionado ? `${selecionado.duracao_estimada_min} min estimativa` : '--'}
          </div>
        </div>
        <button 
          className="sv-btn-continuar" 
          disabled={!selecionado} 
          onClick={handleContinuar}
        >
          Continuar
        </button>
      </div>
    </IonPage>
  );
};

export default Servicos;
