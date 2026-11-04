import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTINE_TOTAL_MINUTES } from '../../core/data/routine.data';
import { MAX_BPM, MetronomeService, MIN_BPM } from '../../core/services/metronome.service';
import { formatClock, PracticeTimerService } from '../../core/services/practice-timer.service';

const MINUTE_MS = 60_000;

/** Dial geometry (SVG units): a 270° arc opening at the bottom, filled clockwise as time passes. */
const CX = 150;
const CY = 150;
const ARC_R = 105;
const START_DEG = 135;
const SWEEP_DEG = 270;

function pointAt(deg: number, radius: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

const arcStart = pointAt(START_DEG, ARC_R);
const arcEnd = pointAt(START_DEG + SWEEP_DEG, ARC_R);
const ARC_PATH = `M ${arcStart.x} ${arcStart.y} A ${ARC_R} ${ARC_R} 0 1 1 ${arcEnd.x} ${arcEnd.y}`;

/**
 * One screen for the whole routine: the current block, its countdown and the controls, with a
 * compact metronome so nothing needs scrolling while both hands are on the guitar.
 */
@Component({
  selector: 'app-daily-routine',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { '(document:keydown)': 'onKey($event)' },
  template: `
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-widest text-amber-400 uppercase">
          @if (timer.finished()) {
            Treino concluído
          } @else {
            Bloco {{ timer.blockIndex() + 1 }} de {{ timer.blocks.length }}
          }
        </p>
        <h1 class="mt-1 text-2xl leading-tight font-bold text-white sm:text-4xl">
          @if (timer.finished()) {
            🎉 Mandou bem!
          } @else {
            {{ timer.block().icon }} {{ timer.block().title }}
          }
        </h1>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-xs font-semibold text-amber-400">faltam no treino</p>
        <p class="text-2xl font-bold text-white tabular-nums">{{ totalLeft() }}</p>
      </div>
    </header>

    <div class="mt-3 grid items-center gap-x-10 gap-y-3 lg:mt-8 lg:grid-cols-2">
      <!-- Countdown dial. -->
      <svg
        viewBox="0 0 300 270"
        class="mx-auto w-full max-w-[min(20rem,32dvh)] lg:max-w-md"
        role="timer"
        [attr.aria-label]="'Faltam ' + clock() + ' no bloco'"
      >
        @for (tick of ticks(); track tick.label) {
          <line [attr.x1]="tick.x1" [attr.y1]="tick.y1" [attr.x2]="tick.x2" [attr.y2]="tick.y2" class="stroke-slate-600" stroke-width="3" stroke-linecap="round" />
          <text [attr.x]="tick.lx" [attr.y]="tick.ly" text-anchor="middle" dominant-baseline="middle" class="fill-slate-400 text-[15px] font-semibold">
            {{ tick.label }}
          </text>
        }
        <path [attr.d]="arcPath" fill="none" class="stroke-slate-800" stroke-width="18" stroke-linecap="round" />
        <path
          [attr.d]="arcPath"
          fill="none"
          class="stroke-amber-400 transition-[stroke-dasharray] duration-300"
          stroke-width="18"
          stroke-linecap="round"
          pathLength="100"
          [attr.stroke-dasharray]="blockPercent() + ' 100'"
          [attr.opacity]="blockPercent() > 0 ? 1 : 0"
        />
        <circle [attr.cx]="knob().x" [attr.cy]="knob().y" r="12" class="fill-amber-300 stroke-ink" stroke-width="3" />
        <text x="150" y="148" text-anchor="middle" dominant-baseline="middle" class="fill-white text-[64px] font-bold tabular-nums">
          {{ clock() }}
        </text>
        <text x="150" y="196" text-anchor="middle" class="fill-amber-300 text-[17px] font-semibold">{{ status() }}</text>
      </svg>

      <div class="flex flex-col gap-3 lg:gap-4">
        @if (!timer.finished()) {
          <div>
            <p class="text-sm leading-relaxed text-slate-300">{{ timer.block().description }}</p>
            @if (timer.block().link; as link) {
              <a class="mt-1 inline-block text-sm font-semibold text-amber-300 hover:text-amber-200" [routerLink]="link.path">
                {{ link.label }} →
              </a>
            }
          </div>
        } @else {
          <p class="text-sm text-slate-300">Os {{ timer.blocks.length }} blocos de hoje estão feitos.</p>
        }

        <!-- One segment per block, sized by its minutes; tapping one jumps to that block. -->
        <div>
          <p class="mb-2 text-sm text-slate-400">
            @if (nextBlock(); as next) {
              Depois: <span class="font-semibold text-slate-200">{{ next.icon }} {{ next.title }}</span>
            } @else if (!timer.finished()) {
              Último bloco
            } @else {
              @if (timer.streak() > 0) {
                🔥 {{ timer.streak() }} {{ timer.streak() === 1 ? 'dia seguido' : 'dias seguidos' }}
              }
            }
          </p>
          <div class="flex gap-1.5">
            @for (segment of segments(); track segment.id; let i = $index) {
              <button
                type="button"
                class="group h-6 cursor-pointer py-2"
                [style.flex-grow]="segment.minutes"
                [attr.aria-label]="'Ir para o bloco ' + (i + 1) + ': ' + segment.title"
                [title]="segment.title"
                (click)="timer.goTo(i)"
              >
                <span class="block h-2 overflow-hidden rounded-full bg-slate-800 group-hover:bg-slate-700">
                  <span class="block h-full rounded-full bg-amber-400" [style.width.%]="segment.fill"></span>
                </span>
              </button>
            }
          </div>
        </div>

        <!-- Compact metronome. -->
        <div class="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 sm:gap-3 sm:p-3">
          <button
            type="button"
            class="h-11 shrink-0 cursor-pointer rounded-xl px-3 text-sm font-semibold transition"
            [class]="metronome.isPlaying() ? 'bg-rose-400 text-slate-950' : 'bg-slate-700 text-white hover:bg-slate-600'"
            (click)="metronome.toggle()"
          >
            {{ metronome.isPlaying() ? '■ Parar' : '♩ Ligar' }}
          </button>
          <button type="button" class="chip min-w-11" aria-label="Diminuir BPM" (click)="nudgeBpm(-5)">−</button>
          <div class="w-12 text-center">
            <div class="text-2xl leading-none font-bold text-white tabular-nums">{{ metronome.bpm() }}</div>
            <div class="text-[10px] tracking-widest text-slate-500 uppercase">BPM</div>
          </div>
          <button type="button" class="chip min-w-11" aria-label="Aumentar BPM" (click)="nudgeBpm(5)">+</button>
          <input
            type="range"
            class="hidden h-2 min-w-0 flex-1 cursor-pointer accent-amber-400 sm:block"
            aria-label="BPM"
            [min]="minBpm"
            [max]="maxBpm"
            [value]="metronome.bpm()"
            (input)="onSlider($event)"
          />
          <div class="ml-auto flex shrink-0 gap-1.5 sm:ml-0" aria-hidden="true">
            @for (beat of beats(); track beat) {
              <span class="h-2.5 w-2.5 rounded-full" [class]="beat === metronome.currentBeat() ? 'bg-amber-400' : 'bg-slate-700'"></span>
            }
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          @if (timer.finished()) {
            <button type="button" class="btn-primary flex-1 sm:flex-none" (click)="timer.start()">↻ Treinar de novo</button>
          } @else {
            <button type="button" class="btn-primary min-w-32 flex-1 sm:flex-none" (click)="timer.toggle()">
              {{ timer.isRunning() ? '❚❚ Pausar' : timer.inProgress() ? '▶ Continuar' : '▶ Iniciar' }}
            </button>
            <button type="button" class="btn-ghost flex-1 sm:flex-none" (click)="timer.skip()">Pular bloco</button>
            @if (timer.inProgress()) {
              <button type="button" class="btn-ghost flex-1 sm:flex-none" (click)="timer.reset()">Encerrar</button>
            }
          }
        </div>

        <p class="hidden text-xs text-slate-500 lg:block">
          Atalhos: Espaço pausa · M liga o metrônomo · ↑ ↓ mudam o BPM · → pula o bloco
        </p>
      </div>
    </div>
  `,
})
export class DailyRoutine {
  protected readonly timer = inject(PracticeTimerService);
  protected readonly metronome = inject(MetronomeService);
  protected readonly arcPath = ARC_PATH;
  protected readonly minBpm = MIN_BPM;
  protected readonly maxBpm = MAX_BPM;

  protected readonly clock = computed(() => formatClock(this.timer.remainingMs()));
  protected readonly totalLeft = computed(() =>
    formatClock(ROUTINE_TOTAL_MINUTES * MINUTE_MS - this.timer.elapsedMs()),
  );

  /** Share of the current block already played, 0 to 100. */
  protected readonly blockPercent = computed(() => {
    if (this.timer.finished()) {
      return 100;
    }
    const total = this.timer.block().minutes * MINUTE_MS;
    return Math.min(100, Math.max(0, (1 - this.timer.remainingMs() / total) * 100));
  });

  protected readonly knob = computed(() =>
    pointAt(START_DEG + (SWEEP_DEG * this.blockPercent()) / 100, ARC_R),
  );

  /** One tick per minute of the current block. */
  protected readonly ticks = computed(() => {
    const minutes = this.timer.block().minutes;
    return Array.from({ length: minutes + 1 }, (_, minute) => {
      const deg = START_DEG + (SWEEP_DEG * minute) / minutes;
      const inner = pointAt(deg, 124);
      const outer = pointAt(deg, 132);
      const label = pointAt(deg, 146);
      return { label: minute, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, lx: label.x, ly: label.y };
    });
  });

  protected readonly status = computed(() => {
    if (this.timer.finished()) {
      return 'concluído';
    }
    if (this.timer.isRunning()) {
      return 'tocando';
    }
    return this.timer.inProgress() ? 'pausado' : 'pronto';
  });

  protected readonly nextBlock = computed(() =>
    this.timer.finished() ? null : (this.timer.blocks[this.timer.blockIndex() + 1] ?? null),
  );

  protected readonly segments = computed(() =>
    this.timer.blocks.map((block, i) => ({
      id: block.id,
      title: block.title,
      minutes: block.minutes,
      fill:
        this.timer.finished() || i < this.timer.blockIndex()
          ? 100
          : i === this.timer.blockIndex()
            ? this.blockPercent()
            : 0,
    })),
  );

  protected readonly beats = computed(() =>
    Array.from({ length: this.metronome.beatsPerBar() }, (_, i) => i + 1),
  );

  protected nudgeBpm(delta: number): void {
    this.metronome.setBpm(this.metronome.bpm() + delta);
  }

  protected onSlider(event: Event): void {
    this.metronome.setBpm(Number((event.target as HTMLInputElement).value));
  }

  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (event.ctrlKey || event.metaKey || event.altKey || target?.closest('input, textarea, select')) {
      return;
    }
    switch (event.key) {
      case ' ':
        // Also keeps a focused button from being clicked a second time by the same key.
        event.preventDefault();
        if (this.timer.finished()) {
          this.timer.start();
        } else {
          this.timer.toggle();
        }
        break;
      case 'm':
      case 'M':
        this.metronome.toggle();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.nudgeBpm(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.nudgeBpm(-1);
        break;
      case 'ArrowRight':
        if (!this.timer.finished()) {
          this.timer.skip();
        }
        break;
    }
  }
}
