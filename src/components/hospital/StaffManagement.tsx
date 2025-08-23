import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { toast } from "sonner";
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

interface StaffMember {
  id: string;
  name: string;
  role: 'doctor' | 'nurse' | 'technician' | 'admin';
  department: string;
  shift: 'day' | 'night' | 'evening';
  status: 'on-duty' | 'off-duty' | 'break' | 'emergency';
  phone: string;
  email: string;
  specialization?: string;
  yearsOfExperience: number;
  currentLocation: string;
  shiftStart: string;
  shiftEnd: string;
  certifications: string[];
  emergencyContact: string;
}

const mockStaff: StaffMember[] = [
  {
    id: 'DOC001',
    name: '김의사',
    role: 'doctor',
    department: '응급의학과',
    shift: 'day',
    status: 'on-duty',
    phone: '010-1234-5678',
    email: 'kim.doctor@hospital.com',
    specialization: '외상외과',
    yearsOfExperience: 8,
    currentLocation: '응급실 A구역',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['ACLS', 'ATLS', 'BLS'],
    emergencyContact: '010-9876-5432'
  },
  {
    id: 'DOC002',
    name: '이의사',
    role: 'doctor',
    department: '응급의학과',
    shift: 'night',
    status: 'off-duty',
    phone: '010-2345-6789',
    email: 'lee.doctor@hospital.com',
    specialization: '내과',
    yearsOfExperience: 12,
    currentLocation: '대기실',
    shiftStart: '18:00',
    shiftEnd: '08:00',
    certifications: ['ACLS', 'BLS', 'PALS'],
    emergencyContact: '010-8765-4321'
  },
  {
    id: 'NUR001',
    name: '박간호사',
    role: 'nurse',
    department: '응급실',
    shift: 'day',
    status: 'on-duty',
    phone: '010-3456-7890',
    email: 'park.nurse@hospital.com',
    yearsOfExperience: 5,
    currentLocation: '응급실 B구역',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['BLS', 'ACLS'],
    emergencyContact: '010-7654-3210'
  },
  {
    id: 'NUR002',
    name: '최간호사',
    role: 'nurse',
    department: '응급실',
    shift: 'evening',
    status: 'break',
    phone: '010-4567-8901',
    email: 'choi.nurse@hospital.com',
    yearsOfExperience: 3,
    currentLocation: '휴게실',
    shiftStart: '14:00',
    shiftEnd: '22:00',
    certifications: ['BLS'],
    emergencyContact: '010-6543-2109'
  },
  {
    id: 'TEC001',
    name: '정기사',
    role: 'technician',
    department: '방사선과',
    shift: 'day',
    status: 'on-duty',
    phone: '010-5678-9012',
    email: 'jung.tech@hospital.com',
    specialization: 'X-ray, CT',
    yearsOfExperience: 7,
    currentLocation: '영상의학과',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['방사선사', 'CT 전문'],
    emergencyContact: '010-5432-1098'
  },
  {
    id: 'ADM001',
    name: '송관리자',
    role: 'admin',
    department: '응급실 관리',
    shift: 'day',
    status: 'on-duty',
    phone: '010-6789-0123',
    email: 'song.admin@hospital.com',
    yearsOfExperience: 10,
    currentLocation: '관리실',
    shiftStart: '08:00',
    shiftEnd: '18:00',
    certifications: ['병원관리사'],
    emergencyContact: '010-4321-0987'
  }
];

const getRoleColor = (role: string) => {
  switch (role) {
    case 'doctor': return 'default';
    case 'nurse': return 'secondary';
    case 'technician': return 'outline';
    case 'admin': return 'destructive';
    default: return 'outline';
  }
};

