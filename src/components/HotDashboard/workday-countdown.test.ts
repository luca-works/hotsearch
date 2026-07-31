import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_WORKDAY_CONFIG,
  getDayScene,
  getWorkdayCountdownState,
  getWorkdayProgress,
  validateWorkdayConfig,
} from './workday-utils.ts';

const monday = (hour: number, minute: number, second = 0) => new Date(2026, 6, 13, hour, minute, second);

test('maps local time to the four illustration scenes', () => {
  assert.equal(getDayScene(monday(6, 30)), 'morning');
  assert.equal(getDayScene(monday(11, 0)), 'afternoon');
  assert.equal(getDayScene(monday(17, 30)), 'sunset');
  assert.equal(getDayScene(monday(23, 0)), 'night');
});

test('pairs each working scene with its matching copy', () => {
  assert.equal(getWorkdayCountdownState(monday(9, 30), DEFAULT_WORKDAY_CONFIG).statusText, '新的一天，加油鸭！ 💪');
  assert.equal(getWorkdayCountdownState(monday(14, 30), DEFAULT_WORKDAY_CONFIG).statusText, '下午茶时间，稳住别浪～ ☕');
  assert.equal(getWorkdayCountdownState(monday(17, 30), DEFAULT_WORKDAY_CONFIG).statusText, '夕阳已就位，就等下班的你 🌇');
  assert.equal(getWorkdayCountdownState(monday(19, 0), DEFAULT_WORKDAY_CONFIG).statusText, '夕阳已就位，就等下班的你 🌇');
});

test('handles before work, lunch, almost off, off work, and weekend states', () => {
  assert.equal(getWorkdayCountdownState(monday(8, 30), DEFAULT_WORKDAY_CONFIG).phase, 'before-work');
  assert.equal(getWorkdayCountdownState(monday(12, 30), DEFAULT_WORKDAY_CONFIG).phase, 'lunch');
  assert.equal(getWorkdayCountdownState(monday(18, 45), DEFAULT_WORKDAY_CONFIG).phase, 'almost-off');
  assert.equal(getWorkdayCountdownState(monday(19, 31), DEFAULT_WORKDAY_CONFIG).phase, 'off-work');

  const saturday = new Date(2026, 6, 18, 10, 0, 0);
  const weekend = getWorkdayCountdownState(saturday, DEFAULT_WORKDAY_CONFIG);
  assert.equal(weekend.phase, 'weekend');
  assert.equal(weekend.headline, '周末进行中');
  assert.equal(weekend.footerText, '下周一 09:00 再见');
});

test('excludes lunch from working progress', () => {
  assert.equal(getWorkdayProgress(monday(12, 0), DEFAULT_WORKDAY_CONFIG), 31.57894736842105);
  assert.equal(getWorkdayProgress(monday(13, 0), DEFAULT_WORKDAY_CONFIG), 31.57894736842105);
  assert.ok(Math.abs(getWorkdayProgress(monday(17, 15), DEFAULT_WORKDAY_CONFIG) - 76.3158) < 0.001);
});

test('rejects invalid ranges and empty workday selection', () => {
  assert.equal(validateWorkdayConfig({ ...DEFAULT_WORKDAY_CONFIG, workEnd: '08:00' }), '下班时间必须晚于上班时间');
  assert.equal(validateWorkdayConfig({ ...DEFAULT_WORKDAY_CONFIG, lunchEnd: '20:00' }), '午休时间必须处于上班和下班之间');
  assert.equal(validateWorkdayConfig({ ...DEFAULT_WORKDAY_CONFIG, workdays: [] }), '至少选择一个工作日');
});
