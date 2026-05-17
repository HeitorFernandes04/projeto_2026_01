import React, { useState, useMemo, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonLabel,
  useIonViewWillEnter,
} from '@ionic/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { locateOutline } from 'ionicons/icons';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import { getEstabelecimentos, type EstabelecimentoMapa } from '../../services/api';
import EstabelecimentoDrawer from '../../components/EstabelecimentoDrawer/EstabelecimentoDrawer';
import './Home.css';

// Fix obrigatório para ícones Leaflet com Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const CENTRO_PADRAO: [number, number] = [-10.184, -48.334];

type Filtro = 'proximos' | 'avaliados' | 'abertos' | null;

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

function criarPin(selecionado: boolean) {
  const cor = selecionado ? '#ff3b30' : '#0066ff';
  return L.divIcon({
    className: '',
    html: `<div class="lm-pin" style="background:${cor}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

const Home: React.FC = () => {
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoMapa[]>([]);
  const [selecionado, setSelecionado] = useState<EstabelecimentoMapa | null>(null);
  const [centro, setCentro] = useState<[number, number]>(CENTRO_PADRAO);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>(null);
  const [posicaoUsuario, setPosicaoUsuario] = useState<[number, number] | null>(null);
  const centroKey = useRef(0);

  useIonViewWillEnter(() => {
    getEstabelecimentos()
      .then(data => setEstabelecimentos(data.filter(e => e.latitude !== null && e.longitude !== null)))
      .catch(() => {});
  });

  const centralizarNoUsuario = async () => {
    try {
      const pos = await Geolocation.getCurrentPosition();
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setPosicaoUsuario(coords);
      setCentro(coords);
      centroKey.current += 1;
    } catch {
      // Permissão negada — mantém o centro atual
    }
  };

  const toggleFiltro = (f: Filtro) => setFiltro(prev => (prev === f ? null : f));

  const filtrados = useMemo(() => {
    let result = busca.trim() === ''
      ? [...estabelecimentos]
      : estabelecimentos.filter(e =>
          e.nome_fantasia.toLowerCase().includes(busca.toLowerCase()),
        );

    if (filtro === 'proximos' && posicaoUsuario) {
      result.sort((a, b) => {
        const da = haversine(posicaoUsuario[0], posicaoUsuario[1], a.latitude!, a.longitude!);
        const db = haversine(posicaoUsuario[0], posicaoUsuario[1], b.latitude!, b.longitude!);
        return da - db;
      });
    } else if (filtro === 'avaliados') {
      result.sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0));
    } else if (filtro === 'abertos') {
      result = result.filter(e => isAberto(e));
    }

    return result;
  }, [estabelecimentos, busca, filtro, posicaoUsuario]);

  return (
    <IonPage className="lm-page">
      <IonContent>
        <MapContainer
          center={centro}
          zoom={13}
          style={{ height: '100vh', width: '100%' }}
          key={`${centro.join(',')}-${centroKey.current}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filtrados.map(e => (
            <Marker
              key={e.id}
              position={[e.latitude as number, e.longitude as number]}
              icon={criarPin(selecionado?.id === e.id)}
              eventHandlers={{ click: () => setSelecionado(e) }}
            />
          ))}
        </MapContainer>

        <div className="mapa-overlay">
          <p className="mapa-titulo">Encontre um Lava-Me próximo</p>

          <IonSearchbar
            value={busca}
            onIonInput={e => setBusca(e.detail.value ?? '')}
            placeholder="Buscar lava-jato..."
            debounce={200}
            className="mapa-searchbar"
          />

          <div className="mapa-filtros">
            <IonChip
              className={filtro === 'proximos' ? 'chip-ativo' : 'chip-inativo'}
              onClick={() => toggleFiltro('proximos')}
            >
              <IonLabel>📍 Mais próximos</IonLabel>
            </IonChip>
            <IonChip
              className={filtro === 'avaliados' ? 'chip-ativo' : 'chip-inativo'}
              onClick={() => toggleFiltro('avaliados')}
            >
              <IonLabel>⭐ Melhor avaliados</IonLabel>
            </IonChip>
            <IonChip
              className={filtro === 'abertos' ? 'chip-ativo' : 'chip-inativo'}
              onClick={() => toggleFiltro('abertos')}
            >
              <IonLabel>🟢 Abertos</IonLabel>
            </IonChip>
          </div>

          <span className="mapa-contador">{filtrados.length} encontrado{filtrados.length !== 1 ? 's' : ''}</span>
        </div>

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
