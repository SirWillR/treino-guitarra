import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { chordById } from '../../core/data/chords.data';
import { INTERVAL_COLORS } from '../../core/models/note.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { ChordDiagram } from '../../shared/chord-diagram/chord-diagram';
import { Fretboard } from '../../shared/fretboard/fretboard';

@Component({
  selector: 'app-caged-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChordDiagram, Fretboard],
  template: `
    <section>
      <h3>Em uma frase</h3>
      <p>
        O CAGED é um <strong>mapa do braço</strong>: ele mostra que qualquer acorde pode ser tocado em
        <strong>5 lugares diferentes</strong>, usando 5 desenhos que você já conhece dos acordes abertos.
      </p>
    </section>

    <section>
      <h3>De onde vem o nome</h3>
      <p>Das letras dos cinco acordes abertos que servem de molde: <strong>C, A, G, E e D</strong>.</p>
      <div class="example flex flex-wrap justify-center gap-2">
        @for (chord of openChords; track chord.id) {
          <app-chord-diagram [chord]="chord" size="sm" />
        }
      </div>
      <p>Cada um desses desenhos é chamado de <strong>shape</strong> (forma).</p>
    </section>

    <section>
      <h3>A ideia central: o desenho anda, o nome muda</h3>
      <p>
        Um shape não está preso ao começo do braço. Se você empurrar o desenho inteiro para a frente — com o
        dedo 1 fazendo pestana no lugar da pestana do instrumento — o desenho continua igual, mas o acorde
        ganha outro nome.
      </p>
      <p>
        Você já faz isso sem perceber: o <strong>F</strong> com pestana é o desenho do <strong>E</strong>
        empurrado uma casa. E o <strong>Bm</strong> é o desenho do <strong>Am</strong> empurrado duas casas.
      </p>
      <div class="example flex flex-wrap items-center justify-center gap-3">
        <app-chord-diagram [chord]="e" size="sm" />
        <span class="text-sm text-slate-400">+ 1 casa →</span>
        <app-chord-diagram [chord]="f" size="sm" />
      </div>
    </section>

    <section>
      <h3>A tônica é a âncora</h3>
      <p>
        <strong>Tônica</strong> é a nota que dá nome ao acorde: no C é a nota C, no G é a nota G. Em cada shape
        a tônica fica sempre no mesmo ponto do desenho. Então, para tocar um acorde qualquer, basta
        <strong>achar a tônica no braço e montar o shape em volta dela</strong>.
      </p>
      <ul>
        <li>Shapes de <strong>E</strong> e de <strong>G</strong>: tônica na 6ª corda.</li>
        <li>Shapes de <strong>A</strong> e de <strong>C</strong>: tônica na 5ª corda.</li>
        <li>Shape de <strong>D</strong>: tônica na 4ª corda.</li>
      </ul>
    </section>

    <section>
      <h3>Como ler as bolinhas</h3>
      <p>
        Um acorde maior ou menor tem só <strong>3 notas diferentes</strong>, que se repetem pelas cordas. Na
        tela, cada bolinha diz qual dessas três notas ela é:
      </p>
      <ul>
        <li><strong [style.color]="colors.R">R</strong> — a tônica (do inglês <em>root</em>). Tem contorno branco para você achar rápido.</li>
        <li><strong [style.color]="colors['3']">3</strong> — a terça. É ela que faz o acorde soar maior (alegre). No acorde menor ela desce uma casa e aparece como <strong [style.color]="colors.b3">b3</strong> (som mais triste).</li>
        <li><strong [style.color]="colors['5']">5</strong> — a quinta. Dá corpo ao acorde; é igual no maior e no menor.</li>
      </ul>
      <div class="example">
        <p class="mb-2 text-sm text-slate-400">C maior no shape de C — o acorde de C aberto que você já toca:</p>
        <app-fretboard [markers]="example" [frets]="5" />
      </div>
    </section>

    <section>
      <h3>Como usar esta tela</h3>
      <ol>
        <li>Escolha a <strong>tonalidade</strong> (comece por C) e deixe em <strong>Maior</strong>.</li>
        <li>Clique em <strong>Shape de C</strong>: é o C aberto de sempre.</li>
        <li>Clique em <strong>Shape de A</strong>: o mesmo acorde C, agora com pestana na casa 3.</li>
        <li>Continue por G, E e D. Subindo o braço, os shapes aparecem sempre na ordem C-A-G-E-D.</li>
        <li>Ligue <strong>Mostrar os outros shapes</strong> para ver como um desenho encosta no outro.</li>
      </ol>
    </section>

    <section>
      <h3>Por onde começar</h3>
      <p>
        Não precisa decorar os cinco de uma vez. Os shapes de <strong>E</strong> e de <strong>A</strong> são as
        pestanas que você já está aprendendo (F, B, Bm, Cm…) e resolvem a maior parte das músicas. Os outros
        três vêm com o tempo.
      </p>
    </section>
  `,
})
export class CagedHelp {
  private readonly theory = inject(MusicTheoryService);

  protected readonly openChords = ['C', 'A', 'G', 'E', 'D'].map(chordById);
  protected readonly e = chordById('E');
  protected readonly f = chordById('F');
  protected readonly colors = INTERVAL_COLORS;
  protected readonly example = this.theory.cagedVoicing('C', 'major', 'C');
}
