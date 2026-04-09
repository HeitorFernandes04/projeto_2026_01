import { 
  IonContent, 
  IonPage, 
  IonSpinner, 
  IonIcon, 
  useIonViewWillEnter, 
  IonAccordion, 
  IonAccordionGroup, 
  IonItem, 
  IonLabel 
} from '@ionic/react';
import { useCallback, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getAtendimento } from '../../services/api';
import { 
  chevronBackOutline, 
  carOutline, 
  timeOutline, 
  clipboardOutline, 
  waterOutline, 
  sparklesOutline, 
  keyOutline 
} from 'ionicons/icons';
import GaleriaFotos from '../../components/GaleriaFotos';
import '../../theme/lava-me.css';

interface MidiaAtendimento {
  id: number;
  arquivo: string;
  momento: 'ANTES' | 'DEPOIS';
}

interface Atendimento {
  id: number;
  veiculo: { placa: string; modelo: string; marca: string; nome_dono: string; };
  servico: { nome: string; preco: string; };
  horario_inicio: string | null;
  horario_lavagem: string | null;
  horario_acabamento: string | null;
  horario_finalizacao: string | null;
  status: string; 
  observacoes: string;
  laudo_vistoria?: string;
  vaga_patio?: string;
  midias: MidiaAtendimento[];
}

/**
 * Calcula a duração entre duas etapas e retorna formatado para o cronômetro
 */
const calcularDuracao = (inicio: string | null, fim: string | null): string | null => {
  if (!inicio || !fim) return null;
  const diff = Math.abs(new Date(fim).getTime() - new Date(inicio).getTime());
  const minutosTotal = Math.floor(diff / 60000);
  
  if (minutosTotal < 1) return 'menos de 1 min';
  if (minutosTotal < 60) return `${minutosTotal} min`;
  
  const horas = Math.floor(minutosTotal / 60);
  const minRestantes = minutosTotal % 60;
  return minRestantes > 0 ? `${horas}h ${minRestantes}min` : `${horas}h`;
};

