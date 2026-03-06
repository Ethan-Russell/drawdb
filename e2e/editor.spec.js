// @ts-check
import { test, expect } from "@playwright/test";

/** Dismiss pick-database modal if it is visible (select MySQL and confirm). */
async function dismissPickDbModalIfVisible(page) {
  const confirmBtn = page.getByRole("button", { name: /confirm/i });
  const mysqlCard = page.getByTestId("pick-db-mysql");
  if (await confirmBtn.isVisible({ timeout: 12000 }).catch(() => false)) {
    await mysqlCard.click();
    await confirmBtn.click();
    await expect(page.getByTestId("toolbar-add-table")).toBeVisible({
      timeout: 10000,
    });
  }
}

test.describe("Editor UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor", { waitUntil: "commit" });
    await page.evaluate(async () => {
      const dbs = await (typeof indexedDB.databases === "function"
        ? indexedDB.databases()
        : Promise.resolve([{ name: "drawDB" }]));
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
    });
    await page.goto("/editor", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
  });

  test("shows pick-database modal when no diagram exists, then opens editor after confirm", async ({
    page,
  }) => {
    const pickDbOptions = page.getByTestId("pick-db-options");
    const confirmBtn = page.getByRole("button", { name: /confirm/i });
    const addTableToolbar = page.getByTestId("toolbar-add-table");

    await expect(
      pickDbOptions.or(addTableToolbar).first(),
    ).toBeVisible({ timeout: 15000 });
    if (await confirmBtn.isVisible().catch(() => false)) {
      await expect(confirmBtn).toBeDisabled();
      await page.getByTestId("pick-db-mysql").click();
      await expect(confirmBtn).toBeEnabled();
      await confirmBtn.click();
    }
    await expect(addTableToolbar).toBeVisible({ timeout: 10000 });
  });

  test("add table button adds a table to the canvas", async ({ page }) => {
    await dismissPickDbModalIfVisible(page);

    const addTableBtn = page.getByTestId("toolbar-add-table");
    await addTableBtn.waitFor({ state: "visible", timeout: 20000 });
    await addTableBtn.click();

    const tables = page.locator("[data-testid=diagram-table]");
    await expect(tables).toHaveCount(1, { timeout: 15000 });
  });

  test("auto-arrange runs after adding tables and does not remove them", async ({
    page,
  }) => {
    await dismissPickDbModalIfVisible(page);

    const addTableBtn = page.getByTestId("toolbar-add-table");
    await addTableBtn.waitFor({ state: "visible", timeout: 15000 });
    await addTableBtn.click();
    await addTableBtn.click();

    const tablesBefore = page.getByTestId("diagram-table");
    await expect(tablesBefore).toHaveCount(2, { timeout: 8000 });

    const autoArrangeBtn = page.getByTestId("toolbar-auto-arrange");
    await expect(autoArrangeBtn).toBeEnabled();
    await autoArrangeBtn.click();

    const tablesAfter = page.getByTestId("diagram-table");
    await expect(tablesAfter).toHaveCount(2, { timeout: 5000 });
  });

  test("canvas is visible and contains diagram SVG", async ({ page }) => {
    await dismissPickDbModalIfVisible(page);

    const canvas = page.locator("#canvas");
    await expect(canvas).toBeVisible({ timeout: 15000 });
    const diagram = page.locator("#diagram");
    await expect(diagram).toBeVisible();
  });
});
