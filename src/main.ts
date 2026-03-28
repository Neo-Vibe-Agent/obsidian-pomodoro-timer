import { Plugin, Notice, Platform } from 'obsidian';
import { PomodoroSettings, DEFAULT_SETTINGS, TimerStatus, TaskItem } from './types';
import { PomodoroTimer } from './timer';
import { TaskSync } from './task-sync';
import { CalendarSync } from './calendar-sync';
import { CLIBridge } from './cli-bridge';
import { PomodoroSettingTab } from './settings';
import { PomodoroView, POMODORO_VIEW_TYPE } from './view';
import { formatTime, getStateLabel } from './utils/format';
import { playSound } from './utils/sound';

export default class PomodoroPlugin extends Plugin {
  settings: PomodoroSettings;
  timer: PomodoroTimer;
  taskSync: TaskSync;
  calendarSync: CalendarSync;
  cliBridge: CLIBridge;
  private statusBarItem: HTMLElement | null = null;
  private activeTask: TaskItem | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.timer = new PomodoroTimer(this.settings, {
      onTick: (status) => this.handleTick(status),
      onComplete: (status) => this.handleComplete(status),
      onStateChange: (status) => this.handleStateChange(status),
    });

    await this.restoreTimerState();

    this.taskSync = new TaskSync(this.app, this.settings);
    this.calendarSync = new CalendarSync(this.settings);
    this.cliBridge = new CLIBridge(this.app, this.settings, (status) => {
      this.updateView(status);
    });

    // Register view
    this.registerView(POMODORO_VIEW_TYPE, (leaf) => new PomodoroView(leaf, this));

    // Ribbon icon
    this.addRibbonIcon('timer', 'Pomodoro', () => {
      this.activateView();
    });

