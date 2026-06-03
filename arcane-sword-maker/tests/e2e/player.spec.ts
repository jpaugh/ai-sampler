import { test, expect } from '@playwright/test';
import { skipIntro, setUnlocks, bypassStartMenu } from './utils';

const selectors = {
  introNext: 'button:has-text("Next")',
  introFinish: 'button:has-text("Finish")',
  enchantTab: '[role="tab"][aria-controls="tab-panel-enchant"]',
  buyTab: '[role="tab"][aria-controls="tab-panel-buy"]',
  chancesTab: '[role="tab"][aria-controls="tab-panel-chances"]',
  statsTab: '[role="tab"][aria-controls="tab-panel-stats"]',
  inboxWeapon: '[data-testid="inbox-weapon"]',
  workArea: '[data-testid="work-area"]',
  enchantButton: '[data-testid="enchant-button"]',
  outboxWeapon: '[data-testid="outbox-weapon"]',
  shipItButton: 'button:has-text("Ship it")',
  resetButton: 'button:has-text("Reset game")',
  confirmReset: 'button:has-text("Reset")',
  freeButtonEnchant: '[data-testid="free-button-enchant"]',
  freeButtonShop: '[data-testid="free-button-shop"]',
  progressionModal: 'button:has-text("Continue")',
  donateButton: 'button:has-text("Donate")',
  sellButton: 'button:has-text("Sell")',
  buyButton: 'button[title*="blacksmith"]',
  autoSellToggle: 'button:has-text("Auto-sell")',
  autoBuyToggle: 'button:has-text("Auto-buy")',
};

test.describe('Basic Functionality', () => {
  test('Intro flow and main tabs', async ({ page }) => {
    await page.goto('');
    await page.evaluate(() => {
      window.localStorage.removeItem('arcane-sword-maker');
    });
    await bypassStartMenu(page);
    await page.reload();
    skipIntro(page);
    await page.waitForSelector(selectors.enchantTab, { timeout: 5000 });
    await expect(page.locator(selectors.enchantTab)).toBeVisible();
    await expect(page.locator(selectors.chancesTab)).toBeVisible();
    await expect(page.locator(selectors.statsTab)).toBeVisible();
  });

  test('Start Menu: open and continue', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('text=Arcane Sword Maker')).toBeVisible();
    await page.click('button:has-text("New Game")');
    skipIntro(page);
    await expect(page.locator('button[role="tab"][aria-controls="tab-panel-stats"]')).toBeVisible();

    await page.click('button[role="tab"][aria-controls="tab-panel-stats"]');
    await page.click('button:has-text("Start Menu")');
    await expect(page.locator('text=Arcane Sword Maker')).toBeVisible();
    const continueButton = page.locator('button:has-text("Continue")');
    await expect(continueButton).toBeVisible();
    await continueButton.click();
    await expect(page.locator('button[role="tab"][aria-controls="tab-panel-stats"]')).toBeVisible();
  });

  test('Enchant and ship first weapon', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await skipIntro(page);
    await page.click(selectors.enchantTab);
    await page.click(selectors.freeButtonEnchant);
    const inboxWeapon = page.locator(selectors.inboxWeapon).first();
    const workArea = page.locator(selectors.workArea);
    await expect(inboxWeapon).toBeVisible();
    await inboxWeapon.dragTo(workArea);
    const enchantButton = page.locator(selectors.enchantButton);
    await expect(enchantButton).toBeVisible();
    await expect(enchantButton).toBeEnabled();
    await enchantButton.click();

    const progressionModal = page.locator(selectors.progressionModal);
    await expect(progressionModal).toBeVisible();
    await progressionModal.click();

    await expect(page.locator(selectors.donateButton)).toBeVisible();

    const shipItButton = page.locator(selectors.shipItButton);
    await expect(shipItButton).toBeVisible();
    await expect(shipItButton).toBeEnabled();
    await shipItButton.click();
    await expect(page.locator(selectors.outboxWeapon)).toBeVisible();
  });

  test('Stats and reset', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await skipIntro(page);
    await page.click(selectors.statsTab);
    await page.click(selectors.resetButton);
    await page.locator(selectors.confirmReset).nth(1).click();
    await expect(page.locator(selectors.introNext)).toBeVisible();
  });
});

