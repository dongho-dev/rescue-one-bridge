import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { getRoleText } from '../../utils/statusHelpers';
import type { Staff } from '@/types/database';

interface StaffDetailDialogProps {
  staff: Staff | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (staffId: string, newStatus: string) => void;
  onEmergencyCall: (staffId: string) => void;
}

export function StaffDetailDialog({
  staff,
  open,
  onOpenChange,
  onStatusChange,
  onEmergencyCall,
}: StaffDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {staff && (
          <>
            <DialogHeader>
              <DialogTitle>직원 상세 정보 - {staff.name}</DialogTitle>
              <DialogDescription>직원 상세 정보입니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">직원 ID</Label>
                    <p className="font-medium">{staff.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">이름</Label>
                    <p className="font-medium">{staff.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">직종</Label>
                    <p className="font-medium">{getRoleText(staff.role)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">부서</Label>
                    <p className="font-medium">{staff.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">경력</Label>
                    <p className="font-medium">{staff.years_of_experience}년</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">전문분야</Label>
                    <p className="font-medium">{staff.specialization || '-'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 자격증 */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  자격증
                </h4>
                <div className="flex gap-2">
                  {staff.certifications.map((cert, index) => (
                    <Badge key={index} variant="outline">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* 연락처 정보 */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  연락처
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">연락처</Label>
                    <p className="font-medium">{staff.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">이메일</Label>
                    <p className="font-medium">{staff.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">비상연락처</Label>
                    <p className="font-medium">{staff.emergency_contact}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">현재 위치</Label>
                    <p className="font-medium">{staff.current_location}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 상태 변경 */}
              <div className="flex gap-2">
                <Select
                  defaultValue={staff.status}
                  onValueChange={(value) => onStatusChange(staff.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_duty">근무중</SelectItem>
                    <SelectItem value="off_duty">비번</SelectItem>
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
                        {staff.name}에게 응급호출을 발송하시겠습니까? 이 작업은 취소할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onEmergencyCall(staff.id)}>
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
  );
}
