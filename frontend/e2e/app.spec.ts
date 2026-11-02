import { expect, test, type Page } from '@playwright/test';

const login = async (page: Page) => {
  await page.goto('/login');
  await page.locator('#l-login').fill('admin');
  await page.locator('#l-pass').fill('admin123');
  await page.locator('form button[type=submit]').click();
  await expect(page).toHaveURL(/\/orders/);
};

test('список приходов отображается без входа', async ({ page }) => {
  await page.goto('/orders');
  await expect(page.locator('.order-row')).toHaveCount(3);
  await expect(page.locator('.page-title')).toContainText('3');
});

test('клик по приходу открывает панель с продуктами, крестик закрывает', async ({ page }) => {
  await page.goto('/orders');
  await page.locator('.order-row__main').first().click();
  await expect(page.locator('.order-details')).toBeVisible();
  await page.locator('.order-details__close').click();
  await expect(page.locator('.order-details')).toHaveCount(0);
});

test('без входа кнопка «+» ведёт на страницу входа', async ({ page }) => {
  await page.goto('/orders');
  await page.locator('.round-btn').first().click();
  await expect(page).toHaveURL(/\/login/);
});

test('неверный пароль показывает ошибку', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#l-login').fill('admin');
  await page.locator('#l-pass').fill('wrong-password');
  await page.locator('form button[type=submit]').click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('.alert, .invalid-feedback').first()).toBeVisible();
});

test('поиск в шапке фильтрует список приходов', async ({ page }) => {
  await page.goto('/orders');
  await page.locator('.top-menu__search').fill('zzzz-ничего-нет');
  await expect(page.locator('.order-row')).toHaveCount(0);
  await page.locator('.top-menu__search').fill('');
  await expect(page.locator('.order-row')).toHaveCount(3);
});

test('фильтр продуктов по типу идёт на сервер', async ({ page }) => {
  await page.goto('/products');
  const all = await page.locator('.product-row').count();
  await page.locator('.filter__select').first().selectOption({ index: 1 });
  await expect.poll(() => page.locator('.product-row').count()).toBeLessThan(all);
});

test('типы продуктов переводятся, а фильтр по ним работает', async ({ page }) => {
  await page.goto('/products');
  await expect(page.locator('.product-row__type').first()).toContainText('Монитор');
  await expect(page.locator('.filter__select').first()).toContainText('Мыши');
  await page.locator('.filter__select').first().selectOption({ label: 'Мыши' });
  await expect.poll(() => page.locator('.product-row').count()).toBe(1);
});

test('сортировка приходов по количеству продуктов', async ({ page }) => {
  await page.goto('/orders');
  await page.locator('.filter__select').selectOption('count');
  const counts = async () => (await page.locator('.order-row__count b').allTextContents()).map(Number);
  const desc = await counts();
  expect(desc).toEqual([...desc].sort((x, y) => y - x));
  await page.locator('.filter button').click(); // направление: по возрастанию
  const asc = await counts();
  expect(asc).toEqual([...asc].sort((x, y) => x - y));
});

test('сортировка продуктов по названию', async ({ page }) => {
  await page.goto('/products');
  await page.locator('.filter__select').last().selectOption('title');
  await page.locator('.filter button').click(); // из «по убыванию» в «по возрастанию»
  const titles = (await page.locator('.product-row .product-line__title').allTextContents()).map((x) => x.toLowerCase());
  expect(titles).toEqual([...titles].sort());
});

test('после входа можно создать и удалить приход', async ({ page }) => {
  await login(page);
  const before = await page.locator('.order-row').count();
  await page.locator('.round-btn').first().click();
  await page.locator('#o-title').fill('E2E приход');
  await page.locator('.popup__box button[type=submit]').click();
  await expect(page.locator('.order-row')).toHaveCount(before + 1);

  await page.locator('.order-row', { hasText: 'E2E приход' }).locator('.icon-btn').click();
  await page.locator('.popup__danger').click();
  await expect(page.locator('.order-row')).toHaveCount(before);
});

test('статистика строится в Web Worker', async ({ page }) => {
  await page.goto('/stats');
  await expect(page.locator('.stats__note')).toContainText('Web Worker');
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
});

test('приложение отдаёт манифест PWA', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const m = await res.json();
  expect(m.display).toBe('standalone');
  expect(m.icons.length).toBeGreaterThan(0);
});

test('живое обновление: приход, созданный через API, появляется без перезагрузки', async ({ page, request }) => {
  await page.goto('/orders');
  const before = await page.locator('.order-row').count();
  const auth = await request.post('http://localhost:4000/api/auth/login', { data: { login: 'admin', password: 'admin123' } });
  const { token } = await auth.json();
  const created = await request.post('http://localhost:4000/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title: 'Live e2e', description: 'x', lat: null, lng: null }
  });
  expect(created.ok()).toBeTruthy();
  await expect(page.locator('.order-row')).toHaveCount(before + 1, { timeout: 8000 });
  const { id } = await created.json();
  await request.delete(`http://localhost:4000/api/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
});