const DetalhesAtendimento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(() => {
    getAtendimento(Number(id))
      .then(d => {
        // Tipagem correta para remover o erro 'Unexpected any' do ESLint
        setAtendimento(d as unknown as Atendimento);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useIonViewWillEnter(() => carregar());

  /**
   * Extrai comentários segmentados gravados no banco de dados
   */
  const extrairComentario = (chave: string): string | null => {
    if (!atendimento?.observacoes) return null;
    const regex = new RegExp(`\\[${chave}\\](.*?)(?=\\[|$)`, 's');
    const match = atendimento.observacoes.match(regex);
    return match ? match[1].trim() : null;
  };

  if (loading) return (
    <IonPage style={{ background: '#000' }}>
      <IonSpinner style={{ margin: 'auto' }} color="primary" />
    </IonPage>
  );

  if (!atendimento) return null;

  return (
    <IonPage style={{ background: '#000' }}>
      <IonContent color="black">
        <div style={styles.container}>
          
          {/* Cabeçalho */}
          <div 
            onClick={() => history.goBack()} 
            style={styles.btnVoltar}
          >
            <IonIcon icon={chevronBackOutline} /> 
            <span style={{ fontWeight: 700 }}>Voltar</span>
          </div>

          {/* Card Resumo Unificado */}
          <div className="lm-card" style={styles.mainCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <IonIcon icon={carOutline} style={{ color: '#00b4d8', fontSize: 28 }} />
              <h2 style={styles.placaText}>{atendimento.veiculo.placa}</h2>
            </div>
            <p style={styles.veiculoText}>
              {atendimento.veiculo.marca} {atendimento.veiculo.modelo}
            </p>
            <p style={styles.clienteText}>{atendimento.veiculo.nome_dono}</p>
            <div style={styles.divider} />
            <p style={styles.servicoTag}>
              {atendimento.servico.nome}
            </p>
          </div>

          <h3 style={styles.sectionTitle}>Etapas da Esteira</h3>

          <IonAccordionGroup>
            {/* ETAPA: VISTORIA */}
            <IonAccordion value="v" className="item-esteira">
              <IonItem slot="header" lines="none" className="header-esteira">
                <IonIcon icon={clipboardOutline} slot="start" color="primary" />
                <IonLabel className="label-esteira">Vistoria</IonLabel>
              </IonItem>
              <div slot="content" style={styles.accordionContent}>
                <GaleriaFotos 
                  atendimentoId={atendimento.id} 
                  momento="ANTES" 
                  fotosIniciais={atendimento.midias?.filter(m => m.momento === 'ANTES') || []} 
                  somenteLeitura 
                />
                <div style={styles.statusBox}>
                  <p style={styles.duracaoText}>
                    <IonIcon icon={timeOutline} /> 
                    Concluída em {calcularDuracao(atendimento.horario_inicio, atendimento.horario_lavagem) || '--'}
                  </p>
                  <p style={styles.comentarioText}>
                    <strong>Laudo:</strong> {atendimento.laudo_vistoria || 'Sem laudo.'}
                  </p>
                </div>
              </div>
            </IonAccordion>

            {/* ETAPA: LAVAGEM */}
            <IonAccordion value="l" className="item-esteira">
              <IonItem slot="header" lines="none" className="header-esteira">
                <IonIcon icon={waterOutline} slot="start" color="primary" />
                <IonLabel className="label-esteira">Lavagem</IonLabel>
              </IonItem>
              <div slot="content" style={styles.accordionContent}>
                <p style={styles.duracaoText}>
                  <IonIcon icon={timeOutline} /> 
                  Concluída em {calcularDuracao(atendimento.horario_lavagem, atendimento.horario_acabamento) || '--'}
                </p>
                <div style={styles.comentarioBox}>
                  <p style={{ margin: 0 }}>
                    <strong>Nota:</strong> {extrairComentario('Etapa Lavagem') || 'Sem notas.'}
                  </p>
                </div>
              </div>
            </IonAccordion>

            {/* ETAPA: ACABAMENTO */}
            <IonAccordion value="a" className="item-esteira">
              <IonItem slot="header" lines="none" className="header-esteira">
                <IonIcon icon={sparklesOutline} slot="start" color="primary" />
                <IonLabel className="label-esteira">Acabamento</IonLabel>
              </IonItem>
              <div slot="content" style={styles.accordionContent}>
                <p style={styles.duracaoText}>
                  <IonIcon icon={timeOutline} /> 
                  Concluída em {calcularDuracao(atendimento.horario_acabamento, atendimento.horario_finalizacao) || '--'}
                </p>
                <div style={styles.comentarioBox}>
                  <p style={{ margin: 0 }}>
                    <strong>Nota:</strong> {extrairComentario('Acabamento') || 'Sem notas.'}
                  </p>
                </div>
              </div>
            </IonAccordion>

            {/* ETAPA: LIBERAÇÃO */}
            <IonAccordion value="f" className="item-esteira">
              <IonItem slot="header" lines="none" className="header-esteira">
                <IonIcon icon={keyOutline} slot="start" color="primary" />
                <IonLabel className="label-esteira">Liberação</IonLabel>
              </IonItem>
              <div slot="content" style={styles.accordionContent}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={styles.labelTiny}>Vaga de Saída</span>
                  <p style={styles.vagaText}>{atendimento.vaga_patio || 'Não informada'}</p>
                </div>
                <GaleriaFotos 
                  atendimentoId={atendimento.id} 
                  momento="DEPOIS" 
                  fotosIniciais={atendimento.midias?.filter(m => m.momento === 'DEPOIS') || []} 
                  somenteLeitura 
                />
              </div>
            </IonAccordion>
          </IonAccordionGroup>

        </div>
      </IonContent>
    </IonPage>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px 16px 80px' },
  btnVoltar: { color: '#666', marginBottom: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' },
  mainCard: { background: '#121212', border: '1px solid #1a1a1a', padding: '24px', borderRadius: '24px' },
  placaText: { color: '#fff', margin: 0, fontSize: 24, fontWeight: 900 },
  veiculoText: { color: '#fff', fontSize: '17px', fontWeight: 600, margin: 0 },
  clienteText: { color: '#888', fontSize: '15px', marginTop: '4px' },
  divider: { height: '1px', background: '#222', margin: '16px 0' },
  servicoTag: { color: '#00b4d8', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' },
  sectionTitle: { color: '#444', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px', marginLeft: '8px' },
  accordionContent: { padding: '24px', background: '#080808', borderTop: '1px solid #1a1a1a' },
  statusBox: { marginTop: '16px' },
  duracaoText: { color: '#00ff88', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
  comentarioText: { color: '#888', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' },
  comentarioBox: { marginTop: '12px', padding: '12px', background: '#121212', borderRadius: '12px', color: '#888', fontSize: '14px' },
  labelTiny: { color: '#444', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  vagaText: { color: '#00ff88', fontWeight: 800, fontSize: '18px', margin: 0 }
};

export default DetalhesAtendimento;