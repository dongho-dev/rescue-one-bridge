import { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useStaff } from '@/hooks/useStaff';
import { LoadingState } from '../common/LoadingState';
import { StaffFilters } from './StaffFilters';
import { StaffTable } from './StaffTable';
import { StaffDetailDialog } from './StaffDetailDialog';
import type { Staff, StaffStatus } from '@/types/database';
import { Plus, Clock, Calendar, Users, Activity, Shield } from 'lucide-react';

export function StaffManagement() {
  const { staff, loading, error, refetch, updateStaffStatus } = useStaff();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredStaff = useMemo(
    () =>
      staff.filter((member) => {
        const matchesSearch =
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (member.department ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'all' || member.role === selectedRole;
        const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
      }),
    [staff, searchTerm, selectedRole, selectedStatus],
  );

  const staffStats = useMemo(
    () => ({
      total: staff.length,
      onDuty: staff.filter((s) => s.status === 'on_duty').length,
      offDuty: staff.filter((s) => s.status === 'off_duty').length,
      onBreak: staff.filter((s) => s.status === 'break').length,
      emergency: staff.filter((s) => s.status === 'emergency').length,
    }),
    [staff],
  );

  const handleAddStaff = () => {
    toast.info('추후 지원 예정입니다');
  };

  const handleViewDetails = (member: Staff) => {
    setSelectedStaff(member);
    setDialogOpen(true);
  };

  const handleStatusChange = async (staffId: string, newStatus: string) => {
    const status = newStatus as StaffStatus;
    await updateStaffStatus(staffId, status);
  };

  const handleEmergencyCall = async (staffId: string) => {
    await updateStaffStatus(staffId, 'emergency');
  };

  return (
    <LoadingState loading={loading} error={error} onRetry={refetch}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">직원 관리</h1>
            <p className="text-muted-foreground mt-1">응급실 직원 현황 및 근무 상태를 관리합니다</p>
          </div>
          <Button onClick={handleAddStaff} className="flex items-center gap-2">
            <Plus size={16} />새 직원 등록
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="bg-slate-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                  <Users className="text-slate-600" size={20} />
                </div>
                <p className="text-sm text-muted-foreground">전체 직원</p>
                <p className="text-2xl font-bold">{staffStats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="bg-green-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                  <Activity className="text-green-600" size={20} />
                </div>
                <p className="text-sm text-muted-foreground">근무중</p>
                <p className="text-2xl font-bold text-green-600">{staffStats.onDuty}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="bg-slate-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                  <Clock className="text-slate-600" size={20} />
                </div>
                <p className="text-sm text-muted-foreground">비번</p>
                <p className="text-2xl font-bold text-slate-600">{staffStats.offDuty}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="bg-amber-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                  <Calendar className="text-amber-600" size={20} />
                </div>
                <p className="text-sm text-muted-foreground">휴식중</p>
                <p className="text-2xl font-bold text-amber-600">{staffStats.onBreak}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="bg-red-500/10 rounded-full p-2 w-fit mx-auto mb-2">
                  <Shield className="text-red-600" size={20} />
                </div>
                <p className="text-sm text-muted-foreground">응급호출</p>
                <p className="text-2xl font-bold text-red-600">{staffStats.emergency}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 필터 */}
        <StaffFilters
          searchTerm={searchTerm}
          selectedRole={selectedRole}
          selectedStatus={selectedStatus}
          onSearchChange={setSearchTerm}
          onRoleChange={setSelectedRole}
          onStatusChange={setSelectedStatus}
        />

        {/* 직원 목록 */}
        <StaffTable
          filteredStaff={filteredStaff}
          onViewDetails={handleViewDetails}
          onEmergencyCall={handleEmergencyCall}
        />

        {/* 직원 상세 다이얼로그 */}
        <StaffDetailDialog
          staff={selectedStaff}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onStatusChange={handleStatusChange}
          onEmergencyCall={handleEmergencyCall}
        />
      </div>
    </LoadingState>
  );
}
