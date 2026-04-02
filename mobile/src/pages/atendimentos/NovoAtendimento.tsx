import { IonContent, IonPage, IonSpinner, useIonViewDidEnter } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { criarAtendimento, getHorariosLivres, getServicos } from '../../services/api';
import '../../theme/lava-me.css';

const PLACA_REGEX = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;

const FORM_INICIAL = {
  nome_dono: '', celular_dono: '',
  placa: '', modelo: '', marca: '', cor: '',
  servico_id: '', observacoes: '',
};

interface Servico { id: number; nome: string; preco: string; duracao_estimada_min: number; }

const CORES = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Outro'];

const NovoAtendimento: React.FC = () => {
  const history = useHistory();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState(FORM_INICIAL);
  const [modo, setModo] = useState<'agora' | 'agendar'>('agora');
  const [dataEscolhida, setDataEscolhida] = useState('');
  const [horariosLivres, setHorariosLivres] = useState<string[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  useEffect(() => {
    getServicos().then(setServicos).catch((e) => console.error('Erro ao carregar serviços:', e));
  }, []);

  useEffect(() => {
    if (dataEscolhida && form.servico_id) {
      setCarregandoHorarios(true);
      setHorarioSelecionado('');
      getHorariosLivres(dataEscolhida, Number(form.servico_id))
        .then((res) => {
          setHorariosLivres(res.horarios || []);
        })
        .catch((e) => console.error('Erro ao listar horários:', e))
        .finally(() => setCarregandoHorarios(false));
    } else {
      setHorariosLivres([]);
      setHorarioSelecionado('');
    }
  }, [dataEscolhida, form.servico_id]);

  useIonViewDidEnter(() => {
    setForm(FORM_INICIAL);
    setDataEscolhida('');
    setHorarioSelecionado('');
    setHorariosLivres([]);
    setErro('');
  });

  const set = (campo: string, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSalvar = async () => {
    const { nome_dono, placa, modelo, marca, servico_id } = form;
    if (!nome_dono || !placa || !modelo || !marca || !servico_id) {
      setErro('Preencha os campos obrigatórios.');
      return;
    }
    if (modo === 'agendar' && (!dataEscolhida || !horarioSelecionado)) {
      setErro('Preencha o dia e escolha um horário na agenda.');
      return;
    }
    if (!PLACA_REGEX.test(placa)) {
      setErro('Placa inválida. Use o formato ABC1234 ou ABC1D23.');
      return;
    }
    
    let dataHoraFinal = '';
    if (modo === 'agora') {
      const gmtTime = new Date();
      // Envia a data atual local ISO (ajustada para o fuso local do dispositivo ou server expected)
      // Ajuste simplificado pra compensar o timezoneOffset no navegador web:
      const tzOffset = gmtTime.getTimezoneOffset() * 60000;
      dataHoraFinal = (new Date(gmtTime.getTime() - tzOffset)).toISOString().slice(0, -1) + '-03:00';
    } else {
      // Constrói a data combinada formato ISO 8601 com o offset do backend (-03:00 para America/Sao_Paulo)
      dataHoraFinal = `${dataEscolhida}T${horarioSelecionado}:00-03:00`;
    }
    
    setErro('');
    setSalvando(true);
    try {
      await criarAtendimento({
        ...form,
        data_hora: dataHoraFinal,
        servico_id: Number(form.servico_id),
        iniciar_agora: modo === 'agora',
      });
      history.push('/atendimentos/hoje');
    } catch (e) {
      console.error('Erro ao criar atendimento:', e);
      setErro('Não foi possível registrar o atendimento. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="lm-page">
        <div style={styles.container}>

          {/* Header */}
          <button style={styles.btnVoltar} onClick={() => history.goBack()}>← Voltar</button>
          <h2 style={styles.titulo}>Novo Atendimento</h2>

          {/* Seção Cliente */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>👤</span><span>Cliente</span>
            </div>
            <input style={styles.input} placeholder="Nome do cliente *"
              value={form.nome_dono} onChange={(e) => set('nome_dono', e.target.value)} />
            <input style={styles.input} placeholder="Celular (opcional)" type="tel"
              value={form.celular_dono} onChange={(e) => set('celular_dono', e.target.value)} />
          </div>

          {/* Seção Veículo */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>🚗</span><span>Veículo</span>
            </div>
            <input style={styles.input} placeholder="Placa do veículo *"
              value={form.placa}
              onChange={(e) => set('placa', e.target.value.toUpperCase())} />
            <input style={styles.input} placeholder="Marca *"
              value={form.marca} onChange={(e) => set('marca', e.target.value)} />
            <input style={styles.input} placeholder="Modelo *"
              value={form.modelo} onChange={(e) => set('modelo', e.target.value)} />
          </div>

          {/* Seção Cor */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>🎨</span><span>Cor</span>
            </div>
            <select style={styles.select} value={form.cor} onChange={(e) => set('cor', e.target.value)}>
              <option value="">Selecione a cor</option>
              {CORES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Seção Serviço */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>⚙️</span><span>Serviço *</span>
            </div>
            <select style={styles.select} value={form.servico_id} onChange={(e) => set('servico_id', e.target.value)}>
              <option value="">Selecione o serviço</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} — R$ {parseFloat(s.preco).toFixed(2)} ({s.duracao_estimada_min} min)
                </option>
              ))}
            </select>
          </div>

          {/* Seção Momento */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>⚡</span><span>Momento do Atendimento</span>
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: modo === 'agendar' ? 14 : 0 }}>
              <button
                style={{ ...styles.btnModo, ...(modo === 'agora' ? styles.btnModoAtivo : {}) }}
                onClick={() => setModo('agora')}
              >
                Na Hora
              </button>
              <button
                style={{ ...styles.btnModo, ...(modo === 'agendar' ? styles.btnModoAtivo : {}) }}
                onClick={() => setModo('agendar')}
              >
                Agendar (Horários)
              </button>
            </div>
            
            {modo === 'agendar' && (
              <div style={{ paddingTop: 10, borderTop: '1px solid #1e2d40' }}>
                <div style={styles.secaoTitulo}>
                  <span>📅</span><span>Dia do Atendimento *</span>
                </div>
                <input style={styles.input} type="date"
                  value={dataEscolhida} onChange={(e) => setDataEscolhida(e.target.value)} />
                
                {dataEscolhida && !form.servico_id && (
                  <p style={{ color: '#8899aa', fontSize: 13, marginTop: 4 }}>Selecione um serviço primeiro para ver os horários.</p>
                )}

                {form.servico_id && dataEscolhida && (
                  <div style={{ marginTop: 16 }}>
                    <div style={styles.secaoTitulo}>
                      <span>🕐</span><span>Horário *</span>
                    </div>
                    
                    {carregandoHorarios ? (
                      <div style={{ textAlign: 'center', padding: 10 }}>
                        <IonSpinner name="dots" color="primary" />
                      </div>
                    ) : horariosLivres.length > 0 ? (
                      <div style={styles.gridHorarios}>
                        {horariosLivres.map((horario) => (
                          <button
                            key={horario}
                            style={{
                              ...styles.btnHorario,
                              ...(horarioSelecionado === horario ? styles.btnHorarioAtivo : {})
                            }}
                            onClick={() => setHorarioSelecionado(horario)}
                          >
                            {horario}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#ef4444', fontSize: 14 }}>
                        Nenhum horário vago para este dia e serviço.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>📝</span><span>Observações</span>
            </div>
            <textarea
              style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
              placeholder="Alguma observação sobre o serviço?"
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
            />
          </div>

          {erro && <p style={styles.erro}>{erro}</p>}

          <button
            style={{ ...styles.btnSalvar, opacity: salvando ? 0.7 : 1 }}
            disabled={salvando}
            onClick={handleSalvar}
          >
            {salvando
              ? <IonSpinner name="crescent" style={{ width: 22, height: 22 }} />
              : '✓  Registrar Atendimento'}
          </button>

        </div>
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0d1117',
    padding: '20px 16px 60px',
  },
  btnVoltar: {
    background: 'none', border: 'none',
    color: '#8899aa', fontSize: 15, cursor: 'pointer',
    padding: 0, marginBottom: 12,
  },
  titulo: { color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 24px' },
  secao: {
    background: '#161b27', border: '1px solid #1e2d40',
    borderRadius: 16, padding: '18px 16px', marginBottom: 14,
  },
  secaoTitulo: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: '#00b4d8', fontWeight: 700, fontSize: 14, marginBottom: 14,
  },
  input: {
    width: '100%', background: '#1e2535',
    border: '1px solid #1e2d40', borderRadius: 12,
    padding: '13px 16px', color: '#fff', fontSize: 14,
    marginBottom: 10, outline: 'none', boxSizing: 'border-box',
  },
  select: {
    width: '100%', background: '#1e2535',
    border: '1px solid #1e2d40', borderRadius: 12,
    padding: '13px 16px', color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    appearance: 'none',
  },
  erro: { color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btnSalvar: {
    width: '100%', padding: '18px 0', borderRadius: 28,
    border: 'none', marginTop: 8,
    background: 'linear-gradient(90deg, #00b4d8, #0096c7)',
    color: '#fff', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,180,216,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  gridHorarios: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
    gap: 8, marginTop: 8,
  },
  btnHorario: {
    background: '#1e2d40', border: '1px solid #2d4059',
    color: '#8899aa', borderRadius: 8, padding: '10px 0',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnHorarioAtivo: {
    background: 'rgba(0,180,216,0.2)', border: '1px solid #00b4d8',
    color: '#00b4d8',
  },
  btnModo: {
    flex: 1, padding: '12px 0', border: '1px solid #2d4059',
    background: '#161b27', borderRadius: 8, color: '#8899aa',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  btnModoAtivo: {
    background: '#1e2535', border: '1px solid #00b4d8', color: '#00b4d8',
  },
};

export default NovoAtendimento;
