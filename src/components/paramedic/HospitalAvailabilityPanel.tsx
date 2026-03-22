import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { AmbulanceMap } from "../common/AmbulanceMap";
import { generateMockHospitals } from "../common/models";
import type { HospitalAvailability } from "@/types/database";
import {
  MapPin,
  Phone,
  Clock,
  Bed,
  Route,
} from 'lucide-react';
import { toast } from "sonner";
import type { GeoPosition } from "@/hooks/useGeolocation";

type HospitalDisplay = {
  id: string;
  name: string;
  accepting: boolean;
  queue: number;
  available_beds: number;
  specialties: string[];
  contact: string | null;
  distance_km: number | null;
  avg_wait_time: number | null;
};

function normalizeHospital(h: HospitalAvailability | ReturnType<typeof generateMockHospitals>[number]): HospitalDisplay {
  if ('hospital_id' in h) {
    return {
      id: h.hospital_id,
      name: h.hospital_name,
      accepting: h.accepting,
      queue: h.queue,
      available_beds: h.available_beds,
      specialties: h.specialties,
      contact: h.contact,
      distance_km: null,
      avg_wait_time: h.avg_wait_time,
    };
  }
  return {
    id: h.id,
    name: h.name,
    accepting: h.accepting,
    queue: h.queue,
    available_beds: h.available_beds,
    specialties: h.specialties,
    contact: h.contact ?? null,
    distance_km: h.distance_km,
    avg_wait_time: h.avg_wait_time ?? null,
  };
}

function getBedCountColor(available_beds: number): string {
  if (available_beds === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
  if (available_beds <= 3) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
}

function HospitalCard({ hospital }: { hospital: HospitalDisplay }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-full text-left p-4 border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="font-medium text-sm">{hospital.name}</h4>
            <Badge variant={hospital.accepting ? "default" : "destructive"}>
              {hospital.accepting ? "수용가능" : "수용불가"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
              <Route size={11} />
              {hospital.distance_km != null ? `${hospital.distance_km}km` : '거리 미확인'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
              <Clock size={11} />
              대기 {hospital.queue}명
            </Badge>
            <Badge className={`flex items-center gap-1 text-xs font-medium border-0 ${getBedCountColor(hospital.available_beds)}`}>
              <Bed size={11} />
              병상 {hospital.available_beds}개
            </Badge>
          </div>
          <div className="flex gap-1.5">
            {hospital.specialties.slice(0, 3).map((specialty, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{specialty}</Badge>
            ))}
          </div>
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{hospital.name}</SheetTitle>
          <SheetDescription>병원 상세 정보</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">수용 상태</p>
            <Badge variant={hospital.accepting ? "default" : "destructive"} className="mt-1">
              {hospital.accepting ? "수용 가능" : "수용 불가"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">거리 및 대기 정보</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">거리</p>
                <p className="text-sm font-semibold">{hospital.distance_km != null ? `${hospital.distance_km}km` : '거리 미확인'}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">ER 대기</p>
                <p className="text-sm font-semibold">{hospital.queue}명</p>
              </div>
              <div className={`p-2 rounded-lg text-center ${getBedCountColor(hospital.available_beds)}`}>
                <p className="text-xs opacity-80">가용 병상</p>
                <p className="text-sm font-semibold">{hospital.available_beds}개</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">평균 대기</p>
                <p className="text-sm font-semibold">{hospital.avg_wait_time != null ? `${hospital.avg_wait_time}분` : '-'}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">전문 진료과</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {hospital.specialties.map((specialty, i) => (
                <Badge key={i} variant="outline">{specialty}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">연락처</p>
            <p className="text-sm mt-1 font-medium">{hospital.contact}</p>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (hospital.contact) {
                window.open(`tel:${hospital.contact}`);
              } else {
                toast("연락처 정보가 없습니다");
              }
            }}
          >
            <Phone size={16} className="mr-2" />
            병원 연락하기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface HospitalAvailabilityPanelProps {
  hospitals: (HospitalAvailability | ReturnType<typeof generateMockHospitals>[number])[];
  rawHospitals: (HospitalAvailability | ReturnType<typeof generateMockHospitals>[number])[];
  position: GeoPosition | null;
}

export function HospitalAvailabilityPanel({ hospitals, rawHospitals, position }: HospitalAvailabilityPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 병원 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={16} />
            근처 병원 수용 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hospitals.slice(0, 5).map((h) => {
            const hospital = normalizeHospital(h);
            return <HospitalCard key={hospital.id} hospital={hospital} />;
          })}
        </CardContent>
      </Card>

      {/* 지도 */}
      <AmbulanceMap
        title="실시간 위치"
        ambulancePosition={position}
        hospitals={rawHospitals
          .filter(h => {
            const lat = 'latitude' in h ? h.latitude : undefined;
            const lng = 'longitude' in h ? h.longitude : undefined;
            return typeof lat === 'number' && typeof lng === 'number';
          })
          .map(h => {
            const hospital = normalizeHospital(h);
            return {
              id: hospital.id,
              name: hospital.name,
              latitude: ('latitude' in h ? h.latitude : 0) as number,
              longitude: ('longitude' in h ? h.longitude : 0) as number,
              accepting: hospital.accepting,
              available_beds: hospital.available_beds,
            };
          })}
      />
    </div>
  );
}
