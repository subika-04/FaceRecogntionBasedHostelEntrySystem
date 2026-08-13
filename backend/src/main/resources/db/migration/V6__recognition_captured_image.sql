-- V6__recognition_captured_image.sql
--
-- Previously, when a recognition attempt came back UNKNOWN, only the
-- confidence score and camera were kept -- the actual captured frame was
-- discarded once the Flask AI call finished, so staff had no way to see
-- who the unrecognized person actually was, and admins had nothing to
-- follow up on beyond a bare "Unknown" row.
--
-- This adds a nullable column to store the relative URL of the persisted
-- frame (written to disk by RecognitionService, served back via
-- GET /recognition/images/{filename}), following the same pattern already
-- used for Student.profile_image_url / GET /students/images/{filename}.
-- Nullable because MATCHED/LOW_CONFIDENCE records never populate it, and a
-- handful of UNKNOWN records won't either if the disk write itself fails
-- (recognition must still succeed even if the image can't be saved).

ALTER TABLE recognition_history
    ADD COLUMN captured_image_url VARCHAR(255) NULL AFTER recognition_duration_ms;
