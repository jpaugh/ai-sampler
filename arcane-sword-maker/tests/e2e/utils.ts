/**
 * Clicks through the StartMenu if present.
 */
export async function bypassStartMenu(page: import('@playwright/test').Page) {
  const newGameButton = page.locator('button:has-text("New Game")');
  if (await newGameButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await newGameButton.click();
  }
}
/**
 * Sets localStorage so the intro will not play and reloads the page.
 * Call after navigation.
 */
export async function skipIntro(page: import('@playwright/test').Page) {
    const introRegion = page.locator('div[aria-label="Intro slide"]');
    while (await introRegion.isVisible()) {
      await introRegion.click();
    }
    await page.waitForSelector('div[aria-label="Intro slide"]',  { state: 'hidden' });
}

/**
 * Utility to set unlocks in localStorage for a test
 */
export async function setUnlocks(page: import('@playwright/test').Page, unlocks: string[]) {
  await page.evaluate((unlocks) => {
    const STORAGE_KEY = 'arcane-sword-maker';
    const SESSION_STORAGE_KEY = 'arcane-sword-maker-session';
    let storage: {
      game?: {
        progression?: {
          unlockedUnlocks?: string[];
        };
        introFinished?: boolean;
      };
    } = {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        storage = JSON.parse(raw);
      } catch (err) { console.error('Failed to parse storage:', err); }
    }
    if (!storage.game) storage.game = {};
    if (!storage.game.progression) storage.game.progression = {};
    storage.game.progression.unlockedUnlocks = unlocks;
    storage.game.introFinished = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    let sessionData: Record<string, unknown> = {};
    const sessionRaw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionRaw) {
      try {
        sessionData = JSON.parse(sessionRaw);
      } catch (err) { console.error('Failed to parse session storage:', err); }
    }
    sessionData.hasSeenStartMenu = true;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
  }, unlocks);
  await page.reload();
}