test.describe('Progression Unlocks', () => {
    test('Unlock: Buy', async ({ page }) => {
      await page.goto('');
      await bypassStartMenu(page);
      await setUnlocks(page, ['donate', 'sell', 'buy']);
      await expect(page.locator(selectors.buyTab)).toBeVisible();
      await page.click(selectors.buyTab);
      const shopWeapons = page.locator('[data-testid="shop-weapon"]');
      const weaponCount = await shopWeapons.count();
      expect(weaponCount).toBeGreaterThan(0);
      await expect(page.locator(selectors.freeButtonShop)).toBeVisible();
      await page.click(selectors.enchantTab);
      await expect(page.locator(selectors.freeButtonEnchant)).toBeHidden();
    });
  test('Unlock: donate', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate']);
    await page.click(selectors.enchantTab);
    await expect(page.locator(selectors.donateButton)).toBeVisible();
  });

  test('Unlock: sell', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell']);
    await page.click(selectors.enchantTab);
    await expect(page.locator(selectors.sellButton)).toBeVisible();
  });

  test('Buy weapon fails with insufficient gold', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell', 'buy']);
    await page.evaluate(() => {
      const STORAGE_KEY = 'arcane-sword-maker';
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const storage = raw ? JSON.parse(raw) : {};
      if (!storage.game) storage.game = {};
      if (!storage.game.progression) storage.game.progression = {};
      storage.game.progression.stats = storage.game.progression.stats || {};
      storage.game.progression.stats.totalSoldValue = 0;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    });
    await page.reload();

    await page.click(selectors.buyTab);
    const shopWeapon = page.locator('[data-testid="shop-weapon"]').first();
    await shopWeapon.click();
    const inventoryWeapon = page.locator(selectors.inboxWeapon);
    await expect(inventoryWeapon).toHaveCount(0);
  });

  test('Buy weapon succeeds with enough gold', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell', 'buy']);
    await page.click(selectors.buyTab);
    const goldText = await page.locator('[data-testid="shop-weapon"] .text-xs.text-center').first().innerText();
    const weaponValue = parseFloat(goldText.replace(/[^\d.]/g, ''));
    await page.evaluate((gold) => {
      const STORAGE_KEY = 'arcane-sword-maker';
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const storage = raw ? JSON.parse(raw) : {};
      if (!storage.game) storage.game = {};
      if (!storage.game.progression) storage.game.progression = {};
      storage.game.progression.stats = storage.game.progression.stats || {};
      storage.game.progression.stats.totalSoldValue = gold;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    }, weaponValue + 100);
    await page.reload();

    await page.click(selectors.buyTab);
    const shopWeapon = page.locator('[data-testid="shop-weapon"]').first();
    await shopWeapon.click();
    const inventoryWeapon = page.locator(selectors.inboxWeapon);
    await expect(inventoryWeapon).toHaveCount(1);

    await page.click(selectors.enchantTab);
  });

  test('Unlock: auto-sell', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell', 'buy', 'auto-sell']);
    await page.click(selectors.enchantTab);
    const autoSellCheckbox = page.locator('[data-testid="autosell-checkbox"]');
    await expect(autoSellCheckbox).toBeVisible();
  });

  test('Unlock: auto-buy', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell', 'buy', 'auto-sell', 'auto-buy']);
    await page.click(selectors.enchantTab);
    const autoBuyCheckbox = page.locator('[data-testid="autobuy-checkbox"]');
    await expect(autoBuyCheckbox).toBeVisible();

    await expect(page.locator(selectors.freeButtonEnchant)).toBeHidden();
    await page.click(selectors.buyTab);
    await expect(page.locator(selectors.freeButtonShop)).toBeVisible();
  });

  test('Auto-buy: inbox refills and gold decreases', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell', 'buy', 'auto-sell', 'auto-buy']);
    await page.evaluate(() => {
      const STORAGE_KEY = 'arcane-sword-maker';
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const storage = raw ? JSON.parse(raw) : {};
      if (!storage.game) storage.game = {};
      if (!storage.game.progression) storage.game.progression = {};
      storage.game.progression.stats = storage.game.progression.stats || {};
      storage.game.progression.stats.totalSoldValue = 100;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    });
    await page.reload();
    await page.click(selectors.enchantTab);
    await page.locator('[data-testid="autobuy-checkbox"]').check();
    let outboxCount = await page.locator(selectors.outboxWeapon).count();
    while (outboxCount > 0) {
      const sellButton = page.locator(selectors.sellButton);
      if (await sellButton.isVisible()) {
        await sellButton.click();
      }
      outboxCount = await page.locator(selectors.outboxWeapon).count();
    }
    await page.click(selectors.buyTab);
    await page.click(selectors.freeButtonShop);
    await page.click(selectors.enchantTab);
    const initialInboxCount = await page.locator(selectors.inboxWeapon).count();
    expect(initialInboxCount).toBeGreaterThan(0);

    for (let i = 0; i < initialInboxCount; i++) {
      const inboxWeapon = page.locator(selectors.inboxWeapon).first();
      const workArea = page.locator(selectors.workArea);
      await inboxWeapon.dragTo(workArea);
      const enchantButton = page.locator(selectors.enchantButton);
      await expect(enchantButton).toBeVisible();
      await expect(enchantButton).toBeEnabled();
      await enchantButton.click();
      await page.waitForTimeout(1500);
      const progressionModal = page.locator(selectors.progressionModal);
      if (await progressionModal.isVisible()) {
        await progressionModal.click();
      }
      const shipItButton = page.locator(selectors.shipItButton);
      if (await shipItButton.isVisible()) {
        await shipItButton.click();
      }
    }
    const finalInboxCount = await page.locator(selectors.inboxWeapon).count();
    expect(finalInboxCount).toBeGreaterThan(0);
    const goldText = await page.locator('[data-testid="gold-display"]').innerText();
    const gold = parseFloat(goldText.replace(/[^\d.]/g, ''));
    expect(gold).toBeLessThan(1000);
  });

  test('Auto-sell: outbox empties and gold increases', async ({ page }) => {
    await page.goto('');
    await bypassStartMenu(page);
    await setUnlocks(page, ['donate', 'sell', 'buy', 'auto-sell', 'auto-buy']);
    await page.evaluate(() => {
      const STORAGE_KEY = 'arcane-sword-maker';
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const storage = raw ? JSON.parse(raw) : {};
      if (!storage.game) storage.game = {};
      storage.game.progression = storage.game.progression || {};
      storage.game.progression.stats = storage.game.progression.stats || {};
      storage.game.progression.stats.totalSoldValue = 0;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    });
    await page.reload();
    await page.click(selectors.enchantTab);
    await page.locator('[data-testid="autosell-checkbox"]').check();

    await page.click(selectors.buyTab);
    await page.click(selectors.freeButtonShop);
    await page.click(selectors.enchantTab);
    const inboxCount = await page.locator(selectors.inboxWeapon).count();
    expect(inboxCount).toBeGreaterThan(0);

    let outboxCount = await page.locator(selectors.outboxWeapon).count();
    const outboxTarget = 6;
    const toShip = outboxCount > outboxTarget ? 0 : outboxTarget - outboxCount;
    for (let i = 0; i < toShip; i++) {
      const inboxWeapon = page.locator(selectors.inboxWeapon).first();
      const workArea = page.locator(selectors.workArea);
      await inboxWeapon.dragTo(workArea);
      const enchantButton = page.locator(selectors.enchantButton);
      await expect(enchantButton).toBeVisible();
      await expect(enchantButton).toBeEnabled();
      await enchantButton.click();
      await page.waitForTimeout(1500);
      const progressionModal = page.locator(selectors.progressionModal);
      if (await progressionModal.isVisible()) {
        await progressionModal.click();
      }
      const shipItButton = page.locator(selectors.shipItButton);
      if (await shipItButton.isVisible()) {
        await shipItButton.click();
      }
    }

    await page.waitForTimeout(1000);

    outboxCount = await page.locator(selectors.outboxWeapon).count();
    expect(outboxCount).toBe(0);
    const goldText = await page.locator('[data-testid="gold-display"]').innerText();
    const gold = parseFloat(goldText.replace(/[^\d.]/g, ''));
    expect(gold).toBeGreaterThan(0);
  });
});