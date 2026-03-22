import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Search } from 'lucide-react';

interface StaffFiltersProps {
  searchTerm: string;
  selectedRole: string;
  selectedStatus: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function StaffFilters({
  searchTerm,
  selectedRole,
  selectedStatus,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: StaffFiltersProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="이름, ID, 부서로 검색..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedRole} onValueChange={onRoleChange}>
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
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="on_duty">근무중</SelectItem>
              <SelectItem value="off_duty">비번</SelectItem>
              <SelectItem value="break">휴식중</SelectItem>
              <SelectItem value="emergency">응급호출</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
