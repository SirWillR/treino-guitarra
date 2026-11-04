import { routes } from '../../app.routes';
import { ROUTINE_BLOCKS, ROUTINE_TOTAL_MINUTES } from '../data/routine.data';
import { dayKey, formatClock, PracticeTimerService, streakOf } from './practice-timer.service';

const MINUTE = 60_000;

describe('ROUTINE_BLOCKS', () => {
  it('adds up to 30 minutes', () => {
    expect(ROUTINE_TOTAL_MINUTES).toBe(30);
  });

  it('links only to existing pages', () => {
    const paths = new Set(routes.map((route) => route.path));
    const lessonPaths = new Set(
      routes.find((route) => route.path === 'licoes')?.children?.map((child) => child.path),
    );
    for (const block of ROUTINE_BLOCKS) {
      if (!block.link) {
        continue;
      }
      const [top, child] = block.link.path.slice(1).split('/');
      expect(paths.has(top)).toBe(true);
      if (child) {
        expect(lessonPaths.has(child)).toBe(true);
      }
    }
  });
});

describe('PracticeTimerService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 9, 0));
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down and pauses', () => {
    const timer = new PracticeTimerService();
    timer.start();
    vi.advanceTimersByTime(MINUTE);
    expect(timer.remainingMs()).toBe(4 * MINUTE);

    timer.pause();
    vi.advanceTimersByTime(10 * MINUTE);
    expect(timer.remainingMs()).toBe(4 * MINUTE);
    expect(timer.inProgress()).toBe(true);
  });

  it('moves on by itself, carrying time that passed in the background', () => {
    const timer = new PracticeTimerService();
    timer.start();
    // A throttled tab: the clock jumps past the end of the first block before the next tick.
    vi.setSystemTime(Date.now() + 6 * MINUTE);
    vi.advanceTimersByTime(250);
    expect(timer.blockIndex()).toBe(1);
    expect(timer.remainingMs()).toBe(9 * MINUTE - 250);
  });

  it('finishes after the last block and records the day', () => {
    const timer = new PracticeTimerService();
    timer.start();
    vi.advanceTimersByTime(ROUTINE_TOTAL_MINUTES * MINUTE + 1000);
    expect(timer.finished()).toBe(true);
    expect(timer.isRunning()).toBe(false);
    expect(timer.progress()).toBe(1);
    expect(timer.doneToday()).toBe(true);
    expect(timer.streak()).toBe(1);
    expect(new PracticeTimerService().doneToday()).toBe(true);
  });

  it('skips blocks and resets', () => {
    const timer = new PracticeTimerService();
    timer.skip();
    expect(timer.blockIndex()).toBe(1);
    expect(timer.remainingMs()).toBe(10 * MINUTE);
    timer.reset();
    expect(timer.blockIndex()).toBe(0);
    expect(timer.inProgress()).toBe(false);
  });
});

describe('streakOf', () => {
  const today = new Date(2026, 10, 3);
  const daysBefore = (n: number) => dayKey(new Date(2026, 10, 3 - n));

  it('counts consecutive days up to today or yesterday', () => {
    expect(streakOf([], today)).toBe(0);
    expect(streakOf([daysBefore(0), daysBefore(1), daysBefore(2)], today)).toBe(3);
    expect(streakOf([daysBefore(1), daysBefore(2)], today)).toBe(2);
    expect(streakOf([daysBefore(0), daysBefore(2)], today)).toBe(1);
    expect(streakOf([daysBefore(2)], today)).toBe(0);
  });
});

describe('formatClock', () => {
  it('shows minutes and seconds, rounding up', () => {
    expect(formatClock(5 * MINUTE)).toBe('5:00');
    expect(formatClock(61_001)).toBe('1:02');
    expect(formatClock(0)).toBe('0:00');
  });
});
