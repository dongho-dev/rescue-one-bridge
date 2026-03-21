import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { supabase } from "@/lib/supabase";
import type { Hospital } from "@/types/database";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  Phone,
  ShieldAlert,
} from 'lucide-react';

export function HospitalAdmin() {
  const { profile } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchHospitals = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('hospitals').select('*').order('name');
    setHospitals((data ?? []) as Hospital[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleDelete = async (id: string, name: string) => {
    if (!supabase) return;
    if (!confirm(`"${name}" 병원을 삭제하시겠습니까?`)) return;

    const { error } = await supabase.from('hospitals').delete().eq('id', id);
    if (error) {
      toast.error('삭제 실패: ' + error.message);
    } else {
      toast.success(`${name} 삭제 완료`);
      await fetchHospitals();
    }
  };

  const handleToggleAccepting = async (id: string, accepting: boolean) => {
    if (!supabase) return;
    await supabase.from('hospitals').update({ accepting }).eq('id', id);
    setHospitals(prev => prev.map(h => h.id === id ? { ...h, accepting } : h));
  };

  // Authorization guard — only hospital_staff can access admin
  if (profile?.role !== 'hospital_staff') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
          <ShieldAlert size={32} className="text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold">접근 권한 없음</h2>
        <p className="text-sm text-muted-foreground">병원 관리는 병원 직원만 사용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-600 text-white rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">병원 관리</h1>
            <p className="text-sm text-muted-foreground">등록된 병원을 관리합니다</p>
          </div>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="min-h-[44px] touch-manipulation">
              <Plus size={18} className="mr-2" />
              병원 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 병원 등록</DialogTitle>
            </DialogHeader>
            <HospitalForm
              onSave={async () => {
                setShowAddDialog(false);
                await fetchHospitals();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            등록된 병원 ({hospitals.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">로딩 중...</p>
          ) : hospitals.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">등록된 병원이 없습니다</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>병원명</TableHead>
                    <TableHead>수용</TableHead>
                    <TableHead>대기열</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hospitals.map(hospital => (
                    <TableRow key={hospital.id}>
                      <TableCell className="font-medium">{hospital.name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={hospital.accepting}
                          onCheckedChange={(v) => handleToggleAccepting(hospital.id, v)}
                        />
                      </TableCell>
                      <TableCell>{hospital.queue}명</TableCell>
                      <TableCell className="text-sm">
                        {hospital.contact ? (
                          <a href={`tel:${hospital.contact}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone size={12} />
                            {hospital.contact}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {hospital.address || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog open={editingId === hospital.id} onOpenChange={(open) => setEditingId(open ? hospital.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 px-2">
                                <Pencil size={14} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>병원 수정</DialogTitle>
                              </DialogHeader>
                              <HospitalForm
                                hospital={hospital}
                                onSave={async () => {
                                  setEditingId(null);
                                  await fetchHospitals();
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(hospital.id, hospital.name)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HospitalForm({ hospital, onSave }: { hospital?: Hospital; onSave: () => Promise<void> }) {
  const [form, setForm] = useState({
    name: hospital?.name ?? '',
    contact: hospital?.contact ?? '',
    address: hospital?.address ?? '',
    latitude: hospital?.latitude?.toString() ?? '',
    longitude: hospital?.longitude?.toString() ?? '',
    specialties: hospital?.specialties?.join(', ') ?? '',
    queue: hospital?.queue?.toString() ?? '0',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!supabase) return;
    if (!form.name.trim()) {
      toast.error('병원명을 입력해주세요');
      return;
    }

    setSaving(true);
    const data = {
      name: form.name.trim(),
      contact: form.contact.trim() || null,
      address: form.address.trim() || null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      specialties: form.specialties ? form.specialties.split(',').map(s => s.trim()).filter(Boolean) : [],
      queue: parseInt(form.queue) || 0,
    };

    if (hospital) {
      const { error } = await supabase.from('hospitals').update(data).eq('id', hospital.id);
      if (error) {
        toast.error('수정 실패: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('병원 정보가 수정되었습니다');
    } else {
      const { error } = await supabase.from('hospitals').insert({ ...data, accepting: true });
      if (error) {
        toast.error('등록 실패: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('병원이 등록되었습니다');
    }

    setSaving(false);
    await onSave();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>병원명 *</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="서울대학교병원" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>연락처</Label>
          <Input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="02-1234-5678" />
        </div>
        <div className="space-y-1.5">
          <Label>대기열</Label>
          <Input type="number" value={form.queue} onChange={e => setForm({ ...form, queue: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>주소</Label>
        <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="서울시 종로구..." />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>위도</Label>
          <Input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="37.5795" />
        </div>
        <div className="space-y-1.5">
          <Label>경도</Label>
          <Input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="126.9990" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>전문과 (쉼표 구분)</Label>
        <Input value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} placeholder="응급의학, 외과, 내과" />
      </div>
      <Button className="w-full min-h-[44px]" onClick={handleSubmit} disabled={saving}>
        <Save size={16} className="mr-2" />
        {saving ? '저장 중...' : (hospital ? '수정' : '등록')}
      </Button>
    </div>
  );
}
