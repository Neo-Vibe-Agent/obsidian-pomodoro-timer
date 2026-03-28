export interface PomodoroSettings {
  // Timer
  timerName: string;           // custom name for the timer
  workDuration: number;        // minutes
  shortBreakDuration: number;  // minutes
  longBreakDuration: number;   // minutes
  longBreakInterval: number;   // after N pomodoros
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  extendMinutes: number;       // +time button amount (1-99)

  // Sound
  soundEnabled: boolean;
  soundFile: string;           // path to custom sound or built-in name
  soundVolume: number;         // 0-1

  // Tasks
  taskSyncEnabled: boolean;
  taskSource: 'obsidian-tasks' | 'dataview' | 'custom-path';
  customTaskPath: string;      // vault-relative path for custom task source
  logCompletedPomodoros: boolean;
  logFile: string;             // vault-relative path for log

  // Calendar
  calendarSyncEnabled: boolean;
  googleCalendarId: string;
  showUpcomingEvents: boolean;

  // CLI
  cliSyncEnabled: boolean;
  cliStateFile: string;        // vault-relative path for shared state

  // Theme
  theme: 'default' | 'minimal' | 'neon' | 'forest' | 'orange' | 'matrix' | 'cyberpunk' | 'angel' | 'ocean' | 'city';
  customCss: string;
  timerSize: 'small' | 'medium' | 'large';
  showInStatusBar: boolean;

  // Custom colors (override theme)
  customPrimary: string;     // hex, empty = use theme
  customSecondary: string;   // hex, empty = use theme
  customAccentColor: string; // hex, empty = use theme

  // Interaction
  scrollSensitivity: number;   // 1-5, pixels per minute (mapped)

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
  calendarSyncEnabled: false,
  googleCalendarId: '',
  showUpcomingEvents: true,
  cliSyncEnabled: false,
  cliStateFile: '.pomodoro-state.json',
  theme: 'default',
  customCss: '',
  timerSize: 'medium',
  showInStatusBar: true,
  customPrimary: '',
  customSecondary: '',
  customAccentColor: '',
  scrollSensitivity: 3,
  notifyOnComplete: true,
  notifySound: true,
  notifySystem: true,
};

export type TimerState = 'idle' | 'work' | 'short-break' | 'long-break' | 'paused';

export interface TimerStatus {
  state: TimerState;
  timeRemaining: number;     // seconds
  totalTime: number;         // seconds
  currentPomodoro: number;   // which pomodoro in the cycle (1-based)
  completedPomodoros: number;
  activeTask: string | null;
  startedAt: number | null;  // timestamp
}

export interface TaskItem {
  text: string;
  path: string;
  line: number;
  completed: boolean;
  estimatedPomodoros?: number;
  completedPomodoros?: number;
}

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
}

export interface PomodoroLogEntry {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  task: string | null;
  completed: boolean;
}

export interface CLIState {
  timer: TimerStatus;
  lastUpdated: number;
  source: 'obsidian' | 'cli';
}
