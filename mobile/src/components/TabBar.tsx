import React from 'react';
import { useHistory } from 'react-router-dom';
import { LayoutGrid, Plus, Calendar, History } from 'lucide-react';

interface TabBarProps {
  activeTab: 'pátio' | 'iniciar' | 'agendar' | 'histórico';
}

const TabBar: React.FC<TabBarProps> = ({ activeTab }) => {
  const history = useHistory();

  const getIconStyle = (tab: string) => ({
    background: activeTab === tab ? 'var(--lm-primary)' : '#1a1a1a',
    padding: tab === 'iniciar' ? '14px' : '10px',
    borderRadius: tab === 'iniciar' ? '18px' : '14px',
    color: activeTab === tab ? '#fff' : '#444',
    border: activeTab !== tab && tab !== 'iniciar' ? '1px solid var(--lm-border)' : 'none',
    boxShadow: activeTab === tab ? '0 6px 25px rgba(0,102,255,0.4)' : 'none',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'all 0.2s ease'
  });

  const getLabelStyle = (tab: string) => ({
    fontSize: '10px',
    fontWeight: 900 as const,
    textTransform: 'uppercase' as const,
    color: activeTab === tab ? 'var(--lm-primary)' : '#444',
    letterSpacing: '0.5px',
    marginTop: '8px'
  });

  return (
    <div style={styles.container}>
      <div style={styles.tabItem} onClick={() => history.push('/atendimentos/hoje')}>
        <div style={getIconStyle('pátio')}><LayoutGrid size={24} /></div>
        <span style={getLabelStyle('pátio')}>Pátio</span>
      </div>
      <div style={styles.tabItem} onClick={() => history.push('/atendimentos/novo')}>
        <div style={getIconStyle('iniciar')}><Plus size={24} strokeWidth={3} /></div>
        <span style={getLabelStyle('iniciar')}>Iniciar</span>
      </div>
      <div style={styles.tabItem} onClick={() => history.push('/atendimentos/agendar')}>
        <div style={getIconStyle('agendar')}><Calendar size={24} /></div>
        <span style={getLabelStyle('agendar')}>Agendar</span>
      </div>
      <div style={styles.tabItem} onClick={() => history.push('/atendimentos/historico')}>
        <div style={getIconStyle('histórico')}><History size={24} /></div>
        <span style={getLabelStyle('histórico')}>Histórico</span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed' as const,
    bottom: 0, left: 0, right: 0,
    height: '100px',
    background: 'rgba(10, 10, 10, 0.98)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid var(--lm-border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '0 10px',
    zIndex: 1000
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
    cursor: 'pointer'
  }
};

export default TabBar;