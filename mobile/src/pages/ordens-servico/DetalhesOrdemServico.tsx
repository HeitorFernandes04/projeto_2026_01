import { 
  IonContent, IonPage, IonSpinner, IonIcon, 
  useIonViewWillEnter, IonAccordion, IonAccordionGroup, 
  IonItem, IonLabel 
} from '@ionic/react';
import { useCallback, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getOrdemServico } from '../../services/api';
import { 
  chevronBackOutline, carOutline, 
  clipboardOutline, waterOutline, sparklesOutline, keyOutline 
} from 'ionicons/icons';
import GaleriaFotos from '../../components/GaleriaFotos';
import '../../theme/lava-me.css';

interface MidiaOrdemServico {
  id: number;
  arquivo: string;
  momento: 'VISTORIA_GERAL' | 'AVARIA_PREVIA' | 'EXECUCAO' | 'FINALIZADO';
}

interface OrdemServico {
  id: number;
  veiculo: { placa: string; modelo: string; marca: string; nome_dono: string; };
  servico: { nome: string; preco: string; };
  status: string; 
  observacoes: string;
  laudo_vistoria?: string;
  comentario_lavagem?: string;
  comentario_acabamento?: string;
  vaga_patio?: string;
  midias: MidiaOrdemServico[];
}

