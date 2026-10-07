export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

export type Interval = 'R' | '9' | 'b3' | '3' | '5' | 'b7';

export type TriadQuality = 'major' | 'minor';

export type ChordQuality = TriadQuality | 'dominant7' | 'minor7' | 'add9';

export interface Note {
  name: NoteName;
  /** Enharmonic spelling with a flat, when the note is an accidental. */
  flatName: string | null;
  isNatural: boolean;
  color: string;
}

export const NOTES: readonly Note[] = [
  { name: 'C', flatName: null, isNatural: true, color: '#f87171' },
  { name: 'C#', flatName: 'Db', isNatural: false, color: '#fb923c' },
  { name: 'D', flatName: null, isNatural: true, color: '#fbbf24' },
  { name: 'D#', flatName: 'Eb', isNatural: false, color: '#a3e635' },
  { name: 'E', flatName: null, isNatural: true, color: '#4ade80' },
  { name: 'F', flatName: null, isNatural: true, color: '#2dd4bf' },
  { name: 'F#', flatName: 'Gb', isNatural: false, color: '#22d3ee' },
  { name: 'G', flatName: null, isNatural: true, color: '#60a5fa' },
  { name: 'G#', flatName: 'Ab', isNatural: false, color: '#818cf8' },
  { name: 'A', flatName: null, isNatural: true, color: '#c084fc' },
  { name: 'A#', flatName: 'Bb', isNatural: false, color: '#e879f9' },
  { name: 'B', flatName: null, isNatural: true, color: '#f472b6' },
];

export const INTERVAL_COLORS: Record<Interval, string> = {
  R: '#fbbf24',
  '9': '#f472b6',
  b3: '#a78bfa',
  '3': '#22d3ee',
  '5': '#34d399',
  b7: '#fb7185',
};

export const INTERVAL_NAMES: Record<Interval, string> = {
  R: 'Tônica',
  '9': 'Nona',
  b3: 'Terça menor',
  '3': 'Terça maior',
  '5': 'Quinta justa',
  b7: 'Sétima menor',
};
