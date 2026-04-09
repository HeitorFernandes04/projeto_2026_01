import React from 'react';
import { Check } from 'lucide-react';

interface StepperStep {
  id: number;
  nome: string;
  completed: boolean;
  active: boolean;
}

interface StepperHorizontalProps {
  steps: StepperStep[];
}

const StepperHorizontal: React.FC<StepperHorizontalProps> = ({ steps }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 20px',
      background: '#121212',
      borderBottom: '1px solid #2a2a2a',
      marginBottom: '20px'
    }}>
      {steps.map((step, index) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {/* Círculo do Step */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: step.completed 
                ? '#00ff66' 
                : step.active 
                  ? '#0066ff' 
                  : '#333',
              border: step.active ? '2px solid #0066ff' : '2px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 900,
              position: 'relative',
              zIndex: 1
            }}
          >
            {step.completed ? (
              <Check size={16} />
            ) : (
              step.id
            )}
          </div>

          {/* Label do Step */}
          <div
            style={{
              marginLeft: '12px',
              color: step.completed 
                ? '#00ff66' 
                : step.active 
                  ? '#fff' 
                  : '#666',
              fontSize: '12px',
              fontWeight: step.active ? 800 : 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {step.nome}
          </div>

          {/* Linha Conectora */}
          {index < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: '2px',
                background: step.completed ? '#00ff66' : '#333',
                marginLeft: '12px',
                marginRight: '12px'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepperHorizontal;
