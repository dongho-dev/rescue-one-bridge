-- patient_age 범위 제약
ALTER TABLE requests ADD CONSTRAINT chk_patient_age
  CHECK (patient_age IS NULL OR (patient_age >= 0 AND patient_age <= 150));

-- display_name 길이 제약
ALTER TABLE profiles ADD CONSTRAINT chk_display_name_length
  CHECK (char_length(display_name) <= 50);
