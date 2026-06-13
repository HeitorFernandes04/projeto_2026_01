import React, { useState, useMemo, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonPopover,
  useIonViewWillEnter,
} from '@ionic/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { 
  locateOutline, 
  arrowBackOutline,
  locationOutline,
  timeOutline,
  starOutline,
  star,
  chevronDownOutline
} from 'ionicons/icons';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { getEstabelecimentos, type EstabelecimentoMapa } from '../../services/api';
import EstabelecimentoDrawer from '../../components/EstabelecimentoDrawer/EstabelecimentoDrawer';
import { useAuth } from '../../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import './Home.css';

// Fix obrigatório para ícones Leaflet com Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const CENTRO_PADRAO: [number, number] = [-10.184, -48.334];
const RAIO_PROXIMOS_KM = 15; // Raio em km para o filtro "Mais Próximos"

type Filtro = 'proximos' | 'abertos' | null;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isAberto(e: EstabelecimentoMapa): boolean {
  if (!e.horario_abertura || !e.horario_fechamento) return true;
  const now = new Date();
  const [hA, mA] = e.horario_abertura.split(':').map(Number);
  const [hF, mF] = e.horario_fechamento.split(':').map(Number);
  const min = now.getHours() * 60 + now.getMinutes();
  return min >= hA * 60 + mA && min <= hF * 60 + mF;
}

function criarPin(e: EstabelecimentoMapa, selecionado: boolean) {
  // Define a logo do estabelecimento ou um fallback genérico (usando avatar padrão)
  const logoUrl = e.logo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(e.nome_fantasia) + '&background=0D8ABC&color=fff';
  
  // Classe extra se selecionado (pode ser usado para animação ou destaque no CSS)
  const pinClass = selecionado ? 'lm-custom-pin pin-selecionado' : 'lm-custom-pin';

  return L.divIcon({
    className: '',
    html: `
      <div class="${pinClass}">
        <div class="lm-pin-bubble">
          <img src="${logoUrl}" alt="Logo" class="lm-pin-logo" />
        </div>
        <div class="lm-pin-arrow"></div>
      </div>
    `,
    iconSize: [64, 76], /* Width 64, Height 64 + 12 arrow */
    iconAnchor: [32, 76], /* Anchor no centro inferior */
    popupAnchor: [0, -76],
  });
}

const MapEvents: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  useMapEvents({
    click: () => {
      onClick();
    },
  });
  return null;
};

