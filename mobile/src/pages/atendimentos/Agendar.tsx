import { IonContent, IonPage, IonSpinner, useIonViewWillEnter, IonHeader, IonToolbar, IonTitle, IonButton, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonDatetime, IonText, IonIcon } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getServicos, getHorariosLivres, criarAtendimento } from '../../services/api';
import { arrowBackOutline } from 'ionicons/icons';
import '../../theme/lava-me.css';

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  marca: string;
  cor: string;
  nome_dono: string;
  celular_dono: string;
}

interface Servico {
  id: number;
  nome: string;
  preco: string;
  duracao_estimada_min: number;
}

interface HorarioLivre {
  horario: string;
  disponivel: boolean;
}

const Agendar: React.FC = () => {
  const history = useHistory();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horariosLivres, setHorariosLivres] = useState<HorarioLivre[]>([]);
  const [carregandoServicos, setCarregandoServicos] = useState(true);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    nome_dono: '',
    celular_dono: '',
    placa: '',
    modelo: '',
    marca: '',
    cor: '',
    servico_id: 0,
    data_hora: '',
    observacoes: ''
  });

  useIonViewWillEnter(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    try {
      setCarregandoServicos(true);
      const response = await getServicos();
      setServicos(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      setErro('Não foi possível carregar os serviços.');
    } finally {
      setCarregandoServicos(false);
    }
  };

  const carregarHorariosLivres = async (data: string, servicoId: number) => {
    if (!data || !servicoId) return;
    
    try {
      setCarregandoHorarios(true);
      const response = await getHorariosLivres(data, servicoId);
      setHorariosLivres(response.data);
    } catch (error) {
      console.error('Erro ao carregar horários livres:', error);
      setHorariosLivres([]);
    } finally {
      setCarregandoHorarios(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[] | null | undefined) => {
    const stringValue = Array.isArray(value) ? value[0] : value || '';
    setFormData(prev => ({ ...prev, [field]: stringValue }));
    
    // Se mudou a data ou serviço, recarregar horários
    if (field === 'data_hora' || field === 'servico_id') {
      const data = field === 'data_hora' ? stringValue : formData.data_hora;
      const servicoId = field === 'servico_id' ? parseInt(stringValue) : formData.servico_id;
      if (data && servicoId) {
        carregarHorariosLivres(data.split('T')[0], servicoId);
      }
    }
  };

  const handleCriarAgendamento = async () => {
    // Validação
    if (!formData.nome_dono || !formData.celular_dono || !formData.placa || 
        !formData.modelo || !formData.marca || !formData.cor || 
        !formData.servico_id || !formData.data_hora) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setCriando(true);
      setErro('');
      
      const dados = {
        ...formData,
        servico_id: formData.servico_id,
        iniciar_agora: false
      };

      await criarAtendimento(dados);
      history.push('/atendimentos/hoje');
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      setErro('Não foi possível criar o agendamento. Tente novamente.');
    } finally {
      setCriando(false);
    }
  };

  const voltar = () => {
    history.goBack();
  };

  return (
    <IonPage className="lm-page">
      <IonHeader style={{ background: 'var(--lm-bg)', borderBottom: `1px solid var(--lm-border)` }}>
        <IonToolbar style={{ background: 'transparent' }}>
          <IonTitle style={{ color: 'var(--lm-text)', fontSize: '1.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IonButton
                fill="clear"
                onClick={voltar}
                style={{ 
                  color: 'var(--lm-text)',
                  '--padding-start': '0',
                  '--padding-end': '0',
                  marginRight: '12px'
                }}
              >
                <IonIcon icon={arrowBackOutline} style={{ fontSize: '24px' }} />
              </IonButton>
              <div style={{ fontFamily: 'Inter, Roboto, sans-serif', fontWeight: '700' }}>
                Agendar Serviço
              </div>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
          {carregandoServicos ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="crescent" />
              <p style={{ color: 'var(--lm-text-muted)', marginTop: '16px', fontFamily: 'Inter, Roboto, sans-serif' }}>
                Carregando serviços...
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Dados do Cliente */}
              <div className="lm-card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--lm-text)', margin: '0 0 16px 0', fontFamily: 'Inter, Roboto, sans-serif', fontWeight: '700' }}>
                  Dados do Cliente
                </h3>
                
                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Nome do Cliente
                  </IonLabel>
                  <IonInput
                    value={formData.nome_dono}
                    onIonInput={(e) => handleInputChange('nome_dono', e.detail.value!)}
                    placeholder="Digite o nome completo"
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>

                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Celular
                  </IonLabel>
                  <IonInput
                    value={formData.celular_dono}
                    onIonInput={(e) => handleInputChange('celular_dono', e.detail.value!)}
                    placeholder="(00) 00000-0000"
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>
              </div>

              {/* Dados do Veículo */}
              <div className="lm-card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--lm-text)', margin: '0 0 16px 0', fontFamily: 'Inter, Roboto, sans-serif', fontWeight: '700' }}>
                  Dados do Veículo
                </h3>
                
                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Placa
                  </IonLabel>
                  <IonInput
                    value={formData.placa}
                    onIonInput={(e) => handleInputChange('placa', e.detail.value!.toUpperCase())}
                    placeholder="ABC-1234"
                    style={{ color: 'var(--lm-text)', textTransform: 'uppercase' }}
                    className="lm-input"
                  />
                </IonItem>

                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Modelo
                  </IonLabel>
                  <IonInput
                    value={formData.modelo}
                    onIonInput={(e) => handleInputChange('modelo', e.detail.value!)}
                    placeholder="Ex: Corolla, Gol, etc."
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>

                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Marca
                  </IonLabel>
                  <IonInput
                    value={formData.marca}
                    onIonInput={(e) => handleInputChange('marca', e.detail.value!)}
                    placeholder="Ex: Toyota, Volkswagen, etc."
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>

                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Cor
                  </IonLabel>
                  <IonInput
                    value={formData.cor}
                    onIonInput={(e) => handleInputChange('cor', e.detail.value!)}
                    placeholder="Ex: Preto, Prata, etc."
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>
              </div>

              {/* Serviço e Agendamento */}
              <div className="lm-card" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--lm-text)', margin: '0 0 16px 0', fontFamily: 'Inter, Roboto, sans-serif', fontWeight: '700' }}>
                  Serviço e Agendamento
                </h3>
                
                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Tipo de Serviço
                  </IonLabel>
                  <IonSelect
                    value={formData.servico_id}
                    onIonChange={(e) => handleInputChange('servico_id', e.detail.value)}
                    placeholder="Selecione um serviço"
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  >
                    {servicos.map(servico => (
                      <IonSelectOption key={servico.id} value={servico.id}>
                        {servico.nome} - R$ {servico.preco}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem style={{ background: 'transparent', '--background': 'transparent' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Data e Horário
                  </IonLabel>
                  <IonDatetime
                    value={formData.data_hora}
                    onIonChange={(e) => handleInputChange('data_hora', e.detail.value!)}
                    presentation="date-time"
                    min={new Date().toISOString()}
                    hourValues="8,9,10,11,12,13,14,15,16,17"
                    minuteValues="0,30"
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>

                {/* Lista de Horários Disponíveis */}
                {carregandoHorarios && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <IonSpinner name="crescent" />
                    <p style={{ color: 'var(--lm-text-muted)', fontSize: '0.875rem', fontFamily: 'Inter, Roboto, sans-serif' }}>
                      Verificando horários disponíveis...
                    </p>
                  </div>
                )}

                {horariosLivres.length > 0 && !carregandoHorarios && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ color: 'var(--lm-text)', margin: '0 0 12px 0', fontSize: '0.9rem', fontFamily: 'Inter, Roboto, sans-serif' }}>
                      Horários Disponíveis:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {horariosLivres.map((horario, index) => (
                        <button
                          key={index}
                          className={`lm-btn-secondary ${!horario.disponivel ? 'disabled' : ''}`}
                          disabled={!horario.disponivel}
                          style={{
                            fontSize: '0.875rem',
                            height: '40px',
                            opacity: horario.disponivel ? 1 : 0.5,
                            cursor: horario.disponivel ? 'pointer' : 'not-allowed'
                          }}
                          onClick={() => {
                            if (horario.disponivel && formData.data_hora) {
                              const data = formData.data_hora.split('T')[0];
                              handleInputChange('data_hora', `${data}T${horario.horario}:00`);
                            }
                          }}
                        >
                          {horario.horario}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <IonItem style={{ background: 'transparent', '--background': 'transparent', marginTop: '16px' }}>
                  <IonLabel position="stacked" style={{ color: 'var(--lm-text)', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    Observações (opcional)
                  </IonLabel>
                  <IonInput
                    value={formData.observacoes}
                    onIonInput={(e) => handleInputChange('observacoes', e.detail.value!)}
                    placeholder="Alguma observação adicional?"
                    style={{ color: 'var(--lm-text)' }}
                    className="lm-input"
                  />
                </IonItem>
              </div>

              {/* Mensagem de Erro */}
              {erro && (
                <div className="lm-card" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--lm-red)' }}>
                  <p style={{ color: 'var(--lm-red)', margin: '0', fontFamily: 'Inter, Roboto, sans-serif' }}>
                    {erro}
                  </p>
                </div>
              )}

              {/* Botão de Criar Agendamento */}
              <button
                className="lm-btn-primary"
                onClick={handleCriarAgendamento}
                disabled={criando || !formData.nome_dono || !formData.celular_dono || !formData.placa || 
                        !formData.modelo || !formData.marca || !formData.cor || 
                        !formData.servico_id || !formData.data_hora}
                style={{ 
                  fontFamily: 'Inter, Roboto, sans-serif',
                  fontWeight: '700',
                  fontSize: '16px'
                }}
              >
                {criando ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                    Criando Agendamento...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Agendar;
