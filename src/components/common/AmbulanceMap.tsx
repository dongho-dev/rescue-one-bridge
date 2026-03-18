import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Navigation } from 'lucide-react';
import type { GeoPosition } from '@/hooks/useGeolocation';
import 'leaflet/dist/leaflet.css';

// Leaflet 기본 아이콘 경로 수정 (Vite 번들링 호환)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ambulanceIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px rgba(239,68,68,0.6);animation:pulse 2s infinite"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const hospitalIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface HospitalMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  accepting: boolean;
  available_beds: number;
}

interface AmbulanceMapProps {
  title?: string;
  ambulancePosition: GeoPosition | null;
  hospitals?: HospitalMarker[];
  className?: string;
}

function MapUpdater({ position }: { position: GeoPosition }) {
  const map = useMap();
  useEffect(() => {
    map.setView([position.latitude, position.longitude], map.getZoom());
  }, [map, position.latitude, position.longitude]);
  return null;
}

export function AmbulanceMap({
  title = '실시간 위치',
  ambulancePosition,
  hospitals = [],
  className,
}: AmbulanceMapProps) {
  const center = ambulancePosition ?? { latitude: 37.4979, longitude: 127.0276 };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation size={16} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden h-48 sm:h-56">
          <MapContainer
            center={[center.latitude, center.longitude]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {ambulancePosition && (
              <>
                <MapUpdater position={ambulancePosition} />
                <Marker
                  position={[ambulancePosition.latitude, ambulancePosition.longitude]}
                  icon={ambulanceIcon}
                >
                  <Popup>
                    <strong>구급차 현재 위치</strong>
                  </Popup>
                </Marker>
              </>
            )}

            {hospitals.map((h) => (
              <Marker
                key={h.id}
                position={[h.latitude, h.longitude]}
                icon={hospitalIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{h.name}</strong>
                    <br />
                    {h.accepting ? '수용 가능' : '수용 불가'} / 병상 {h.available_beds}개
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
