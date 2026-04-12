import React, { useState, useEffect } from 'react';
import { IonGrid, IonRow, IonCol, IonSpinner } from '@ionic/react';
import { getHorariosLivres } from '../services/api';
import './GradeHorarios.css';

interface GradeProps {
  data: string;
  onSelectHora: (hora: string) => void;
  horaSelecionada: string;
}

const GradeHorarios: React.FC<GradeProps> = ({ data, onSelectHora, horaSelecionada }) => {
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Busca slots reais da API conforme configurado na sua branch
    getHorariosLivres(data, 1) 
      .then(res => setHorarios(res.horarios || []))
      .catch(() => setHorarios(['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']))
      .finally(() => setLoading(false));
  }, [data]);

  return (
    <div className="grade-horarios-wrapper">
      {loading ? <IonSpinner color="primary" /> : (
        <IonGrid style={{ padding: 0 }}>
          <IonRow>
            {horarios.map((h) => (
              <IonCol size="3" key={h} style={{ padding: '4px' }}>
                <div 
                  className={`horario-card ${horaSelecionada === h ? 'selecionado' : ''}`}
                  onClick={() => onSelectHora(h)}
                  style={{
                    background: horaSelecionada === h ? '#0066ff' : '#121212',
                    color: horaSelecionada === h ? '#fff' : '#444',
                    border: '1px solid #2a2a2a',
                    padding: '12px 5px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {h}
                </div>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      )}
    </div>
  );
};

export default GradeHorarios;