export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getProgressPercentage(remaining: number, total: number): number {
  if (total === 0) return 0;
  return ((total - remaining) / total) * 100;
}

export function getStateLabel(state: string): string {
  switch (state) {
    case 'work': return 'Focus';
    case 'short-break': return 'Short Break';
    case 'long-break': return 'Long Break';
    case 'paused': return 'Paused';
    default: return 'Ready';
  }
}
