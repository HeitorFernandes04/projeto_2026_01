import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { 
  Car, Check, ClipboardCheck, Droplets, Sparkles, Key, ArrowLeft 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getAtendimento } from '../../services/api';

import EstadoVistoria from '../../components/EstadoVistoria';
import EstadoLavagem from '../../components/EstadoLavagem';
import { EstadoAcabamento } from '../../components/EstadoAcabamento';
import { EstadoLiberacao } from '../../components/EstadoLiberacao';

// Interface para garantir a tipagem correta dos dados do veículo
interface AtendimentoDados {
  id: number;
  veiculo: { placa: string; modelo: string };
  servico: { nome: string };
  status: string;
}

const DetalhesAtendimento: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [atendimento, setAtendimento] = useState<AtendimentoDados | null>(null);
  const [passo, setPasso] = useState(1);

  useEffect(() => {
    const idNumerico = Number(id);
    
    // Tenta buscar na API, mas usa MOCK se falhar (perfeito para teste de front-only)
    getAtendimento(idNumerico)
      .then((dados) => {
        if (dados) {
          setAtendimento(dados);
        } else {
          throw new Error("Sem dados");
        }
      })
      .catch(() => {
        // DADOS DE TESTE PARA O FRONT-END (Igual ao protótipo)
        setAtendimento({
          id: idNumerico || 2458,
          veiculo: { placa: 'ABC-1D23', modelo: 'Toyota Corolla' },
          servico: { nome: 'Lavagem Completa + Cera' },
          status: 'agendado'
        });
      });
  }, [id]);

  // Enquanto não tem atendimento nem mock, mostra o carregando
  if (!atendimento) {
    return (
      <IonPage>
        <IonContent style={{ "--background": "#000" }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Lógica de troca de telas baseada no botão "Concluir" de cada etapa
  const renderPasso = () => {
    switch(passo) {
      case 1: return <EstadoVistoria onComplete={() => setPasso(2)} />;
      case 2: return <EstadoLavagem onComplete={() => setPasso(3)} />;
      case 3: return <EstadoAcabamento onComplete={() => setPasso(4)} />;
      case 4: return <EstadoLiberacao onComplete={() => history.push('/atendimentos/hoje')} />;
      default: return null;
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Superior (image_e66707.png) */}
          <header style={{ padding: '24px 20px', background: '#121212', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <button onClick={() => history.goBack()} style={{ background: 'none', border: 'none', padding: 0 }}>
                <ArrowLeft color="#fff" size={20} />
              </button>
              <div style={{ color: '#444', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                OS #{atendimento.id}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Car color="#0066ff" size={24} />
              <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, margin: 0 }}>
                {atendimento.veiculo.modelo}
              </h2>
            </div>
            
            <div style={{ color: '#666', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
              {atendimento.veiculo.placa}
            </div>

            <div style={{ 
              background: 'rgba(0,102,255,0.05)', border: '1px solid #0066ff30', 
              padding: '14px 18px', borderRadius: '14px', color: '#0066ff', 
              fontWeight: 800, fontSize: '14px', display: 'inline-block' 
            }}>
              {atendimento.servico.nome}
            </div>
          </header>

          {/* Stepper de Progresso (image_e6673f.png) */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-around', alignItems: 'center', 
            padding: '24px 10px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a' 
          }}>
            {[
              { id: 1, label: 'Vistoria', icon: ClipboardCheck },
              { id: 2, label: 'Lavagem', icon: Droplets },
              { id: 3, label: 'Acabamento', icon: Sparkles },
              { id: 4, label: 'Liberação', icon: Key }
            ].map((step) => (
              <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: passo >= step.id ? 1 : 0.25 }}>
                <div style={{ 
                  width: '42px', height: '42px', borderRadius: '50%', 
                  background: passo > step.id ? '#0066ff' : (passo === step.id ? '#0066ff' : '#1a1a1a'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: passo === step.id ? '0 0 20px rgba(0,102,255,0.3)' : 'none',
                  border: passo === step.id ? 'none' : '1px solid #2a2a2a'
                }}>
                  {passo > step.id ? <Check size={22} color="white" strokeWidth={4} /> : <step.icon size={20} color={passo === step.id ? 'white' : '#444'} />}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 900, color: passo === step.id ? '#fff' : '#333', textTransform: 'uppercase' }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Renderização da Etapa Atual */}
          <div style={{ flex: 1 }}>
            {renderPasso()}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default DetalhesAtendimento;