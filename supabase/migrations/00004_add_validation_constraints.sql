-- Add CHECK constraints for input validation
-- patient_age: 0~150 range
-- display_name: 2~50 characters

ALTER TABLE requests
  ADD CONSTRAINT chk_patient_age
    CHECK (patient_age IS NULL OR (patient_age >= 0 AND patient_age <= 150));

ALTER TABLE profiles
  ADD CONSTRAINT chk_display_name_length
    CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 50);
