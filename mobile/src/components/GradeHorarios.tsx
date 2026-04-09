import { IonIcon } from '@ionic/react';
import { car, timeOutline } from 'ionicons/icons';
import './GradeHorarios.css';

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

interface Atendimento {
  id: number;
  veiculo: Veiculo;
  servico: Servico;
  data_hora: string;
  horario_inicio: string | null;
  status: string;
  observacoes: string;
}

interface GradeHorariosProps {
  atendimentos: Atendimento[];
  onAtendimentoClick: (id: number) => void;
}

const GradeHorarios: React.FC<GradeHorariosProps> = ({ atendimentos, onAtendimentoClick }) => {
  // Gera slots de 30min das 08:00 às 18:00
  const gerarSlots = () => {
    const slots = [];
    for (let hora = 8; hora < 18; hora++) {
      for (let min = 0; min < 60; min += 30) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(horaStr);
      }
    }
    return slots;
  };

  const slots = gerarSlots();
  
  // Filtra apenas atendimentos AGENDADOS para exibir na grade
  const atendimentosAgendados = atendimentos.filter(a => a.status === 'agendado');

  // Verifica se um slot está ocupado
  const isSlotOcupado = (slot: string) => {
    return atendimentosAgendados.some(atendimento => {
      const horaAtendimento = new Date(atendimento.data_hora).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return horaAtendimento === slot;
    });
  };

  // Encontra o atendimento de um slot específico
  const getAtendimentoDoSlot = (slot: string) => {
    return atendimentosAgendados.find(atendimento => {
      const horaAtendimento = new Date(atendimento.data_hora).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return horaAtendimento === slot;
    });
  };

  return (
    <div className="grade-horarios">
      <div className="grade-header">
        <h3>Grade de Horários</h3>
        <div className="legenda">
          <div className="legenda-item">
            <div className="slot-vago"></div>
            <span>Vago</span>
          </div>
          <div className="legenda-item">
            <div className="slot-ocupado"></div>
            <span>Ocupado</span>
          </div>
        </div>
      </div>

      <div className="grade-container">
        {slots.map((slot, index) => {
          const atendimento = getAtendimentoDoSlot(slot);
          const isOcupado = isSlotOcupado(slot);

          return (
            <div
              key={slot}
              className={`grade-slot ${isOcupado ? 'ocupado' : 'vago'}`}
              onClick={() => atendimento && onAtendimentoClick(atendimento.id)}
            >
              <div className="slot-hora">{slot}</div>
              
              {atendimento && (
                <div className="slot-atendimento">
                  <div className="atendimento-veiculo">
                    <IonIcon icon={car} />
                    <span>{atendimento.veiculo.placa}</span>
                  </div>
                  <div className="atendimento-servico">
                    {atendimento.servico.nome}
                  </div>
                  <div className="atendimento-cliente">
                    {atendimento.veiculo.nome_dono}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GradeHorarios;
