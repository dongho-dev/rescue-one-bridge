-- #81: DB 제약 조건 추가 — messages content 길이 제한, audit_logs ENUM CHECK
-- messages.content: 1~2000자로 제한
-- audit_logs.action: 허용 값 목록 (view, create, update, delete, match)
-- audit_logs.resource_type: 허용 값 목록 (request, patient, bed, staff, equipment, hospital)

ALTER TABLE messages ADD CONSTRAINT chk_content_length
  CHECK (char_length(content) BETWEEN 1 AND 2000);

ALTER TABLE audit_logs ADD CONSTRAINT chk_action_enum
  CHECK (action IN ('view', 'create', 'update', 'delete', 'match'));

ALTER TABLE audit_logs ADD CONSTRAINT chk_resource_type_enum
  CHECK (resource_type IN ('request', 'patient', 'bed', 'staff', 'equipment', 'hospital'));
