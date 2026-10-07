import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FretMarker } from '../../core/models/fretboard.model';
import { INTERVAL_COLORS } from '../../core/models/note.model';
import { INVERSION_NAMES } from '../../core/models/triad.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { Fretboard } from '../../shared/fretboard/fretboard';

@Component({
  selector: 'app-triads-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard],
  template: `
    <section>
      <h3>O que é uma tríade</h3>
      <p>
        É um acorde no <strong>menor tamanho possível: 3 notas</strong>. Todo acorde maior ou menor que você
        toca é uma tríade com notas repetidas — o C aberto usa 5 cordas, mas só tem as notas C, E e G.
      </p>
      <p>As três notas têm nome e função:</p>
      <ul>
        <li><strong [style.color]="colors.R">R</strong> — <strong>tônica</strong>: a nota que dá nome ao acorde.</li>
        <li><strong [style.color]="colors['3']">3</strong> — <strong>terça</strong>: decide se o acorde é maior ou menor.</li>
        <li><strong [style.color]="colors['5']">5</strong> — <strong>quinta</strong>: dá corpo ao som.</li>
      </ul>
    </section>

    <section>
      <h3>Maior × menor: só uma nota muda</h3>
      <p>
        Do acorde maior para o menor, a terça desce <strong>uma casa</strong>. Por isso ela aparece como
        <strong [style.color]="colors.b3">b3</strong> ("terça bemol") nos acordes menores.
      </p>
      <div class="example grid grid-cols-2 gap-4 text-center text-sm">
        <div>
          <div class="font-semibold text-slate-100">C maior</div>
          <div class="font-mono text-lg">C · <span [style.color]="colors['3']">E</span> · G</div>
        </div>
        <div>
          <div class="font-semibold text-slate-100">C menor</div>
          <div class="font-mono text-lg">C · <span [style.color]="colors.b3">D#</span> · G</div>
        </div>
      </div>
    </section>

    <section>
      <h3>"Fechada" e "grupo de cordas"</h3>
      <p>
        <strong>Fechada</strong> quer dizer que as três notas ficam o mais juntas possível, em
        <strong>três cordas vizinhas</strong>, uma nota por corda. Por isso a tela pede um grupo: cordas 1-2-3
        (as mais agudas), 2-3-4 ou 3-4-5.
      </p>
      <p>São desenhos pequenos, de três dedos, fáceis de mover — ótimos para começar a enxergar o braço.</p>
    </section>

    <section>
      <h3>O que é inversão</h3>
      <p>
        São <strong>as mesmas três notas em outra ordem</strong>. O que muda é qual delas fica na corda mais
        grave. O acorde continua sendo o mesmo; só muda o lugar do braço e um pouco a cor do som.
      </p>
      <div class="example space-y-4">
        @for (item of inversions; track item.name) {
          <div>
            <p class="mb-1 text-sm">
              <strong>{{ item.name }}</strong> — da corda grave para a aguda:
              <span class="font-mono text-amber-300">{{ item.formula }}</span>
            </p>
            <app-fretboard [markers]="item.markers" [strings]="[1, 2, 3]" [frets]="12" />
          </div>
        }
        <p class="text-sm text-slate-400">Os três desenhos acima são todos o acorde de C maior, nas cordas 1-2-3.</p>
      </div>
    </section>

    <section>
      <h3>Como usar esta tela</h3>
      <ol>
        <li>Escolha a <strong>tônica</strong> (comece por C), o tipo <strong>Maior</strong> e o grupo <strong>Cordas 1-2-3</strong>.</li>
        <li>Toque o desenho colorido. Os desenhos apagados ao fundo são as outras inversões do mesmo acorde.</li>
        <li>Clique em <strong>Próxima Inversão</strong> para subir o braço até o desenho seguinte e toque de novo.</li>
        <li>Repare onde está o <strong [style.color]="colors.R">R</strong> em cada desenho: é ele que diz qual acorde você está tocando.</li>
        <li>Depois troque para <strong>Menor</strong> e veja a terça descer uma casa em cada desenho.</li>
      </ol>
    </section>

    <section>
      <h3>Para que serve</h3>
      <p>
        Com tríades você toca qualquer acorde em qualquer região do braço usando só três cordas. É a base para
        fazer bases mais leves, criar frases e, mais tarde, solar em cima dos acordes.
      </p>
      <p>
        Sem pressa: comece com <strong>um acorde, um grupo de cordas</strong> e as três inversões. Quando estiver
        confortável, troque de acorde.
      </p>
    </section>
  `,
})
export class TriadsHelp {
  private readonly theory = inject(MusicTheoryService);

  protected readonly colors = INTERVAL_COLORS;

  /** One example of each inversion of C major on strings 1-2-3, in the order they are taught. */
  protected readonly inversions = (['root', 'first', 'second'] as const).map((inversion) => {
    const voicing = this.theory
      .triadVoicings('C', 'major', '1-2-3')
      .find((v) => v.inversion === inversion && v.lowestFret > 0);
    return {
      name: INVERSION_NAMES[inversion],
      formula: voicing?.formula.join(' - ') ?? '',
      markers: (voicing?.markers ?? []) as FretMarker[],
    };
  });
}
