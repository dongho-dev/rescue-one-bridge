import { Loader2, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';

interface ProfileEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editDisplayName: string;
  onEditDisplayNameChange: (value: string) => void;
  editPhone: string;
  onEditPhoneChange: (value: string) => void;
  profileSaving: boolean;
  onSave: () => void;
}

export function ProfileEditSheet({
  open,
  onOpenChange,
  editDisplayName,
  onEditDisplayNameChange,
  editPhone,
  onEditPhoneChange,
  profileSaving,
  onSave,
}: ProfileEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>프로필 수정</SheetTitle>
          <SheetDescription>이름과 연락처를 수정할 수 있습니다.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="profile-display-name">이름</Label>
            <Input
              id="profile-display-name"
              value={editDisplayName}
              onChange={(e) => onEditDisplayNameChange(e.target.value)}
              placeholder="이름을 입력하세요"
              disabled={profileSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">연락처</Label>
            <Input
              id="profile-phone"
              type="tel"
              value={editPhone}
              onChange={(e) => onEditPhoneChange(e.target.value)}
              placeholder="010-0000-0000"
              disabled={profileSaving}
            />
          </div>
          <Button className="w-full" onClick={onSave} disabled={profileSaving}>
            {profileSaving ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
