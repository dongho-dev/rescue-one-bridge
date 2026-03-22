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

function getAmbulanceIcon(severity?: number): L.DivIcon {
  const color = severity != null && severity >= 4 ? '#ef4444'
    : severity != null && severity >= 3 ? '#f59e0b'
    : '#3b82f6';
  return new L.DivIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px ${color}80;animation:pulse 2s infinite"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

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

export interface AmbulancePosition {
  id: string;
  latitude: number;
  longitude: number;
  eta_minutes?: number | null;
  severity?: number;
  patient_name?: string | null;
}

interface AmbulanceMapProps {
  title?: string;
  ambulancePosition?: GeoPosition | null; // 하위호환 (ParamedicDashboard 사용)
  ambulancePositions?: AmbulancePosition[]; // 다중 구급차 (HospitalDashboard 사용)
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
  ambulancePositions,
  hospitals = [],
  className,
}: AmbulanceMapProps) {
  // 다중 구급차 위치가 있으면 첫 번째를 중심으로, 없으면 단일 위치 사용
  const firstMulti = ambulancePositions?.[0];
  const center = firstMulti
    ? { latitude: firstMulti.latitude, longitude: firstMulti.longitude }
    : ambulancePosition ?? { latitude: 37.4979, longitude: 127.0276 };

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

            {/* 다중 구급차 마커 (HospitalDashboard용) */}
            {ambulancePositions && ambulancePositions.length > 0 && (
              <>
                <MapUpdater position={{ latitude: ambulancePositions[0].latitude, longitude: ambulancePositions[0].longitude }} />
                {ambulancePositions.map((amb) => (
                  <Marker
                    key={amb.id}
                    position={[amb.latitude, amb.longitude]}
                    icon={getAmbulanceIcon(amb.severity)}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{amb.patient_name || '환자'}</strong>
                        <br />
                        요청 ID: {amb.id}
                        {amb.eta_minutes != null && (
                          <>
                            <br />
                            ETA: {amb.eta_minutes}분
                          </>
                        )}
                        {amb.severity != null && (
                          <>
                            <br />
                            중증도: {amb.severity}/5
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}

            {/* 단일 구급차 마커 (ParamedicDashboard 하위호환) */}
            {!ambulancePositions?.length && ambulancePosition && (
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
