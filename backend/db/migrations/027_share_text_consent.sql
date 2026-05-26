-- Second-level consent: sharing the raw text of free-form notes (habit names,
-- feedback notes, mood-ping notes, recovery reflections) with researchers.
-- research_consent on its own only authorizes aggregate / structural data;
-- this flag must additionally be TRUE for the research portal to surface the
-- actual text. Default OFF: opting in to the study does not implicitly opt
-- in to text sharing.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS share_text_consent BOOLEAN NOT NULL DEFAULT FALSE;