const getRoleText = (role: string) => {
  switch (role) {
    case 'doctor': return '의사';
    case 'nurse': return '간호사';
    case 'technician': return '기사';
    case 'admin': return '관리자';
    default: return role;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-duty': return 'default';
    case 'off-duty': return 'secondary';
    case 'break': return 'outline';
    case 'emergency': return 'destructive';
    default: return 'outline';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'on-duty': return '근무중';
    case 'off-duty': return '비번';
    case 'break': return '휴식중';
    case 'emergency': return '응급호출';
    default: return status;
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

export function StaffManagement() {
  const [staff] = useState<StaffMember[]>(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

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
    toast.success(`직원 ${staffId}의 상태가 ${getStatusText(newStatus)}로 변경되었습니다.`);
  };

  const handleEmergencyCall = (staffId: string) => {
    toast.success(`${staffId} 직원에게 응급호출이 발송되었습니다.`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>직원 관리</h1>
          <p className="text-muted-foreground">응급실 직원 현황 및 근무 관리</p>
        </div>
        <Button onClick={handleAddStaff} className="flex items-center gap-2">
          <Plus size={16} />
          새 직원 등록
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Users className="mx-auto mb-2 text-muted-foreground" size={20} />
              <p className="text-sm text-muted-foreground">전체 직원</p>
              <p className="text-2xl font-bold">{staffStats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Activity className="mx-auto mb-2 text-green-600" size={20} />
              <p className="text-sm text-muted-foreground">근무중</p>
              <p className="text-2xl font-bold text-green-600">{staffStats.onDuty}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Clock className="mx-auto mb-2 text-gray-600" size={20} />
              <p className="text-sm text-muted-foreground">비번</p>
              <p className="text-2xl font-bold text-gray-600">{staffStats.offDuty}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Calendar className="mx-auto mb-2 text-blue-600" size={20} />
              <p className="text-sm text-muted-foreground">휴식중</p>
              <p className="text-2xl font-bold text-blue-600">{staffStats.onBreak}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <Shield className="mx-auto mb-2 text-red-600" size={20} />
              <p className="text-sm text-muted-foreground">응급호출</p>
              <p className="text-2xl font-bold text-red-600">{staffStats.emergency}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="이름, ID, 부서로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            직원 목록 ({filteredStaff.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                {filteredStaff.map((member) => {
                  const RoleIcon = getRoleIcon(member.role);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              <RoleIcon size={16} />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleColor(member.role) as any}>
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
                        <Badge variant={getStatusColor(member.status) as any}>
                          {getStatusText(member.status)}
                        </Badge>
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(member)}>
                                <Eye size={14} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>직원 상세 정보 - {member.name}</DialogTitle>
                              </DialogHeader>
                              {selectedStaff && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>직원 ID</Label>
                                      <p>{selectedStaff.id}</p>
                                    </div>
                                    <div>
                                      <Label>이름</Label>
                                      <p>{selectedStaff.name}</p>
                                    </div>
                                    <div>
                                      <Label>직종</Label>
                                      <p>{getRoleText(selectedStaff.role)}</p>
                                    </div>
                                    <div>
                                      <Label>부서</Label>
                                      <p>{selectedStaff.department}</p>
                                    </div>
                                    <div>
                                      <Label>경력</Label>
                                      <p>{selectedStaff.yearsOfExperience}년</p>
                                    </div>
                                    <div>
                                      <Label>전문분야</Label>
                                      <p>{selectedStaff.specialization || '-'}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label>자격증</Label>
                                    <div className="flex gap-2 mt-2">
                                      {selectedStaff.certifications.map((cert, index) => (
                                        <Badge key={index} variant="outline">{cert}</Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>연락처</Label>
                                      <p>{selectedStaff.phone}</p>
                                    </div>
                                    <div>
                                      <Label>이메일</Label>
                                      <p>{selectedStaff.email}</p>
                                    </div>
                                    <div>
                                      <Label>비상연락처</Label>
                                      <p>{selectedStaff.emergencyContact}</p>
                                    </div>
                                    <div>
                                      <Label>현재 위치</Label>
                                      <p>{selectedStaff.currentLocation}</p>
                                    </div>
                                  </div>

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
                                    <Button variant="destructive" onClick={() => handleEmergencyCall(selectedStaff.id)}>
                                      응급호출
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" onClick={() => toast.success("직원 정보 수정 폼이 열렸습니다.")}>
                            <Edit size={14} />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleEmergencyCall(member.id)}>
                            <Shield size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}