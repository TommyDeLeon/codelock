-- The palette, stored per profile.
--
-- The dashboard and the lock screen are different origins with different local
-- storage, so a theme chosen in one was invisible to the other: the shell
-- could be light while the screen it opened was dark. Moving the choice to the
-- profile is what lets them agree.
--
-- Existing rows take LIGHT, which is what every surface already defaulted to
-- with no preference recorded.

CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

ALTER TABLE "timer_configs"
  ADD COLUMN "theme" "ThemePreference" NOT NULL DEFAULT 'LIGHT';
