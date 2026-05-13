-- Adds a marker for whether the user has completed onboarding (picked species + named pet).
-- The AFTER INSERT trigger on users still seeds a default companion named 'Kyndill';
-- POST /api/pet/initialize updates species/name and sets initialized_at to NOW().

ALTER TABLE pets ADD COLUMN initialized_at TIMESTAMPTZ;
