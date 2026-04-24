-- Relationship of the member to the baby (엄마/아빠/할머니/산후도우미 등)
alter table baby_members add column if not exists relationship text;
