import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { getRoleText, getStaffStatusText } from "../../utils/statusHelpers";
import { mockStaff, type StaffMember } from "@/mocks/staffData";
import {
  Search,
  Plus,
  Eye,
  Edit,
  UserCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Stethoscope,
  Activity,
  Shield
} from 'lucide-react';


const getStaffStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'on-duty': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    case 'off-duty': return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
    case 'break': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'emergency': return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
  }
};

const getRoleBadgeClass = (role: string): string => {
  switch (role) {
    case 'doctor': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
    case 'nurse': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    case 'technician': return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50';
    case 'admin': return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
    default: return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50';
  }
};

const getStaffStatusIcon = (status: string) => {
  switch (status) {
    case 'on-duty': return '\u25CF'; // ●
    case 'break': return '\u25CB';   // ○
    case 'off-duty': return '\u2014'; // —
    case 'emergency': return '\u26A0'; // ⚠
    default: return '';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'doctor': return Stethoscope;
    case 'nurse': return UserCheck;
    case 'technician': return Activity;
    case 'admin': return Shield;
    default: return UserCheck;
  }
};

const getAvatarBgClass = (role: string): string => {
  switch (role) {
    case 'doctor': return 'bg-blue-100 text-blue-700';
    case 'nurse': return 'bg-green-100 text-green-700';
    case 'technician': return 'bg-amber-100 text-amber-700';
    case 'admin': return 'bg-slate-100 text-slate-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || member.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const staffStats = {
    total: staff.length,
    onDuty: staff.filter(s => s.status === 'on-duty').length,
    offDuty: staff.filter(s => s.status === 'off-duty').length,
    onBreak: staff.filter(s => s.status === 'break').length,
    emergency: staff.filter(s => s.status === 'emergency').length
  };

  const handleAddStaff = () => {
    toast.success("새 직원 등록 폼이 열렸습니다.");
  };

  const handleViewDetails = (member: StaffMember) => {
    setSelectedStaff(member);
  };

  const handleStatusChange = (staffId: string, newStatus: string) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, status: newStatus as StaffMember['status'] } : s));
    toast.success(`직원 ${staffId}의 상태가 ${getStaffStatusText(newStatus)}로 변경되었습니다.`);
  };

  const handleEmergencyCall = (staffId: string) => {
    setStaff(prev => prev.map(s => s.id === staffId ? { ...s, status: 'emergency' as StaffMember['status'] } : s));
    toast.success(`${staffId} 직원에게 응급호출이 발송되었습니다.`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">직원 관리</h1>
          <p className="text-muted-foreground mt-1">응급실 직원 현황 및 근무 상태를 관리합니다</p>
        </div>
        <Button onClick={handleAddStaff} className="flex items-center gap-2">
          <Plus size={16} />
          새 직원 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="이름, ID, 부서로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="직원 검색"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="직종" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 직종</SelectItem>
                <SelectItem value="doctor">의사</SelectItem>
                <SelectItem value="nurse">간호사</SelectItem>
                <SelectItem value="technician">기사</SelectItem>
                <SelectItem value="admin">관리자</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="on-duty">근무중</SelectItem>
                <SelectItem value="off-duty">비번</SelectItem>
                <SelectItem value="break">휴식중</SelectItem>
                <SelectItem value="emergency">응급호출</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 직원 목록 */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-full p-2">
              <Users size={20} className="text-primary" />
            </div>
            직원 목록 ({filteredStaff.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>직원</TableHead>
                  <TableHead>직종</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>근무시간</TableHead>
                  <TableHead>현재위치</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <p className="text-lg font-medium">검색 결과가 없습니다</p>
                        <p className="text-sm mt-1">필터 조건을 변경해 보세요</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => {
                    const RoleIcon = getRoleIcon(member.role);
                    const initials = member.name.slice(0, 1);
                    return (
                      <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className={getAvatarBgClass(member.role)}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeClass(member.role)}>
                            <RoleIcon size={12} className="mr-1" />
                            {getRoleText(member.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.department}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{member.shiftStart} - {member.shiftEnd}</p>
                            <p className="text-muted-foreground">{member.shift === 'day' ? '주간' : member.shift === 'night' ? '야간' : '저녁'}근무</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-muted-foreground" />
                            {member.currentLocation}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span aria-hidden="true">{getStaffStatusIcon(member.status)}</span>
                            <Badge variant="outline" className={getStaffStatusBadgeClass(member.status)}>
                              {getStaffStatusText(member.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone size={12} />
                              {member.phone}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail size={12} />
                              {member.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { handleViewDetails(member); setDialogOpen(true); }} aria-label="상세보기">
                              <Eye size={14} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toast.success("직원 정보 수정 폼이 열렸습니다.")} aria-label="직원 정보 수정">
                              <Edit size={14} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" aria-label="응급호출">
                                  <Shield size={14} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>응급호출 확인</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {member.name}에게 응급호출을 발송하시겠습니까? 이 작업은 취소할 수 없습니다.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>취소</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleEmergencyCall(member.id)}>
                                    호출 발송
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedStaff && (
            <>
              <DialogHeader>
                <DialogTitle>직원 상세 정보 - {selectedStaff.name}</DialogTitle>
                <DialogDescription>직원 상세 정보입니다.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">직원 ID</Label>
                      <p className="font-medium">{selectedStaff.id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">이름</Label>
                      <p className="font-medium">{selectedStaff.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">직종</Label>
                      <p className="font-medium">{getRoleText(selectedStaff.role)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">부서</Label>
                      <p className="font-medium">{selectedStaff.department}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">경력</Label>
                      <p className="font-medium">{selectedStaff.yearsOfExperience}년</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">전문분야</Label>
                      <p className="font-medium">{selectedStaff.specialization || '-'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 자격증 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">자격증</h4>
                  <div className="flex gap-2">
                    {selectedStaff.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline">{cert}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 연락처 정보 */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">연락처</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">연락처</Label>
                      <p className="font-medium">{selectedStaff.phone}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">이메일</Label>
                      <p className="font-medium">{selectedStaff.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">비상연락처</Label>
                      <p className="font-medium">{selectedStaff.emergencyContact}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">현재 위치</Label>
                      <p className="font-medium">{selectedStaff.currentLocation}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 상태 변경 */}
                <div className="flex gap-2">
                  <Select defaultValue={selectedStaff.status} onValueChange={(value) => handleStatusChange(selectedStaff.id, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on-duty">근무중</SelectItem>
                      <SelectItem value="off-duty">비번</SelectItem>
                      <SelectItem value="break">휴식중</SelectItem>
                      <SelectItem value="emergency">응급호출</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">응급호출</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>응급호출 확인</AlertDialogTitle>
                        <AlertDialogDescription>
                          {selectedStaff.name}에게 응급호출을 발송하시겠습니까?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleEmergencyCall(selectedStaff.id)}>
                          호출 발송
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
