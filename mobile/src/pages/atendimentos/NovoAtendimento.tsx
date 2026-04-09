import { IonContent, IonPage, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import { LogOut, Check } from 'lucide-react'; 
import React, { useState, useMemo, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getServicos, getHorariosLivres, criarAtendimento } from '../../services/api';
import TabBar from '../../components/TabBar';
import Toast from '../../components/Toast';

// Importação da Logo Oficial
import logoLavaMe from '../../assets/logo.jpeg';

interface Servico {
  id: number;
  nome: string;
  duracao_estimada_min: number;
  preco: string;
}

const NovoAtendimento: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  
  const isAgendar = location.pathname.includes('agendar');

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [telefoneProprietario, setTelefoneProprietario] = useState('');
  const [corVeiculo, setCorVeiculo] = useState('');
  const [servicoSelecionado, setServicoSelecionado] = useState<number | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horariosLivres, setHorariosLivres] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('danger');

  const horariosFallback = useMemo(() => ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'], []);

  const formatarTelefone = (value: string) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 11) {
      if (numeros.length <= 2) return `(${numeros}`;
      if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
    return value;
  };

  const formularioValido = () => {
    return (
      placa.trim() !== '' &&
      modelo.trim() !== '' &&
      nomeProprietario.trim() !== '' &&
      telefoneProprietario.replace(/\D/g, '').length >= 10 &&
      corVeiculo.trim() !== '' &&
      servicoSelecionado !== null &&
      (!isAgendar || horarioSelecionado !== null)
    );
  };

  const servicosModelo = useMemo<Servico[]>(() => [
    { id: 1, nome: 'Lavagem Simples', duracao_estimada_min: 30, preco: '50.00' },
    { id: 2, nome: 'Lavagem Completa + Cera', duracao_estimada_min: 60, preco: '90.00' },
    { id: 3, nome: 'Detalhe Interno (Higienização)', duracao_estimada_min: 120, preco: '250.00' },
    { id: 4, nome: 'Polimento Técnico', duracao_estimada_min: 180, preco: '450.00' }
  ], []);

  useIonViewWillEnter(() => {
    getServicos()
      .then((dados) => {
        if (dados && dados.length > 0) setServicos(dados);
        else setServicos(servicosModelo);
      })
      .catch(() => setServicos(servicosModelo));
  }, [servicosModelo]);

  useEffect(() => {
    if (isAgendar && servicoSelecionado) {
      setLoadingHorarios(true);
      setHorarioSelecionado(null);
      getHorariosLivres(dataSelecionada, servicoSelecionado)
        .then(res => {
          if (res?.horarios && res.horarios.length > 0) setHorariosLivres(res.horarios);
          else setHorariosLivres(horariosFallback);
        })
        .catch(() => setHorariosLivres(horariosFallback))
        .finally(() => setLoadingHorarios(false));
    }
  }, [dataSelecionada, servicoSelecionado, isAgendar, horariosFallback]);

  const handleConfirmar = async () => {
    if (!formularioValido()) {
      setToastMessage("Por favor, preencha todos os campos obrigatórios.");
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    const dadosAtendimento = {
      nome_dono: nomeProprietario.trim(), 
      celular_dono: telefoneProprietario.trim(),
      placa: placa.toUpperCase().trim(),
      modelo: modelo.trim(),
      marca: marca.trim() || 'Não informada',
      cor: corVeiculo.trim(),
      servico_id: Number(servicoSelecionado), 
      data_hora: isAgendar ? `${dataSelecionada}T${horarioSelecionado}:00` : new Date().toISOString(),
      iniciar_agora: !isAgendar,
      observacoes: ""
    };

    try {
      const atendimentoCriado = await criarAtendimento(dadosAtendimento);
      setToastMessage('Atendimento criado com sucesso!');
      setToastColor('success');
      setShowToast(true);
      
      setTimeout(() => {
        history.push(`/atendimentos/${atendimentoCriado.id}/esteira`);
      }, 1500);
    } catch (e: unknown) { // CORREÇÃO: Alterado de any para unknown para satisfazer o ESLint
      const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
      setToastMessage('Erro ao salvar: ' + errorMessage);
      setToastColor('danger');
      setShowToast(true);
    }
  };

  return (
    <IonPage style={{ background: '#000000' }}>
      <IonContent style={{ '--background': '#000000' }}>
        <div style={{ background: '#000000', minHeight: '100vh', padding: '32px 20px 140px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '2px', borderRadius: '12px', border: '1px solid #1a1a1a', background: '#000000' }}>
                <img 
                  src={logoLavaMe} 
                  alt="Lava-Me Logo" 
                  style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
                />
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>Lava-Me</h1>
                <p style={{ color: '#666', fontSize: '11px', margin: 0, fontWeight: 700, textTransform: 'uppercase' }}>Sistema de Gestão</p>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                localStorage.removeItem('nome_usuario');
                history.replace('/login');
              }} 
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '12px', borderRadius: '14px', height: '60px', minWidth: '60px' }}
            >
              <LogOut color="#666" size={20} />
            </button>
          </div>

          <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-1px' }}>
            {isAgendar ? 'Agendar Serviço' : 'Entrada Rápida'}
          </h2>
          <p style={{ color: '#444', fontSize: '15px', fontWeight: 700, marginBottom: '32px' }}>
            {isAgendar ? 'Selecione data e horário' : 'Iniciar atendimento imediato'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
            <input 
              value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())}
              style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '18px', fontWeight: 700, outline: 'none', height: '60px' }}
              placeholder="PLACA *"
            />
            <input 
              value={modelo} onChange={e => setModelo(e.target.value)}
              style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '16px', outline: 'none', height: '60px' }}
              placeholder="MODELO *"
            />
            <input 
              value={marca} onChange={e => setMarca(e.target.value)}
              style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '16px', outline: 'none', height: '60px' }}
              placeholder="MARCA"
            />
            <input 
              value={nomeProprietario} onChange={e => setNomeProprietario(e.target.value)}
              style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '16px', outline: 'none', height: '60px' }}
              placeholder="NOME DO PROPRIETÁRIO *"
            />
            <input 
              value={telefoneProprietario} onChange={e => setTelefoneProprietario(formatarTelefone(e.target.value))}
              style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '16px', outline: 'none', height: '60px' }}
              placeholder="TELEFONE *"
              maxLength={15}
            />
            <input 
              value={corVeiculo} onChange={e => setCorVeiculo(e.target.value)}
              style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '18px', borderRadius: '16px', width: '100%', fontSize: '16px', outline: 'none', height: '60px' }}
              placeholder="COR DO VEÍCULO *"
            />
          </div>

          <label style={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>Serviço</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
            {servicos?.map(s => (
              <div 
                key={s.id} 
                onClick={() => setServicoSelecionado(Number(s.id))}
                style={{ 
                  background: '#121212', 
                  border: servicoSelecionado === s.id ? '2px solid #0066ff' : '1px solid #2a2a2a', 
                  padding: '16px', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  backgroundColor: servicoSelecionado === s.id ? '#1a1a1a' : '#121212'
                }}
              >
                <div style={{ color: '#fff', fontWeight: 700 }}>{s.nome}</div>
                {servicoSelecionado === s.id && <Check color="#0066ff" size={20} />}
              </div>
            ))}
          </div>

          {isAgendar && servicoSelecionado && (
            <div style={{ marginBottom: '40px' }}>
              <label style={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Data e Horários Disponíveis</label>
              <input 
                type="date" value={dataSelecionada} onChange={e => setDataSelecionada(e.target.value)}
                style={{ background: '#121212', border: '1px solid #2a2a2a', color: '#fff', padding: '14px', borderRadius: '12px', width: '100%', marginBottom: '16px', colorScheme: 'dark', height: '60px' }}
              />

              {loadingHorarios ? (
                <div style={{ textAlign: 'center' }}>
                  <IonSpinner color="primary" />
                  <p style={{ color: '#666', fontSize: '14px', marginTop: '16px' }}>Carregando horários...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {horariosLivres?.map(h => (
                    <div 
                      key={h} onClick={() => setHorarioSelecionado(h)}
                      style={{ 
                        padding: '12px 5px', borderRadius: '10px', textAlign: 'center', fontSize: '12px', fontWeight: 800,
                        background: horarioSelecionado === h ? '#0066ff' : '#121212',
                        color: horarioSelecionado === h ? '#fff' : '#444',
                        border: '1px solid #2a2a2a', cursor: 'pointer'
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleConfirmar}
            disabled={!formularioValido()}
            style={{ 
              width: '100%', 
              background: formularioValido() ? '#0066ff' : '#2a2a2a', 
              color: formularioValido() ? '#fff' : '#666', 
              padding: '22px', 
              borderRadius: '22px', 
              fontSize: '18px', 
              fontWeight: 900, 
              border: 'none', 
              height: '60px',
              cursor: formularioValido() ? 'pointer' : 'not-allowed',
              opacity: formularioValido() ? 1 : 0.6
            }}
          >
            {isAgendar ? 'Confirmar Agendamento' : 'Iniciar Atendimento'}
          </button>

          <TabBar activeTab={isAgendar ? "agendar" : "iniciar"} />
        </div>
      </IonContent>
      
      <Toast 
        message={toastMessage}
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        color={toastColor}
      />
    </IonPage>
  );
};

export default NovoAtendimento;