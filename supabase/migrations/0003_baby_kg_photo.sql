-- Switch baby birth weight from grams to kilograms, add optional photo
-- If any babies rows already exist with birth_weight_g, they'll be kept but weight reset to null.

alter table babies drop column if exists birth_weight_g;
alter table babies add column if not exists birth_weight_kg numeric(4,2);
alter table babies add column if not exists photo_path text;