const DetalhesOrdemServico: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [ordemServico, setOrdemServico] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);

  // Axioma 13: Carregamento orgânico dos dados
  const carregar = useCallback(() => {
    setLoading(true);
    getOrdemServico(Number(id))
      .then(d => setOrdemServico(d as unknown as OrdemServico))
      .finally(() => setLoading(false));
  }, [id]);

  useIonViewWillEnter(() => carregar());

  if (loading) return (
    <IonPage style={{ background: '#000' }}>
      <IonContent className="lm-page">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50%' }}>
          <IonSpinner color="primary" />
        </div>
      </IonContent>
    </IonPage>
  );

  if (!ordemServico) return null;

  return (
    <IonPage style={{ background: '#000' }}>
      <IonContent style={{ '--background': '#000' }}>
        <div style={styles.container}>
          
          {/* Header de Navegação */}
          <div onClick={() => history.goBack()} style={styles.btnVoltar}>
            <IonIcon icon={chevronBackOutline} /> 
            <span style={{ fontWeight: 700 }}>Voltar ao Histórico</span>
          </div>

          {/* Card Principal do Veículo */}
          <div className="lm-card" style={styles.mainCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <IonIcon icon={carOutline} style={{ color: 'var(--lm-primary)', fontSize: 28 }} />
              <h2 style={styles.placaText}>{ordemServico.veiculo.placa}</h2>
            </div>
            <p style={styles.veiculoText}>{ordemServico.veiculo.marca} {ordemServico.veiculo.modelo}</p>
            <p style={styles.clienteText}>{ordemServico.veiculo.nome_dono}</p>
            <div style={styles.divider} />
            <p style={styles.servicoTag}>{ordemServico.servico.nome}</p>
          </div>

          <h3 style={styles.sectionTitle}>Etapas Realizadas</h3>

          <IonAccordionGroup>
            {/* ETAPA: VISTORIA (Sempre visível) */}
            <IonAccordion value="v" className="item-esteira">
              <IonItem slot="header" lines="none" className="header-esteira">
                <IonIcon icon={clipboardOutline} slot="start" color="primary" />
                <IonLabel className="label-esteira">Vistoria de Entrada</IonLabel>
              </IonItem>
              <div slot="content" style={styles.accordionContent}>
                <GaleriaFotos 
                  ordemServicoId={ordemServico.id} 
                  momento="VISTORIA_GERAL" 
                  fotosIniciais={ordemServico.midias?.filter(m => m.momento === 'VISTORIA_GERAL') || []} 
                  somenteLeitura 
                />
                <div style={styles.statusBox}>
                  <p style={styles.comentarioText}>
                    <strong style={{ color: '#fff' }}>Laudo Técnico:</strong><br/>
                    {ordemServico.laudo_vistoria || 'Nenhuma observação registrada na entrada.'}
                  </p>
                </div>
              </div>
            </IonAccordion>

            {/* ETAPA: LAVAGEM (Condicional: só aparece se houver comentário) */}
            {ordemServico.comentario_lavagem && (
              <IonAccordion value="l" className="item-esteira">
                <IonItem slot="header" lines="none" className="header-esteira">
                  <IonIcon icon={waterOutline} slot="start" color="primary" />
                  <IonLabel className="label-esteira">Lavagem</IonLabel>
                </IonItem>
                <div slot="content" style={styles.accordionContent}>
                  <p style={styles.comentarioText}>
                    <strong style={{ color: '#fff' }}>Notas da Execução:</strong><br/>
                    {ordemServico.comentario_lavagem}
                  </p>
                </div>
              </IonAccordion>
            )}

            {/* ETAPA: ACABAMENTO (Condicional: só aparece se houver comentário) */}
            {ordemServico.comentario_acabamento && (
              <IonAccordion value="a" className="item-esteira">
                <IonItem slot="header" lines="none" className="header-esteira">
                  <IonIcon icon={sparklesOutline} slot="start" color="primary" />
                  <IonLabel className="label-esteira">Acabamento</IonLabel>
                </IonItem>
                <div slot="content" style={styles.accordionContent}>
                  <p style={styles.comentarioText}>
                    <strong style={{ color: '#fff' }}>Notas de Finalização:</strong><br/>
                    {ordemServico.comentario_acabamento}
                  </p>
                </div>
              </IonAccordion>
            )}

            {/* ETAPA: LIBERAÇÃO (Sempre visível no histórico) */}
            <IonAccordion value="f" className="item-esteira">
              <IonItem slot="header" lines="none" className="header-esteira">
                <IonIcon icon={keyOutline} slot="start" color="primary" />
                <IonLabel className="label-esteira">Liberação / Entrega</IonLabel>
              </IonItem>
              <div slot="content" style={styles.accordionContent}>
                <div style={styles.vagaBadge}>
                  <span style={styles.labelTiny}>Vaga de Saída</span>
                  <p style={styles.vagaText}>{ordemServico.vaga_patio || 'Pátio Geral'}</p>
                </div>
                <GaleriaFotos 
                  ordemServicoId={ordemServico.id} 
                  momento="FINALIZADO" 
                  fotosIniciais={ordemServico.midias?.filter(m => m.momento === 'FINALIZADO') || []} 
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
  container: { padding: '24px 16px 100px' },
  btnVoltar: { color: '#666', marginBottom: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' },
  mainCard: { background: 'var(--lm-card)', border: '1px solid var(--lm-border)', padding: '24px', borderRadius: '24px' },
  placaText: { color: '#fff', margin: 0, fontSize: '26px', fontWeight: 900, letterSpacing: '1px' },
  veiculoText: { color: '#fff', fontSize: '16px', fontWeight: 600, margin: '4px 0 0' },
  clienteText: { color: 'var(--lm-text-muted)', fontSize: '14px', marginTop: '2px' },
  divider: { height: '1px', background: '#1a1a1a', margin: '20px 0' },
  servicoTag: { color: 'var(--lm-primary)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' },
  sectionTitle: { color: '#444', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '16px', marginLeft: '8px', letterSpacing: '1px' },
  accordionContent: { padding: '20px', background: '#080808' },
  statusBox: { marginTop: '16px' },
  comentarioText: { color: '#888', fontSize: '14px', lineHeight: '1.5', margin: 0 },
  vagaBadge: { marginBottom: '20px', background: '#111', padding: '12px', borderRadius: '12px', border: '1px solid #222' },
  labelTiny: { color: '#444', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
  vagaText: { color: 'var(--lm-green)', fontWeight: 900, fontSize: '20px', margin: 0 }
};

export default DetalhesOrdemServico;