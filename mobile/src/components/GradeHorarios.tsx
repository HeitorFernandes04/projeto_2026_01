import React, { useState, useEffect } from 'react';
import { IonGrid, IonRow, IonCol, IonSpinner } from '@ionic/react';
import { getHorariosLivres } from '../services/api';
import './GradeHorarios.css';

interface GradeProps {
  data: string;
  servicoId: number;
  onSelectHora: (hora: string) => void;
  horaSelecionada: string;
}

const GradeHorarios: React.FC<GradeProps> = ({ data, servicoId, onSelectHora, horaSelecionada }) => {
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data || !servicoId || servicoId === 0) {
      setLoading(false);
      setHorarios([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Busca os horários livres da API
      console.log('Fetching horarios for data:', data, 'servicoId:', servicoId);
      getHorariosLivres(data, servicoId) 
        .then(res => {
          console.log('API response:', res);
          // API retorna lista de objetos {inicio, fim}, extrair apenas os horários de início
          const slots = res?.horarios || [];
          const todosHorarios: string[] = slots.map((slot: any) => slot.inicio || slot);
          console.log('todosHorarios:', todosHorarios);
        
          // --- LÓGICA DE FILTRO DINÂMICO ---
          const agora = new Date();
          const hojeIso = agora.toISOString().split('T')[0];

          if (data === hojeIso) {
            // Se for hoje, calcula a hora atual em minutos para comparação
            const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();

          const filtrados = todosHorarios.filter(h => {
            const [hora, min] = h.split(':').map(Number);
            const minutosDoHorario = hora * 60 + min;
            
            // Retorna apenas horários que ainda não passaram (com margem de 5min)
            return minutosDoHorario > minutosAtuais + 5;
          });
          setHorarios(filtrados);
        } else {
          // Se for data futura, mostra tudo o que a API retornar
          setHorarios(todosHorarios);
        }
      })
      .catch(() => {
        // Fallback caso a API falhe (exemplo de horários padrão)
        setHorarios(['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']);
      })
      .finally(() => setLoading(false));
    } catch (error) {
      console.error('Erro no useEffect:', error);
      setLoading(false);
    }
  }, [data, servicoId]);

  // Debug do estado final antes do render
  console.log('Estado final - loading:', loading, 'horarios:', horarios);

  return (
    <div className="grade-horarios-wrapper">
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <IonSpinner color="primary" />
        </div>
      ) : (
        <IonGrid style={{ padding: 0 }}>
          <IonRow>
            {Array.isArray(horarios) && horarios.length > 0 ? (
              horarios.map((h) => (
                <IonCol size="3" key={h} style={{ padding: '4px' }}>
                  <div 
                    className={`horario-card ${horaSelecionada === h ? 'selecionado' : ''}`}
                    onClick={() => onSelectHora(h)}
                    style={{
                      background: horaSelecionada === h ? 'var(--lm-primary)' : 'var(--lm-card)',
                      color: horaSelecionada === h ? '#fff' : 'var(--lm-text-muted)',
                      border: horaSelecionada === h ? '1px solid var(--lm-primary)' : '1px solid var(--lm-border)',
                      padding: '14px 5px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: '0.2s ease'
                    }}
                  >
                    {h}
                  </div>
                </IonCol>
              ))
            ) : (
              <IonCol size="12">
                <p style={{ color: '#666', fontSize: '12px', textAlign: 'center', fontWeight: 700 }}>
                  {horarios.length === 0 ? 'Nenhum horário disponível para esta data.' : 'Carregando horários...'}
                </p>
              </IonCol>
            )}
          </IonRow>
        </IonGrid>
      )}
    </div>
  );
};

export default GradeHorarios;