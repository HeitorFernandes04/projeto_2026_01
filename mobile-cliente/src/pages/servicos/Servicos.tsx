import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
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
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="servicos-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mapa" text="Voltar" />
          </IonButtons>
          <IonTitle className="servicos-title">Serviços</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {estabelecimentoNome && (
          <p className="servicos-estab">{estabelecimentoNome}</p>
        )}

        {loading && <p className="servicos-carregando">Carregando serviços...</p>}

        {servicos.map(s => (
          <div
            key={s.id}
            className={`lm-card servico-card ${selecionado?.id === s.id ? 'servico-card-ativo' : ''}`}
            onClick={() => setSelecionado(s)}
          >
            <div className="servico-card-header">
              <span className="servico-nome">{s.nome}</span>
              <div className={`servico-radio ${selecionado?.id === s.id ? 'radio-ativo' : ''}`} />
            </div>
            <p className="servico-descricao">{s.descricao}</p>
            <div className="servico-footer">
              <span className="servico-preco">R$ {Number(s.preco).toFixed(2)}</span>
              <span className="servico-duracao">{s.duracao_estimada_min} min</span>
            </div>
          </div>
        ))}
      </IonContent>

      {selecionado && (
        <div className="servicos-footer">
          <div className="servicos-total">
            <span className="total-label">Total:</span>
            <span className="total-valor">R$ {Number(selecionado.preco).toFixed(2)}</span>
            <span className="total-duracao">| {selecionado.duracao_estimada_min} min</span>
          </div>
          <IonButton className="lm-btn-primary" expand="block" onClick={handleContinuar}>
            Continuar
          </IonButton>
        </div>
      )}
    </IonPage>
  );
};

export default Servicos;
