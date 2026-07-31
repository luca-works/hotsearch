import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboardSource = readFileSync(
  new URL('./index.tsx', import.meta.url),
  'utf8',
);
const backgroundSource = readFileSync(
  new URL('./BackgroundDecor.tsx', import.meta.url),
  'utf8',
);
const featuredBoardSource = readFileSync(
  new URL('./FeaturedBoard.tsx', import.meta.url),
  'utf8',
);
const introSource = readFileSync(
  new URL('./DashboardIntro.tsx', import.meta.url),
  'utf8',
);
const headerSource = readFileSync(
  new URL('./DashboardHeader.tsx', import.meta.url),
  'utf8',
);
const sidebarSource = readFileSync(
  new URL('./DashboardSidebar.tsx', import.meta.url),
  'utf8',
);
const platformSwitcherSource = readFileSync(
  new URL('./PlatformSwitcher.tsx', import.meta.url),
  'utf8',
);
const countdownStyles = readFileSync(
  new URL('./WorkoffCountdown.module.css', import.meta.url),
  'utf8',
);
const globalStyles = readFileSync(
  new URL('../../app/globals.css', import.meta.url),
  'utf8',
);

test('the dashboard has one page scroll and clips decorative overflow', () => {
  assert.match(dashboardSource, /min-h-screen overflow-x-clip[\s\S]*min-\[961px\]:h-dvh[\s\S]*min-\[961px\]:overflow-hidden/);
  assert.doesNotMatch(dashboardSource, /min-h-screen overflow-x-hidden/);
  assert.match(
    backgroundSource,
    /pointer-events-none absolute inset-0 overflow-hidden/,
  );
});

test('the sidebar shows three focus items and reveals truncated titles on hover', () => {
  assert.match(dashboardSource, /buildFocusItems\(platforms, boards, resolvedActiveValue, 3\)/);
  assert.match(dashboardSource, /\.slice\(0, 3\)/);
  assert.match(sidebarSource, /function OverflowTitle/);
  assert.match(sidebarSource, /element\.scrollWidth > element\.clientWidth/);
  assert.match(sidebarSource, /new ResizeObserver\(measureOverflow\)/);
  assert.match(sidebarSource, /group-hover\/title:block/);
});

test('the featured board renders every fetched item inside its scroll container', () => {
  assert.match(featuredBoardSource, /min-h-0 flex-1 overflow-y-auto/);
  assert.match(featuredBoardSource, /itemLimit === 11 \? 'min-\[961px\]:\[--visible-rows:11\]/);
  assert.match(featuredBoardSource, /min-\[961px\]:h-\[calc\(100%\/var\(--visible-rows\)\)\]/);
  assert.match(featuredBoardSource, /filteredData\.map\(item =>/);
  assert.doesNotMatch(featuredBoardSource, /filteredData\.slice\(0, itemLimit\)/);
});

test('the desktop dashboard keeps the requested content and sidebar widths', () => {
  assert.match(dashboardSource, /max-w-\[1536px\]/);
  assert.match(dashboardSource, /min-\[1280px\]:grid-cols-\[minmax\(0,1fr\)_420px\]/);
  assert.match(dashboardSource, /min-\[1181px\]:gap-\[34px\]/);
  assert.match(dashboardSource, /items-stretch[\s\S]*min-\[961px\]:h-full/);
  assert.match(featuredBoardSource, /min-h-\[54px\]/);
  assert.match(countdownStyles, /width: 100%;[\s\S]*height: 298px;/);
});

test('the primary cards use continuous-curvature corners without changing geometry', () => {
  assert.match(globalStyles, /\.featured-board,[\s\S]*\.dashboard-focus-card,[\s\S]*\.dashboard-mood-card[\s\S]*corner-shape: squircle;/);
  assert.match(countdownStyles, /border-radius: 28px;[\s\S]*corner-shape: squircle;/);
});

test('mobile and short desktop viewports share the title-only compact intro', () => {
  assert.match(globalStyles, /@media \(min-width: 961px\) and \(max-height: 950px\)/);
  assert.match(globalStyles, /\.dashboard-grid[\s\S]*grid-template-columns: minmax\(0, 1fr\) 320px;/);
  assert.match(globalStyles, /\.dashboard-intro[\s\S]*height: 72px;[\s\S]*min-height: 72px;/);
  assert.doesNotMatch(introSource, /DAILY PULSE/);
  assert.doesNotMatch(introSource, /30 个平台实时热榜/);
  assert.match(dashboardSource, /<DashboardClock/);
  assert.match(globalStyles, /\.dashboard-right-column[\s\S]*gap: 12px;[\s\S]*padding-top: 0;/);
  assert.match(globalStyles, /\.dashboard-right-clock-row[\s\S]*height: 68px;[\s\S]*justify-content: flex-end;/);
  assert.match(globalStyles, /\.dashboard-sidebar[\s\S]*gap: 12px;/);
  assert.doesNotMatch(globalStyles, /\.featured-board\s*{[\s\S]*?height: calc\(100vh - 176px\)/);
  assert.doesNotMatch(globalStyles, /\.featured-board-row\s*{[\s\S]*?min-height: 50px/);
  assert.match(globalStyles, /\.dashboard-focus-card[\s\S]*height: 220px;/);
  assert.match(globalStyles, /\.dashboard-mood-card[\s\S]*min-height: 148px;/);
  assert.match(countdownStyles, /@media \(min-width: 961px\) and \(max-height: 950px\)[\s\S]*\.card[\s\S]*height: 230px;/);
});

test('the platform switcher uses a compact primary set with a more menu', () => {
  assert.match(platformSwitcherSource, /maxVisible = 4/);
  assert.match(platformSwitcherSource, /aria-label=\{`查看更多平台（\$\{overflowPlatforms\.length\}）`\}/);
  assert.match(platformSwitcherSource, /role="menu"/);
});

test('mobile centers header controls and keeps the board switcher swipe-only', () => {
  assert.match(headerSource, /dashboard-brand-group[\s\S]*max-md:w-full max-md:justify-center/);
  assert.match(headerSource, /dashboard-tools[\s\S]*max-md:mx-0 max-md:w-full max-md:justify-center/);
  assert.match(featuredBoardSource, /featured-board-scroll-control[\s\S]*max-md:hidden/);
  assert.match(featuredBoardSource, /featured-board-home-editor[\s\S]*max-md:hidden/);
  assert.match(featuredBoardSource, /featured-board-refresh[\s\S]*max-md:hidden/);
  assert.match(featuredBoardSource, /overflow-x-auto/);
});