    // Status bar (always present, acts as show/hide toggle)
    this.statusBarItem = this.addStatusBarItem();
    const name = this.settings.timerName || 'Pomodoro';
    this.statusBarItem.setText(`${name}: Ready`);
    this.statusBarItem.addClass('pomodoro-statusbar');
    this.statusBarItem.addEventListener('click', () => {
      this.toggleView();
      // Update hint text based on new visibility
      const visible = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE).length > 0;
      if (visible) {
        const status = this.timer.getStatus();
        if (status.state !== 'idle') {
          this.updateStatusBar(`${getStateLabel(status.state)} ${formatTime(status.timeRemaining)}`);
        } else {
          this.updateStatusBar('Ready');
        }
      }
    });

    // Commands
    this.addCommand({ id: 'start-pomodoro', name: 'Start pomodoro', callback: () => this.startTimer() });
    this.addCommand({ id: 'pause-pomodoro', name: 'Pause pomodoro', callback: () => this.pauseTimer() });
    this.addCommand({ id: 'stop-pomodoro', name: 'Stop pomodoro', callback: () => this.stopTimer() });
    this.addCommand({ id: 'skip-pomodoro', name: 'Skip to next phase', callback: () => this.skipTimer() });
    this.addCommand({ id: 'open-pomodoro', name: 'Open Pomodoro panel', callback: () => this.activateView() });
    this.addCommand({ id: 'hide-pomodoro', name: 'Hide Pomodoro panel', callback: () => this.hideView() });
    this.addCommand({ id: 'toggle-pomodoro', name: 'Toggle Pomodoro panel', callback: () => this.toggleView() });

    if (Platform.isDesktop) {
      this.addCommand({ id: 'popout-pomodoro', name: 'Pop out Pomodoro to floating window', callback: () => this.popoutTimer() });
    }

    this.addSettingTab(new PomodoroSettingTab(this.app, this));

    if (this.settings.cliSyncEnabled) {
      this.cliBridge.startWatching();
    }
  }

  async onunload(): Promise<void> {
    this.timer.destroy();
    this.cliBridge.destroy();
  }

  // Public control methods
  startTimer(mode?: 'work' | 'short-break' | 'long-break'): void {
    this.timer.start(this.activeTask?.text, mode);
    const label = mode === 'short-break' ? 'Short break' : mode === 'long-break' ? 'Long break' : 'Pomodoro';
    new Notice(`${label} started`);
  }

  pauseTimer(): void {
    this.timer.pause();
    new Notice('Pomodoro paused');
  }

  resumeTimer(): void {
    this.timer.resume();
    new Notice('Pomodoro resumed');
  }

  stopTimer(): void {
    this.timer.stop();
    new Notice('Pomodoro stopped');
    this.updateStatusBar('Ready');
    this.saveTimerState({ state: 'idle', timeRemaining: 0, totalTime: 0, currentPomodoro: 1, completedPomodoros: 0, activeTask: null, startedAt: null });
  }

  skipTimer(): void {
    this.timer.skip();
    new Notice('Skipped to next phase');
  }

  extendTimer(minutes: number): void {
    this.timer.extend(minutes);
    new Notice(`Extended by ${minutes} minutes`);
  }

  markTaskDone(): void {
    const taskName = this.activeTask?.text || this.timer.getStatus().activeTask;
    if (taskName) {
      new Notice(`Done: ${taskName}`);
      this.activeTask = null;
      this.timer.setTask(null);
      const status = this.timer.getStatus();
      this.updateView(status);
    } else {
      new Notice('No active task');
    }
  }

  setActiveTask(task: TaskItem): void {
    this.activeTask = task;
    this.timer.setTask(task.text);
    new Notice(`Task: ${task.text}`);
  }

  setActiveTaskByName(name: string): void {
    this.activeTask = { text: name, path: '', line: 0, completed: false };
    this.timer.setTask(name);
  }

  // View management
  hideView(): void {
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of existing) {
      leaf.detach();
    }
    if (this.statusBarItem) {
      const name = this.settings.timerName || 'Pomodoro';
      const state = this.timer.getStatus().state;
      if (state !== 'idle') {
        // Timer still running, show time + click to show
        this.statusBarItem.setText(`${name}: ${getStateLabel(state)} ${formatTime(this.timer.getStatus().timeRemaining)} (click to show)`);
      } else {
        this.statusBarItem.setText(`${name} (click to show)`);
      }
    }
  }

  toggleView(): void {
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    if (existing.length > 0) {
      this.hideView();
    } else {
      this.activateView();
    }
  }

  async popoutTimer(): Promise<void> {
    if (!Platform.isDesktop) return;

    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of existing) {
      leaf.detach();
    }

    const leaf = this.app.workspace.openPopoutLeaf({ size: { width: 340, height: 540 } });
    await leaf.setViewState({ type: POMODORO_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);

    setTimeout(() => {
      this.app.workspace.revealLeaf(leaf);
      leaf.view?.containerEl?.win?.focus?.();
    }, 200);
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: POMODORO_VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }

  // Event handlers
  private handleTick(status: TimerStatus): void {
    this.updateView(status);
    this.updateStatusBar(`${getStateLabel(status.state)} ${formatTime(status.timeRemaining)}`);
    this.cliBridge.writeState(status);
  }

  private async handleComplete(status: TimerStatus): Promise<void> {
    if (this.settings.soundEnabled) {
      playSound(this.settings.soundFile, this.settings.soundVolume);
    }

    // System notification (platform-safe)
    if (this.settings.notifySystem && Platform.isDesktop) {
      try {
        new Notification('Pomodoro Complete', {
          body: `${status.completedPomodoros} pomodoro${status.completedPomodoros !== 1 ? 's' : ''} completed. ${getStateLabel(status.state)} time.`,
          silent: !this.settings.notifySound,
        });
      } catch (e) {
        // Notification API not available
      }
    }

    if (this.settings.notifyOnComplete) {
      new Notice(`Pomodoro #${status.completedPomodoros} complete. Time for a ${getStateLabel(status.state).toLowerCase()}.`);
    }

    await this.taskSync.logPomodoro(status.activeTask, this.settings.workDuration);

    if (this.activeTask) {
      await this.taskSync.updateTaskPomodoro(this.activeTask);
    }
  }

  private handleStateChange(status: TimerStatus): void {
    this.updateView(status);
    this.updateStatusBar(`${getStateLabel(status.state)} ${formatTime(status.timeRemaining)}`);
    this.cliBridge.writeState(status);
    this.saveTimerState(status);
  }

  // Timer state persistence
  private async saveTimerState(status: TimerStatus): Promise<void> {
    try {
      const data = await this.loadData() || {};
      data._timerState = { ...status, savedAt: Date.now() };
      await this.saveData(data);
    } catch (e) { /* non-critical */ }
  }

  private async restoreTimerState(): Promise<void> {
    try {
      const data = await this.loadData();
      if (!data?._timerState) return;

      const saved = data._timerState;
      const elapsed = (Date.now() - saved.savedAt) / 1000;

      // Restore within 120 minutes (supports 90min sessions)
      if (elapsed > 120 * 60) return;
      if (saved.state === 'idle') return;

      const wasRunning = saved.state === 'work' || saved.state === 'short-break' || saved.state === 'long-break';
      const adjustedRemaining = wasRunning ? Math.max(0, saved.timeRemaining - elapsed) : saved.timeRemaining;

      if (adjustedRemaining <= 0) {
        new Notice('Pomodoro completed while Obsidian was closed.');
        data._timerState = null;
        await this.saveData(data);
        return;
      }

      new Notice(`Timer was running: ${formatTime(Math.round(adjustedRemaining))} remaining. Click the timer to resume.`, 8000);
    } catch (e) { /* silent fail */ }
  }

  private updateView(status: TimerStatus): void {
    const leaves = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as PomodoroView;
      view.updateTimer(status);
    }
  }

  private updateStatusBar(text: string): void {
    if (this.statusBarItem) {
      const name = this.settings.timerName || 'Pomodoro';
      this.statusBarItem.setText(`${name}: ${text}`);
    }
  }

  // Settings
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.timer.updateSettings(this.settings);
    this.taskSync.updateSettings(this.settings);
    this.calendarSync.updateSettings(this.settings);
    this.cliBridge.updateSettings(this.settings);

    // Live-update theme + refresh views
    const leaves = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as PomodoroView;
      const container = view.containerEl.children[1];
      container.className = container.className.replace(/pomodoro-theme-\S+/g, '').trim();
      container.addClass(`pomodoro-theme-${this.settings.theme}`);
      container.className = container.className.replace(/pomodoro-size-\S+/g, '').trim();
      container.addClass(`pomodoro-size-${this.settings.timerSize}`);
      // Apply custom colors if set
      const el = container as HTMLElement;
      if (this.settings.customPrimary) el.style.setProperty('--pomo-accent', this.settings.customPrimary);
      else el.style.removeProperty('--pomo-accent');
      if (this.settings.customSecondary) el.style.setProperty('--pomo-break', this.settings.customSecondary);
      else el.style.removeProperty('--pomo-break');
      if (this.settings.customAccentColor) el.style.setProperty('--pomo-ring-color', this.settings.customAccentColor);
      else el.style.removeProperty('--pomo-ring-color');
      // Refresh task list in case task sync was toggled
      view.refreshTasks();
    }
  }
}
