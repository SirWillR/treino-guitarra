/** One timed block of the daily practice routine. */
export interface RoutineBlock {
  id: string;
  title: string;
  minutes: number;
  icon: string;
  /** What to do during the block, in a sentence or two. */
  description: string;
  /** App page with the exercise for this block, if there is one. */
  link?: { label: string; path: string };
}
