import React from 'react';
import { useHistory } from 'react-router-dom';
import { LayoutGrid, Plus, Calendar, History } from 'lucide-react';

interface TabBarProps {
  activeTab: 'pátio' | 'iniciar' | 'agendar' | 'histórico';
}

const TabBar: React.FC<TabBarProps> = ({ activeTab }) => {
  const history = useHistory();

  // Estilo base de cada aba
  const getTabStyle = () => ({
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: '8px',
    flex: 1,
    cursor: 'pointer' as const,
    height: '100%'
  });

  // Estilo do container do ícone
  const getIconStyle = (tab: string) => {
    const isCurrent = activeTab === tab;
    const isIniciar = tab === 'iniciar';
    
    return {
      background: isCurrent ? '#0066ff' : '#1a1a1a',
      padding: isIniciar ? '14px' : '10px',
      borderRadius: isIniciar ? '18px' : '14px',
      color: isCurrent ? '#fff' : '#444',
      border: !isCurrent && !isIniciar ? '1px solid #2a2a2a' : 'none',
      boxShadow: isCurrent ? '0 6px 25px rgba(0,102,255,0.4)' : 'none',
      transition: 'all 0.2s ease',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const
    };
  };

  // Estilo do texto (Label)
  const getLabelStyle = (tab: string) => {
    const isCurrent = activeTab === tab;
    return {
      fontSize: '10px',
      fontWeight: 900 as const,
      textTransform: 'uppercase' as const,
      color: isCurrent ? '#0066ff' : '#444',
      letterSpacing: '0.5px'
    };
  };

  return (
    <div style={{
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: '100px',
      background: 'rgba(10, 10, 10, 0.98)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #1a1a1a',
      display: 'flex' as const,
      justifyContent: 'space-around' as const,
      alignItems: 'center' as const,
      padding: '0 10px',
      zIndex: 1000
    }}>
      
      {/* 1. PÁTIO */}
      <div 
        style={getTabStyle()}
        onClick={() => history.push('/atendimentos/hoje')}
      >
        <div style={getIconStyle('pátio')}>
          <LayoutGrid size={24} />
        </div>
        <span style={getLabelStyle('pátio')}>Pátio</span>
      </div>

      {/* 2. INICIAR (+) */}
      <div 
        style={getTabStyle()}
        onClick={() => history.push('/atendimentos/novo')}
      >
        <div style={getIconStyle('iniciar')}>
          <Plus size={24} strokeWidth={3} />
        </div>
        <span style={getLabelStyle('iniciar')}>Iniciar</span>
      </div>

      {/* 3. AGENDAR */}
      <div 
        style={getTabStyle()}
        onClick={() => history.push('/atendimentos/agendar')}
      >
        <div style={getIconStyle('agendar')}>
          <Calendar size={24} />
        </div>
        <span style={getLabelStyle('agendar')}>Agendar</span>
      </div>

      {/* 4. HISTÓRICO */}
      <div 
        style={getTabStyle()}
        onClick={() => history.push('/atendimentos/historico')}
      >
        <div style={getIconStyle('histórico')}>
          <History size={24} />
        </div>
        <span style={getLabelStyle('histórico')}>Histórico</span>
      </div>
    </div>
  );
};

export default TabBar;