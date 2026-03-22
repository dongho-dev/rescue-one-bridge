import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { AlertTriangle, Heart, Activity, Phone, Send } from 'lucide-react';

interface RequestButtonsProps {
  isSubmitting: boolean;
  onRequest: (type: 'emergency' | 'urgent' | 'normal') => void;
}

export function RequestButtons({ isSubmitting, onRequest }: RequestButtonsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Send size={18} />
          병원 요청
        </CardTitle>
        <p className="text-xs text-muted-foreground">환자 상태에 따라 요청 유형을 선택하세요</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg font-bold min-h-[56px] shadow-lg shadow-red-600/20 touch-manipulation"
          onClick={() => onRequest('emergency')}
          disabled={isSubmitting}
        >
          <AlertTriangle size={22} className="mr-2" />
          {isSubmitting ? '전송 중...' : '응급 요청 (위급)'}
        </Button>

        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold min-h-[52px] touch-manipulation"
          onClick={() => onRequest('urgent')}
          disabled={isSubmitting}
        >
          <Heart size={20} className="mr-2" />
          {isSubmitting ? '전송 중...' : '응급 요청 (긴급)'}
        </Button>

        <Button
          variant="outline"
          className="w-full border-2 border-primary text-primary hover:bg-primary/10 font-medium min-h-[48px] touch-manipulation"
          onClick={() => onRequest('normal')}
          disabled={isSubmitting}
        >
          <Activity size={18} className="mr-2" />
          {isSubmitting ? '전송 중...' : '일반 이송 요청'}
        </Button>

        <Separator className="my-1" />

        <Button variant="ghost" className="w-full text-muted-foreground min-h-[44px] touch-manipulation" disabled onClick={() => toast.info("추후 지원 예정입니다")}>
          <Phone size={16} className="mr-2" />
          병원과 직접 통화
        </Button>
      </CardContent>
    </Card>
  );
}
