-- ============================================================
-- #128: 요청 상태 전환 검증 (상태 머신)
-- BEFORE UPDATE 트리거로 유효하지 않은 상태 전환을 차단
--
-- 허용 전환:
--   pending   → matched    (병원 매칭)
--   pending   → cancelled  (취소)
--   matched   → en_route   (출발)
--   matched   → pending    (거절/재매칭)
--   en_route  → completed  (완료)
--   en_route  → cancelled  (취소)
--
-- 역할별 제한:
--   paramedic: pending→cancelled, en_route→completed만 허용
-- ============================================================

CREATE OR REPLACE FUNCTION validate_request_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- 상태가 변경되지 않으면 통과
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- 허용된 전환인지 확인
  IF NOT (
    (OLD.status = 'pending'   AND NEW.status = 'matched')   OR
    (OLD.status = 'pending'   AND NEW.status = 'cancelled') OR
    (OLD.status = 'matched'   AND NEW.status = 'en_route')  OR
    (OLD.status = 'matched'   AND NEW.status = 'pending')   OR
    (OLD.status = 'en_route'  AND NEW.status = 'completed') OR
    (OLD.status = 'en_route'  AND NEW.status = 'cancelled')
  ) THEN
    RAISE EXCEPTION 'Invalid status transition: % → %', OLD.status, NEW.status;
  END IF;

  -- 역할별 제한 확인
  SELECT role::text INTO v_role FROM profiles WHERE id = auth.uid();

  IF v_role = 'paramedic' THEN
    -- paramedic은 pending→cancelled, en_route→completed만 허용
    IF NOT (
      (OLD.status = 'pending'  AND NEW.status = 'cancelled') OR
      (OLD.status = 'en_route' AND NEW.status = 'completed')
    ) THEN
      RAISE EXCEPTION 'Paramedic not authorized for transition: % → %', OLD.status, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- 기존 트리거가 있으면 제거 후 재생성
DROP TRIGGER IF EXISTS trg_validate_request_status ON requests;

CREATE TRIGGER trg_validate_request_status
  BEFORE UPDATE OF status ON requests
  FOR EACH ROW
  EXECUTE FUNCTION validate_request_status_transition();