const Home: React.FC = () => {
  const { token } = useAuth();
  const history = useHistory();
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoMapa[]>([]);
  const [selecionado, setSelecionado] = useState<EstabelecimentoMapa | null>(null);
  const [centro, setCentro] = useState<[number, number]>(CENTRO_PADRAO);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(null);
  const [posicaoUsuario, setPosicaoUsuario] = useState<[number, number] | null>(null);
  const [notaMinima, setNotaMinima] = useState<number | undefined>(undefined);
  const [filtroAvaliacao, setFiltroAvaliacao] = useState<string>('qualquer');
  const centroKey = useRef(0);

  const fetchEstabelecimentos = (nota?: number) => {
    getEstabelecimentos(nota)
      .then(data => setEstabelecimentos(data.filter(e => e.latitude !== null && e.longitude !== null)))
      .catch(() => {});
  };

  useIonViewWillEnter(() => {
    fetchEstabelecimentos(notaMinima);
  });

  const handleNotaChange = (val: number | undefined) => {
    setNotaMinima(val);
    fetchEstabelecimentos(val);
  };

  const onAvaliacaoChange = (val: string) => {
    setFiltroAvaliacao(val);
    if (val === 'qualquer') {
      handleNotaChange(undefined);
    } else {
      handleNotaChange(Number(val));
    }
  };

  const getAvaliacaoLabel = () => {
    if (filtroAvaliacao === 'qualquer') return 'Qualquer Nota';
    return `${filtroAvaliacao}+ Estrelas`;
  };

  // Helper: obtém a posição do usuário via Geolocation API
  const obterPosicaoUsuario = async (): Promise<[number, number] | null> => {
    try {
      const pos = await Geolocation.getCurrentPosition();
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setPosicaoUsuario(coords);
      return coords;
    } catch {
      return null;
    }
  };

  const centralizarNoUsuario = async () => {
    const coords = await obterPosicaoUsuario();
    if (coords) {
      setCentro(coords);
      centroKey.current += 1;
    }
  };

  const toggleFiltro = async (f: Filtro) => {
    if (filtro === f) {
      // Desativa o filtro
      setFiltro(null);
      return;
    }

    if (f === 'proximos') {
      // Solicita geolocalização automaticamente se ainda não tiver
      let coords = posicaoUsuario;
      if (!coords) {
        coords = await obterPosicaoUsuario();
      }
      if (!coords) {
        // Não conseguiu obter localização — não ativa o filtro
        return;
      }
      // Centraliza o mapa no usuário ao ativar "Mais Próximos"
      setCentro(coords);
      centroKey.current += 1;
    }

    setFiltro(f);
  };

  const filtrados = useMemo(() => {
    let result = busca.trim() === ''
      ? [...estabelecimentos]
      : estabelecimentos.filter(e =>
          e.nome_fantasia.toLowerCase().includes(busca.toLowerCase()),
        );

    if (filtro === 'proximos' && posicaoUsuario) {
      // Filtra por raio E ordena por distância crescente
      result = result
        .map(e => ({
          ...e,
          _dist: haversine(posicaoUsuario[0], posicaoUsuario[1], e.latitude!, e.longitude!),
        }))
        .filter(e => e._dist <= RAIO_PROXIMOS_KM)
        .sort((a, b) => a._dist - b._dist);
    }

    if (filtro === 'abertos') {
      result = result.filter(e => isAberto(e));
    }

    return result;
  }, [estabelecimentos, busca, filtro, posicaoUsuario, filtroAvaliacao]);

  return (
    <IonPage className="lm-page">
      <IonHeader className="ion-no-border mapa-header-floating">
        <IonToolbar className="mapa-toolbar-floating">
          <div className="mapa-glass-panel">
            <div className="mapa-title-row">
              <button 
                className="mapa-back-btn" 
                onClick={() => history.length > 1 ? history.goBack() : history.replace('/')}
              >
                <IonIcon icon={arrowBackOutline} />
              </button>
              <p className="mapa-titulo">Encontre um Lava-Me</p>
            </div>

            <IonSearchbar
              value={busca}
              onIonInput={e => setBusca(e.detail.value ?? '')}
              placeholder="Buscar lava-jato..."
              debounce={200}
              className="mapa-searchbar-glass"
            />

            <div className="mapa-filtros-glass">
              <IonChip
                className={filtro === 'proximos' ? 'chip-glass-ativo' : 'chip-glass-inativo'}
                onClick={() => toggleFiltro('proximos')}
              >
                <IonIcon icon={locationOutline} className="chip-icon" />
                <IonLabel>Mais Próximos</IonLabel>
              </IonChip>
              <IonChip
                className={filtro === 'abertos' ? 'chip-glass-ativo' : 'chip-glass-inativo'}
                onClick={() => toggleFiltro('abertos')}
              >
                <IonIcon icon={timeOutline} className="chip-icon" />
                <IonLabel>Abertos</IonLabel>
              </IonChip>

              <IonChip id="trigger-avaliacao" className={filtroAvaliacao !== 'qualquer' ? 'chip-glass-ativo' : 'chip-glass-inativo'}>
                <IonIcon icon={star} className="chip-icon" />
                <IonLabel>{getAvaliacaoLabel()}</IonLabel>
                <IonIcon icon={chevronDownOutline} className="chip-icon-down" />
              </IonChip>

              <IonPopover trigger="trigger-avaliacao" dismissOnSelect={true} className="avaliacao-popover">
                <IonContent>
                  <div className="avaliacao-menu">
                    <div 
                      className="avaliacao-header"
                      onClick={() => onAvaliacaoChange('qualquer')}
                    >
                      Qualquer Nota
                    </div>
                    {[
                      { value: '5.0', stars: 5, label: '5+ estrelas' },
                      { value: '4.0', stars: 4, label: '4+ estrelas' },
                      { value: '3.0', stars: 3, label: '3+ estrelas' },
                      { value: '2.0', stars: 2, label: '2+ estrelas' },
                      { value: '1.0', stars: 1, label: '1+ estrelas' }
                    ].map(opt => (
                      <div 
                        key={opt.value} 
                        className={`avaliacao-item ${filtroAvaliacao === opt.value ? 'selected' : ''}`}
                        onClick={() => onAvaliacaoChange(opt.value)}
                      >
                        <div className="avaliacao-stars">
                          {[1, 2, 3, 4, 5].map(s => (
                            <IonIcon 
                              key={s} 
                              icon={star} 
                              className={s <= opt.stars ? 'star-filled' : 'star-empty'} 
                            />
                          ))}
                        </div>
                        <span className="avaliacao-label">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </IonContent>
              </IonPopover>
            </div>

            <span className="mapa-contador-glass">
              {filtrados.length} encontrado{filtrados.length !== 1 ? 's' : ''}
            </span>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent scrollY={false} className="mapa-content">
        <MapContainer
          center={centro}
          zoom={13}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
          key={`${centro.join(',')}-${centroKey.current}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEvents onClick={() => setSelecionado(null)} />
          {filtrados.map(e => (
            <Marker
              key={`${e.id}-${e.logo}-${selecionado?.id === e.id}`}
              position={[e.latitude as number, e.longitude as number]}
              icon={criarPin(e, selecionado?.id === e.id)}
              eventHandlers={{ click: () => setSelecionado(e) }}
            />
          ))}
        </MapContainer>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={centralizarNoUsuario}>
            <IonIcon icon={locateOutline} />
          </IonFabButton>
        </IonFab>

        <EstabelecimentoDrawer
          estabelecimento={selecionado}
          posicaoUsuario={posicaoUsuario}
          onClose={() => setSelecionado(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
