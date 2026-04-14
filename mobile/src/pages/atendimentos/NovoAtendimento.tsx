import { 
  IonContent, 
  IonPage, 
  IonSpinner 
} from '@ionic/react';
import { LogOut, Check } from 'lucide-react'; 
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { getServicos, criarAtendimento } from '../../services/api';
import TabBar from '../../components/TabBar';
import Toast from '../../components/Toast';
import logoLavaMe from '../../assets/logo.jpeg';

const NovoAtendimento: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [servicos, setServicos] = useState<Array<{id: number; nome: string; preco: string}>>([]);
  
  const [form, setForm] = useState({
    placa: '',
    modelo: '',
    marca: '',
    nome_dono: '',
    celular_dono: '',
    cor: '',
    servico_id: 0
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    getServicos()
      .then(setServicos)
      .catch(() => setToastMsg("Erro ao carregar serviços"));
  }, []);

  // Trecho atualizado da função handleConfirmar no NovoAtendimento.tsx

const handleConfirmar = async () => {
  if (!form.placa || !form.modelo || !form.servico_id) {
    setToastMsg("Preencha os campos obrigatórios (*)");
    setShowToast(true);
    return;
  }

  setLoading(true);
  try {
    // CAPTURA DO TEMPO REAL: Registra o momento exato do início [cite: 4]
    const agora = new Date();
    
    const response = await criarAtendimento({
      ...form,
      iniciar_agora: true, 
      data_hora: agora.toISOString(), // Horário de início real para o cronômetro
      origem: 'AVULSO', // Definido conforme diretriz do novo modelo 
      observacoes: ''
    });

    if (response && response.id) {
      // Navega para a esteira onde o cronômetro já iniciará baseado no data_hora acima
      history.push(`/atendimentos/${response.id}/esteira`);
    } else {
      history.push('/atendimentos/hoje');
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro ao iniciar atendimento";
    setToastMsg(msg);
    setShowToast(true);
  } finally {
    setLoading(false);
  }
};

  return (
    <IonPage style={{ background: 'var(--lm-bg)' }}>
      <IonContent style={{ '--background': 'var(--lm-bg)' }}>
        <div style={{ padding: '32px 20px 140px' }}>
          
          {/* Header */}
          <div style={styles.headerRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={logoLavaMe} style={styles.logoImg} alt="Lava-Me" />
              <div>
                <h1 style={styles.headerTitle}>Lava-Me</h1>
                <p style={styles.headerSubtitle}>SISTEMA DE GESTÃO</p>
              </div>
            </div>
            <button onClick={() => history.replace('/login')} style={styles.btnLogout}>
              <LogOut size={20} color="#666" />
            </button>
          </div>

          <h2 style={styles.mainTitle}>Novo Atendimento</h2>
          <p style={styles.mainSubtitle}>Entrada rápida de veículo</p>

          {/* Grupo de Inputs - Modelo abaixo da Marca */}
          <div style={styles.inputGroup}>
            <input 
              value={form.placa} 
              onChange={e => setForm({...form, placa: e.target.value.toUpperCase()})}
              style={styles.inputMain} 
              placeholder="PLACA *" 
            />
            
            <input 
              value={form.marca} 
              onChange={e => setForm({...form, marca: e.target.value})}
              style={styles.input} 
              placeholder="MARCA" 
            />

            <input 
              value={form.modelo} 
              onChange={e => setForm({...form, modelo: e.target.value})}
              style={styles.input} 
              placeholder="MODELO *" 
            />

            <input 
              value={form.nome_dono} 
              onChange={e => setForm({...form, nome_dono: e.target.value})}
              style={styles.input} 
              placeholder="NOME DO PROPRIETÁRIO" 
            />

            <input 
              value={form.cor} 
              onChange={e => setForm({...form, cor: e.target.value})}
              style={styles.input} 
              placeholder="COR DO VEÍCULO *" 
            />
          </div>

          <label style={styles.sectionLabel}>SELECIONE O SERVIÇO</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {servicos.map(s => (
              <div 
                key={s.id} 
                onClick={() => setForm({...form, servico_id: s.id})}
                style={{ 
                  ...styles.selectableCard, 
                  border: form.servico_id === s.id ? '2px solid var(--lm-primary)' : '1px solid var(--lm-border)' 
                }}
              >
                <span style={{ color: '#fff', fontWeight: 700 }}>{s.nome}</span>
                {form.servico_id === s.id && <Check color="var(--lm-primary)" size={20} />}
              </div>
            ))}
          </div>

          <button 
            onClick={handleConfirmar} 
            disabled={loading} 
            style={styles.btnAction}
          >
            {loading ? <IonSpinner name="crescent" /> : 'INICIAR ATENDIMENTO AGORA'}
          </button>

        </div>
        
        <TabBar activeTab="iniciar" />
        <Toast isOpen={showToast} message={toastMsg} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  logoImg: { width: '42px', height: '42px', borderRadius: '10px', border: '1px solid var(--lm-border)' },
  headerTitle: { color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 },
  headerSubtitle: { color: '#666', fontSize: '11px', fontWeight: 700, margin: 0 },
  btnLogout: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '12px', borderRadius: '14px' },
  mainTitle: { color: '#fff', fontSize: '32px', fontWeight: 900, marginBottom: '4px' },
  mainSubtitle: { color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '32px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputMain: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', color: '#fff', padding: '18px', borderRadius: '16px', fontSize: '18px', fontWeight: 900, outline: 'none' },
  input: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', color: '#fff', padding: '18px', borderRadius: '16px', fontSize: '16px', outline: 'none' },
  sectionLabel: { color: '#fff', fontSize: '12px', fontWeight: 900, display: 'block', margin: '32px 0 16px', textTransform: 'uppercase' },
  selectableCard: { background: 'var(--lm-card)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  btnAction: { width: '100%', background: 'var(--lm-primary)', color: '#fff', padding: '22px', borderRadius: '22px', fontSize: '18px', fontWeight: 900, marginTop: '40px', border: 'none' }
};

export default NovoAtendimento;