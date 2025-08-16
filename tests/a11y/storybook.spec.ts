import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'child_process';
import waitOn from 'wait-on';

let sb;

test.beforeAll(async () => {
  sb = spawn('npm', ['run', 'storybook', '--', '--ci', '--quiet'], {
    stdio: 'inherit',
    shell: true,
  });
  await waitOn({ resources: ['http://localhost:6006'], timeout: 60000 });
});

test.afterAll(() => {
  sb.kill();
});

const stories = [
  'http://localhost:6006/iframe.html?id=avatar-aurorasphere--default',
  'http://localhost:6006/iframe.html?id=avatar-aurorasphere--speaking',
];

for (const url of stories) {
  test(`accessibility check for ${url}`, async ({ page }) => {
    await page.goto(url);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
