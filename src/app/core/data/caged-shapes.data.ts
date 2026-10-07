import { CagedShape } from '../models/caged.model';

/** Open-position chord forms the CAGED system is built from; offsets go from string 6 to string 1. */
export const CAGED_SHAPES: readonly CagedShape[] = [
  { name: 'C', quality: 'major', offsets: [null, 3, 2, 0, 1, 0], rootString: 5, rootOffset: 3 },
  { name: 'A', quality: 'major', offsets: [null, 0, 2, 2, 2, 0], rootString: 5, rootOffset: 0 },
  { name: 'G', quality: 'major', offsets: [3, 2, 0, 0, 0, 3], rootString: 6, rootOffset: 3 },
  { name: 'E', quality: 'major', offsets: [0, 2, 2, 1, 0, 0], rootString: 6, rootOffset: 0 },
  { name: 'D', quality: 'major', offsets: [null, null, 0, 2, 3, 2], rootString: 4, rootOffset: 0 },

  { name: 'C', quality: 'minor', offsets: [null, 3, 1, 0, 1, null], rootString: 5, rootOffset: 3 },
  { name: 'A', quality: 'minor', offsets: [null, 0, 2, 2, 1, 0], rootString: 5, rootOffset: 0 },
  { name: 'G', quality: 'minor', offsets: [3, 1, 0, 0, 3, 3], rootString: 6, rootOffset: 3 },
  { name: 'E', quality: 'minor', offsets: [0, 2, 2, 0, 0, 0], rootString: 6, rootOffset: 0 },
  { name: 'D', quality: 'minor', offsets: [null, null, 0, 2, 3, 1], rootString: 4, rootOffset: 0 },
];
