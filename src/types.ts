export interface PomodoroSettings {
  // Timer
  timerName: string;
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  extendMinutes: number;

  // Sound
  soundEnabled: boolean;
  soundFile: string;
  soundVolume: number;

  // Tasks
  taskSyncEnabled: boolean;
  taskSource: 'obsidian-tasks' | 'custom-path';
  customTaskPath: string;
  logCompletedPomodoros: boolean;
  logFile: string;

  // Theme
  theme: 'default' | 'clean' | 'neon' | 'forest' | 'citrus' | 'matrix' | 'cyberpunk' | 'angel' | 'ocean' | 'city';
  timerSize: 'small' | 'medium' | 'large';
  showInStatusBar: boolean;

  // Custom colors
  useCustomColors: boolean;
  customPrimary: string;
  customSecondary: string;
  customAccentColor: string;

  // Interaction
  scrollSensitivity: number;

  // Notifications
  notifyOnComplete: boolean;
  notifySound: boolean;
  notifySystem: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  timerName: 'Pomodoro',
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  extendMinutes: 5,
  soundEnabled: true,
  soundFile: 'bell',
  soundVolume: 0.5,
  taskSyncEnabled: false,
  taskSource: 'obsidian-tasks',
  customTaskPath: '',
  logCompletedPomodoros: true,
  logFile: 'pomodoro-log.md',
  theme: 'default',
  timerSize: 'medium',
  showInStatusBar: true,
  useCustomColors: false,
  customPrimary: '#3b82f6',
  customSecondary: '#ef4444',
  customAccentColor: '',
  scrollSensitivity: 3,
  notifyOnComplete: true,
  notifySound: true,
  notifySystem: true,
};

export type TimerState = 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';

export interface TimerStatus {
  state: TimerState;
  timeRemaining: number;
  totalTime: number;
  currentPomodoro: number;
  completedPomodoros: number;
  activeTask: string | null;
  startedAt: number | null;
}

export interface TaskItem {
  text: string;
  path: string;
  line: number;
  completed: boolean;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
}
