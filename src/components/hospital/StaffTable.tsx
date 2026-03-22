import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { toast } from "sonner";
import {
  getRoleText,
  getStaffStatusText,
  getRoleBadgeClass,
  getStaffStatusBadgeClass,
  getStaffStatusIcon,
  getRoleIcon,
  getAvatarBgClass,
} from "../../utils/statusHelpers";
import type { Staff } from "@/types/database";
import { Eye, Edit, Shield, MapPin, Phone, Mail, Users } from 'lucide-react';

interface StaffTableProps {
  filteredStaff: Staff[];
  onViewDetails: (member: Staff) => void;
  onEmergencyCall: (staffId: string) => void;
}

export function StaffTable({ filteredStaff, onViewDetails, onEmergencyCall }: StaffTableProps) {
  return (
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
                          <p>{member.shift_start} - {member.shift_end}</p>
                          <p className="text-muted-foreground">{member.shift === 'day' ? '주간' : member.shift === 'night' ? '야간' : '저녁'}근무</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-muted-foreground" />
                          {member.current_location}
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
                          <Button variant="ghost" size="sm" onClick={() => onViewDetails(member)} aria-label="상세보기">
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toast.info("추후 지원 예정입니다")} aria-label="직원 정보 수정">
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
                                <AlertDialogAction onClick={() => onEmergencyCall(member.id)}>
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
  );
}
