import { IonContent, IonPage, IonSpinner, useIonViewDidEnter } from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { criarAtendimento, getServicos } from '../../services/api';
import '../../theme/lava-me.css';

const PLACA_REGEX = /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/;

const FORM_INICIAL = {
  nome_dono: '', celular_dono: '',
  placa: '', modelo: '', marca: '', cor: '',
  servico_id: '', data_hora: '', observacoes: '',
};

interface Servico { id: number; nome: string; preco: string; duracao_estimada_min: number; }

const CORES = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Outro'];

const NovoAtendimento: React.FC = () => {
  const history = useHistory();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    getServicos().then(setServicos).catch((e) => console.error('Erro ao carregar serviços:', e));
  }, []);

  useIonViewDidEnter(() => {
    setForm(FORM_INICIAL);
    setErro('');
  });

  const set = (campo: string, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSalvar = async () => {
    const { nome_dono, placa, modelo, marca, servico_id, data_hora } = form;
    if (!nome_dono || !placa || !modelo || !marca || !servico_id || !data_hora) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    if (!PLACA_REGEX.test(placa)) {
      setErro('Placa inválida. Use o formato ABC1234 ou ABC1D23.');
      return;
    }
    // Converte datetime-local (sem fuso) para ISO com offset de Brasília (-03:00)
    const dataHoraComFuso = data_hora.length === 16 ? `${data_hora}:00-03:00` : data_hora;
    setErro('');
    setSalvando(true);
    try {
      await criarAtendimento({
        ...form,
        data_hora: dataHoraComFuso,
        servico_id: Number(form.servico_id),
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

          {/* Seção Data e Hora */}
          <div style={styles.secao}>
            <div style={styles.secaoTitulo}>
              <span>🕐</span><span>Data e Hora *</span>
            </div>
            <input style={styles.input} type="datetime-local"
              value={form.data_hora} onChange={(e) => set('data_hora', e.target.value)} />
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
};

export default NovoAtendimento;
