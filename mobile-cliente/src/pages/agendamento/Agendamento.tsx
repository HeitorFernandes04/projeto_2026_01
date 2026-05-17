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
  IonAlert,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { getDisponibilidade, getVeiculos } from '../../services/api';
import type { Disponibilidade, Servico, Veiculo } from '../../services/api';
import './Agendamento.css';

interface LocationState {
  slug: string;
  servico: Servico;
  estabelecimento_nome: string;
}

function dataHoje(): string {
  return new Date().toISOString().split('T')[0];
}

const Agendamento: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const { slug, servico, estabelecimento_nome } = location.state ?? {};

  const [data, setData] = useState(dataHoje());
  const [horarios, setHorarios] = useState<Disponibilidade[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [showAlerta, setShowAlerta] = useState(false);

  useEffect(() => {
    getVeiculos()
      .then(vs => setVeiculo(vs[0] ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug || !servico) return;
    setHorarioSelecionado('');
    getDisponibilidade(slug, servico.id, data)
      .then(setHorarios)
      .catch(() => setHorarios([]));
  }, [slug, servico, data]);

  const handleFinalizar = () => {
    if (!horarioSelecionado || !veiculo || !servico) return;
    history.push('/agendamento/confirmacao', {
      slug,
      servico,
      estabelecimento_nome,
      data,
      horario: horarioSelecionado,
      veiculo,
    });
  };

  const isFormValido = !!horarioSelecionado && !!veiculo;

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="agend-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mapa" text="Voltar" />
          </IonButtons>
          <IonTitle className="agend-title">Agendamento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Resumo */}
        <div className="lm-card agend-resumo">
          <p className="agend-resumo-label">Resumo</p>
          <p className="agend-resumo-item">📍 {estabelecimento_nome}</p>
          <p className="agend-resumo-item">🔧 {servico?.nome}</p>
          <p className="agend-resumo-preco">R$ {Number(servico?.preco ?? 0).toFixed(2)}</p>
        </div>

        {/* Data */}
        <p className="agend-section-label">📅 Data</p>
        <input
          type="date"
          className="agend-date-input"
          value={data}
          min={dataHoje()}
          onChange={e => setData(e.target.value)}
        />

        {/* Horários */}
        <p className="agend-section-label">🕐 Horário</p>
        {horarios.length === 0 ? (
          <p className="agend-sem-horarios">Nenhum horário disponível para esta data.</p>
        ) : (
          <div className="agend-horarios-grid">
            {horarios.map(h => (
              <button
                key={h.horario}
                disabled={!h.disponivel}
                className={`agend-horario-chip ${
                  h.disponivel
                    ? horarioSelecionado === h.horario
                      ? 'chip-ativo'
                      : 'chip-disponivel'
                    : 'chip-indisponivel'
                }`}
                onClick={() => h.disponivel && setHorarioSelecionado(h.horario)}
              >
                {h.horario}
              </button>
            ))}
          </div>
        )}

        {!veiculo && (
          <p className="agend-aviso">
            Você não tem veículo cadastrado.{' '}
            <button
              className="agend-link"
              onClick={() => history.push('/veiculo/novo')}
            >
              Cadastrar agora
            </button>
          </p>
        )}
      </IonContent>

      <div className="agend-footer">
        <IonButton
          className="lm-btn-primary"
          expand="block"
          disabled={!isFormValido}
          onClick={handleFinalizar}
        >
          {loading ? 'Aguarde...' : 'Finalizar Agendamento'}
        </IonButton>
      </div>

      <IonAlert
        isOpen={showAlerta}
        header="Horário indisponível"
        message="Este horário acabou de ser ocupado. Por favor, selecione outro."
        buttons={['OK']}
        onDidDismiss={() => setShowAlerta(false)}
      />
    </IonPage>
  );
};

export default Agendamento;
