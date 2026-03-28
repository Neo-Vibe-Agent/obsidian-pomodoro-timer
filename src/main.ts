import { Plugin, Notice, addIcon } from 'obsidian';
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

    // Initialize modules
    this.timer = new PomodoroTimer(this.settings, {
      onTick: (status) => this.handleTick(status),
      onComplete: (status) => this.handleComplete(status),
      onStateChange: (status) => this.handleStateChange(status),
    });

    // Restore timer state if Obsidian was closed mid-session
    await this.restoreTimerState();

    this.taskSync = new TaskSync(this.app, this.settings);
    this.calendarSync = new CalendarSync(this.settings);
    this.cliBridge = new CLIBridge(this.app, this.settings, (status) => {
      // Handle external CLI update
      this.updateView(status);
    });

    // Register view
    this.registerView(POMODORO_VIEW_TYPE, (leaf) => new PomodoroView(leaf, this));

    // Add ribbon icon
    this.addRibbonIcon('timer', 'Pomodoro', () => {
      this.activateView();
    });

    // Status bar
    if (this.settings.showInStatusBar) {
      this.statusBarItem = this.addStatusBarItem();
      this.statusBarItem.setText('Pomodoro: Ready');
      this.statusBarItem.addClass('pomodoro-statusbar');
      this.statusBarItem.addEventListener('click', () => this.activateView());
    }

    // Commands
    this.addCommand({
      id: 'start-pomodoro',
      name: 'Start pomodoro',
      callback: () => this.startTimer(),
    });

    this.addCommand({
      id: 'pause-pomodoro',
      name: 'Pause pomodoro',
      callback: () => this.pauseTimer(),
    });

    this.addCommand({
      id: 'stop-pomodoro',
      name: 'Stop pomodoro',
      callback: () => this.stopTimer(),
    });

    this.addCommand({
      id: 'skip-pomodoro',
      name: 'Skip to next phase',
      callback: () => this.skipTimer(),
    });

    this.addCommand({
      id: 'open-pomodoro',
      name: 'Open Pomodoro panel',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'popout-pomodoro',
      name: 'Pop out Pomodoro to floating window',
      callback: () => this.popoutTimer(),
    });

    // Settings tab
    this.addSettingTab(new PomodoroSettingTab(this.app, this));

    // Start CLI bridge if enabled
    if (this.settings.cliSyncEnabled) {
      this.cliBridge.startWatching();
    }
  }

  async onunload(): Promise<void> {
    this.timer.destroy();
    this.cliBridge.destroy();
  }

  // Public control methods (called by view and commands)
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
    // Clear persisted state
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
    if (this.activeTask) {
      new Notice(`Task done: ${this.activeTask.text}`);
      this.activeTask = null;
      this.timer.setTask(null);
    }
  }

  setActiveTask(task: TaskItem): void {
    this.activeTask = task;
    this.timer.setTask(task.text);
    new Notice(`Task: ${task.text}`);
  }

  // Event handlers
  private handleTick(status: TimerStatus): void {
    this.updateView(status);
    this.updateStatusBar(`${getStateLabel(status.state)} ${formatTime(status.timeRemaining)}`);
    this.cliBridge.writeState(status);
  }

  private async handleComplete(status: TimerStatus): Promise<void> {
    // Play sound
    if (this.settings.soundEnabled) {
      playSound(this.settings.soundFile, this.settings.soundVolume);
    }

    // System notification
    if (this.settings.notifySystem) {
      new Notification('Pomodoro Complete', {
        body: `${status.completedPomodoros} pomodoro${status.completedPomodoros !== 1 ? 's' : ''} completed. ${getStateLabel(status.state)} time.`,
        silent: !this.settings.notifySound,
      });
    }

    // Obsidian notice
    if (this.settings.notifyOnComplete) {
      new Notice(`Pomodoro #${status.completedPomodoros} complete. Time for a ${getStateLabel(status.state).toLowerCase()}.`);
    }

    // Log pomodoro
    await this.taskSync.logPomodoro(status.activeTask, this.settings.workDuration);

    // Update task pomodoro count
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
      data._timerState = {
        ...status,
        savedAt: Date.now(),
      };
      await this.saveData(data);
    } catch (e) {
      // Silent fail, non-critical
    }
  }

  private async restoreTimerState(): Promise<void> {
    try {
      const data = await this.loadData();
      if (!data?._timerState) return;

      const saved = data._timerState;
      const elapsed = (Date.now() - saved.savedAt) / 1000;

      // Only restore if saved within the last 30 minutes and was active
      if (elapsed > 30 * 60) return;
      if (saved.state === 'idle') return;

      const wasRunning = saved.state === 'work' || saved.state === 'short-break' || saved.state === 'long-break';
      const adjustedRemaining = wasRunning ? Math.max(0, saved.timeRemaining - elapsed) : saved.timeRemaining;

      if (adjustedRemaining <= 0) {
        // Timer would have completed while closed
        new Notice(`Pomodoro completed while Obsidian was closed.`);
        // Clear saved state
        data._timerState = null;
        await this.saveData(data);
        return;
      }

      // Offer to resume
      new Notice(
        `Timer was running: ${formatTime(Math.round(adjustedRemaining))} remaining. Click the timer to resume.`,
        8000
      );
    } catch (e) {
      // Silent fail
    }
  }

  // View management
  private updateView(status: TimerStatus): void {
    const leaves = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of leaves) {
      const view = leaf.view as PomodoroView;
      view.updateTimer(status);
    }
  }

  private updateStatusBar(text: string): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText(`Pomodoro: ${text}`);
    }
  }

  async popoutTimer(): Promise<void> {
    // Close any existing instances first
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of existing) {
      leaf.detach();
    }

    // Open in a floating popout window
    const leaf = this.app.workspace.openPopoutLeaf({ size: { width: 340, height: 540 } });
    await leaf.setViewState({ type: POMODORO_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);

    // Focus the popout window so it appears in front
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

  // Settings
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // Propagate settings to modules
    this.timer.updateSettings(this.settings);
    this.taskSync.updateSettings(this.settings);
    this.calendarSync.updateSettings(this.settings);
    this.cliBridge.updateSettings(this.settings);
  }
}
