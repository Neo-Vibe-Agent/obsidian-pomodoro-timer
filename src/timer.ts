import { PomodoroSettings, TimerState, TimerStatus } from './types';

export class PomodoroTimer {
  private interval: ReturnType<typeof setInterval> | null = null;
  private status: TimerStatus;
  private settings: PomodoroSettings;
  private onTick: (status: TimerStatus) => void;
  private onComplete: (status: TimerStatus) => void;
  private onStateChange: (status: TimerStatus) => void;
  private previousState: TimerState = 'idle';
  private pausedElapsed: number = 0; // seconds elapsed before pause

  constructor(
    settings: PomodoroSettings,
    callbacks: {
      onTick: (status: TimerStatus) => void;
      onComplete: (status: TimerStatus) => void;
      onStateChange: (status: TimerStatus) => void;
    }
  ) {
    this.settings = settings;
    this.onTick = callbacks.onTick;
    this.onComplete = callbacks.onComplete;
    this.onStateChange = callbacks.onStateChange;
    this.status = this.createIdleStatus();
  }

  private createIdleStatus(): TimerStatus {
    return {
      state: 'idle',
      timeRemaining: this.settings.workDuration * 60,
      totalTime: this.settings.workDuration * 60,
      currentPomodoro: 1,
      completedPomodoros: 0,
      activeTask: null,
      startedAt: null,
    };
  }

  updateSettings(settings: PomodoroSettings): void {
    this.settings = settings;
    if (this.status.state === 'idle') {
      this.status.timeRemaining = settings.workDuration * 60;
      this.status.totalTime = settings.workDuration * 60;
    }
  }

  start(task?: string, mode?: 'work' | 'short-break' | 'long-break'): void {
    if (this.status.state === 'paused') {
      this.resume();
      return;
    }

    const targetMode = mode || 'work';
    let duration: number;
    if (targetMode === 'short-break') duration = this.settings.shortBreakDuration * 60;
    else if (targetMode === 'long-break') duration = this.settings.longBreakDuration * 60;
    else duration = this.settings.workDuration * 60;

    this.status.state = targetMode;
    this.status.timeRemaining = duration;
    this.status.totalTime = duration;
    this.status.startedAt = Date.now();
    this.pausedElapsed = 0;
    if (task) this.status.activeTask = task;

    this.emitStateChange();
    this.startInterval();
  }

  pause(): void {
    if (this.status.state === 'idle') return;
    this.previousState = this.status.state;
    // Record how much time has elapsed so far
    if (this.status.startedAt) {
      this.pausedElapsed += Math.floor((Date.now() - this.status.startedAt) / 1000);
    }
    this.status.state = 'paused';
    this.stopInterval();
    this.emitStateChange();
  }

  resume(): void {
    if (this.status.state !== 'paused') return;
    this.status.state = this.previousState !== 'paused' ? this.previousState : 'work';
    // Reset startedAt so elapsed calc continues from now
    this.status.startedAt = Date.now();
    this.emitStateChange();
    this.startInterval();
  }

  stop(): void {
    this.stopInterval();
    this.status = this.createIdleStatus();
    this.emitStateChange();
  }

  skip(): void {
    this.stopInterval();
    this.handlePhaseComplete();
  }

  extend(minutes: number): void {
    this.status.totalTime += minutes * 60;
    this.status.timeRemaining += minutes * 60;
    if (this.status.state === 'idle' || this.status.state === 'paused') {
      // If paused/idle, just add time
    }
    this.emitStateChange();
  }

  setTask(task: string | null): void {
    this.status.activeTask = task;
  }

  getStatus(): TimerStatus {
    return { ...this.status };
  }

  private startInterval(): void {
    this.stopInterval();
    this.interval = setInterval(() => {
      // Timestamp-based: no drift over long sessions
      if (this.status.startedAt) {
        const elapsedSinceResume = Math.floor((Date.now() - this.status.startedAt) / 1000);
        const totalElapsed = this.pausedElapsed + elapsedSinceResume;
        this.status.timeRemaining = Math.max(0, this.status.totalTime - totalElapsed);
      }

      this.onTick(this.getStatus());

      if (this.status.timeRemaining <= 0) {
        this.handlePhaseComplete();
      }
    }, 1000);
  }

  private stopInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private handlePhaseComplete(): void {
    this.stopInterval();
    const completedState = this.status.state;

    if (completedState === 'work') {
      this.status.completedPomodoros++;
      this.onComplete(this.getStatus());

      // Determine next break type
      if (this.status.completedPomodoros % this.settings.longBreakInterval === 0) {
        this.status.state = 'long-break';
        this.status.timeRemaining = this.settings.longBreakDuration * 60;
        this.status.totalTime = this.settings.longBreakDuration * 60;
      } else {
        this.status.state = 'short-break';
        this.status.timeRemaining = this.settings.shortBreakDuration * 60;
        this.status.totalTime = this.settings.shortBreakDuration * 60;
      }
      this.status.currentPomodoro++;
      this.pausedElapsed = 0;
      this.status.startedAt = Date.now();

      this.emitStateChange();

      if (this.settings.autoStartBreaks) {
        this.startInterval();
      }
    } else {
      // Break completed, start next work session
      this.status.state = 'work';
      this.status.timeRemaining = this.settings.workDuration * 60;
      this.status.totalTime = this.settings.workDuration * 60;
      this.status.startedAt = Date.now();
      this.pausedElapsed = 0;

      this.emitStateChange();

      if (this.settings.autoStartWork) {
        this.startInterval();
      }
    }
  }

  private emitStateChange(): void {
    this.onStateChange(this.getStatus());
  }

  destroy(): void {
    this.stopInterval();
  }
}
