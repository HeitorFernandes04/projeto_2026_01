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
  IonAlert,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { time, calendar, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { getDisponibilidade, getVeiculos } from '../../services/api';
import type { Disponibilidade, Servico, Veiculo } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Agendamento.css';

interface LocationState {
  slug: string;
  servico: Servico;
  estabelecimento_nome: string;
}

function dataHojeStr(): string {
  return new Date().toISOString().split('T')[0];
}

const Agendamento: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const { token } = useAuth();
  const { slug, servico, estabelecimento_nome } = location.state ?? {};

  const [data, setData] = useState(dataHojeStr());
  const [horarios, setHorarios] = useState<Disponibilidade[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [showAlerta, setShowAlerta] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para o Calendário Mensal
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    // Buscar veículos apenas se o usuário estiver logado
    if (token && token !== 'null' && token !== 'undefined') {
      getVeiculos()
        .then(vs => {
          if (vs.length === 0) {
            // Opção A: Redireciona imediatamente para cadastrar veículo
            // Não salvamos no localStorage para que o goBack() de SeuVeiculo volte para cá
            history.push('/veiculo/novo');
          } else {
            setVeiculo(vs[0] ?? null);
          }
        })
        .catch(() => {});
    } else {
      // Limpa o estado do veículo se não estiver autenticado
      setVeiculo(null);
    }
  }, [token, history]);


  useEffect(() => {
    if (!slug || !servico) return;
    setHorarioSelecionado('');
    getDisponibilidade(slug, servico.id, data)
      .then(setHorarios)
      .catch(() => setHorarios([]));
  }, [slug, servico, data]);

  const handleFinalizar = () => {
    if (!horarioSelecionado || !servico) return;

    setLoading(true);

    const agendamentoData = {
      slug,
      servico,
      estabelecimento_nome,
      data,
      horario: horarioSelecionado,
      veiculo,
    };

    // Fricção Zero: Se não logado, salva state e vai pro login via whatsapp
    if (!token || token === 'null' || token === 'undefined') {
      localStorage.setItem('lm_agendamento_pendente', JSON.stringify(agendamentoData));
      history.push('/auth');
      setLoading(false);
      return;
    }


    // Se logado mas sem veículo cadastrado
    if (!veiculo) {
      history.push('/veiculo/novo', { next: 'agendamento', ...agendamentoData });
      setLoading(false);
      return;
    }

    // Com veículo, prossegue para confirmação
    history.push('/agendamento/confirmacao', agendamentoData);
    setLoading(false);
  };

  const isFormValido = !!horarioSelecionado; // Habilita o botão apenas com a seleção do horário

  // Lógica do Calendário
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const formatMonthYear = (d: Date) => {
    const m = d.toLocaleString('pt-BR', { month: 'long' });
    return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + d.getFullYear();
  };

  const isDayDisabled = (day: number) => {
    const d = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const formatDateStr = (y: number, m: number, d: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  };

  return (
    <IonPage className="ag-page">
      <IonHeader className="ion-no-border ag-header">
        <IonToolbar className="ag-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/mapa" text="" className="ag-back-button" />
          </IonButtons>
          <IonTitle className="ag-title">Agendamento</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding ag-content">
        {/* Card de Resumo */}
        <div className="ag-resumo-card">
          <h2 className="ag-resumo-title">Resumo</h2>
          <div className="ag-resumo-row">
            <span className="ag-resumo-label">Estabelecimento</span>
            <span className="ag-resumo-value">{estabelecimento_nome}</span>
          </div>
          <div className="ag-resumo-row">
            <span className="ag-resumo-label">Serviços</span>
            <span className="ag-resumo-value">{servico?.nome}</span>
          </div>
          <div className="ag-resumo-row" style={{ marginTop: '8px' }}>
            <span className="ag-resumo-total-label">Total</span>
            <span className="ag-resumo-total-value">R$ {Number(servico?.preco ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Seção Data (Calendário Grade Mensal) */}
        <h2 className="ag-section-title">
          <IonIcon icon={calendar} className="ag-section-icon" /> Data
        </h2>

        <div className="ag-calendar fade-in">
          <div className="ag-cal-header">
            <button className="ag-cal-nav-btn" onClick={prevMonth}>
              <IonIcon icon={chevronBackOutline} />
            </button>
            <span className="ag-cal-month">{formatMonthYear(currentMonth)}</span>
            <button className="ag-cal-nav-btn" onClick={nextMonth}>
              <IonIcon icon={chevronForwardOutline} />
            </button>
          </div>

          <div className="ag-cal-weekdays">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <span key={i} className="ag-cal-weekday">{d}</span>
            ))}
          </div>

          <div className="ag-cal-days">
            {/* Espaços em branco do início do mês */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="ag-cal-day empty" />
            ))}

            {/* Dias do mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateStr(year, month, day);
              const disabled = isDayDisabled(day);
              const selected = data === dateStr;

              return (
                <button
                  key={day}
                  disabled={disabled}
                  className={`ag-cal-day ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}`}
                  onClick={() => setData(dateStr)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seção Horário (Grade de Chips) */}
        <h2 className="ag-section-title">
          <IonIcon icon={time} className="ag-section-icon" /> Horário
        </h2>

        {horarios.length === 0 ? (
          <p className="ag-sem-horarios">Nenhum horário disponível para esta data.</p>
        ) : (
          <div className="ag-horarios-grid">
            {horarios.map(h => {
              const isSelected = horarioSelecionado === h.horario;
              return (
                <button
                  key={h.horario}
                  disabled={!h.disponivel}
                  className={`ag-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => h.disponivel && setHorarioSelecionado(h.horario)}
                >
                  {h.horario}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ height: '120px' }} />
      </IonContent>

      {/* Footer Sticky de Ação */}
      <div className="ag-footer">
        <button
          className={`ag-btn-finalizar ${isFormValido ? 'enabled-action' : ''}`}
          disabled={!isFormValido || loading}
          onClick={handleFinalizar}
        >
          {loading ? 'Aguarde...' : 'Finalizar Agendamento'}
        </button>
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
