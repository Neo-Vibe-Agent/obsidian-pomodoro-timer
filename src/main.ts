import { Plugin, Notice, Platform } from 'obsidian';
import { PomodoroSettings, DEFAULT_SETTINGS, TimerStatus, TaskItem } from './types';
import { PomodoroTimer } from './timer';
import { TaskSync } from './task-sync';
import { PomodoroSettingTab } from './settings';
import { PomodoroView, POMODORO_VIEW_TYPE } from './view';
import { formatTime, getStateLabel } from './utils/format';
import { playSound } from './utils/sound';

export default class PomodoroPlugin extends Plugin {
  settings: PomodoroSettings;
  timer: PomodoroTimer;
  taskSync: TaskSync;
  private statusBarItem: HTMLElement | null = null;
  private activeTask: TaskItem | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.timer = new PomodoroTimer(this.settings, {
      onTick: (status) => this.handleTick(status),
      onComplete: (status) => this.handleComplete(status),
      onStateChange: (status) => this.handleStateChange(status),
    });

    this.taskSync = new TaskSync(this.app, this.settings);

    this.registerView(POMODORO_VIEW_TYPE, (leaf) => new PomodoroView(leaf, this));

    this.addRibbonIcon('timer', 'Pomodoro', () => this.activateView());

    // Status bar
    if (this.settings.showInStatusBar) {
      this.statusBarItem = this.addStatusBarItem();
      const name = this.settings.timerName || 'Pomodoro';
      this.statusBarItem.setText(`${name} (click to hide)`);
      this.statusBarItem.addClass('pomodoro-statusbar');
      this.statusBarItem.addEventListener('click', () => {
        this.toggleView();
        // Update text after toggle
        const visible = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE).length > 0;
        const state = this.timer.getStatus().state;
        if (visible) {
          if (state !== 'idle') {
            this.updateStatusBar(`${getStateLabel(state)} ${formatTime(this.timer.getStatus().timeRemaining)}`);
          } else {
            this.statusBarItem!.setText(`${this.settings.timerName || 'Pomodoro'} (click to hide)`);
          }
        }
        // hideView already sets "(click to show)"
      });
    }

    // Commands
    this.addCommand({ id: 'start-pomodoro', name: 'Start pomodoro', callback: () => this.startTimer() });
    this.addCommand({ id: 'pause-pomodoro', name: 'Pause pomodoro', callback: () => this.pauseTimer() });
    this.addCommand({ id: 'stop-pomodoro', name: 'Stop pomodoro', callback: () => this.stopTimer() });
    this.addCommand({ id: 'skip-pomodoro', name: 'Skip to next phase', callback: () => this.skipTimer() });
    this.addCommand({ id: 'open-pomodoro', name: 'Open Pomodoro panel', callback: () => this.activateView() });
    this.addCommand({ id: 'hide-pomodoro', name: 'Hide Pomodoro panel', callback: () => this.hideView() });
    this.addCommand({ id: 'toggle-pomodoro', name: 'Toggle Pomodoro panel', callback: () => this.toggleView() });

    if (Platform.isDesktop) {
      this.addCommand({ id: 'popout-pomodoro', name: 'Pop out to floating window', callback: () => this.popoutTimer() });
    }

    this.addSettingTab(new PomodoroSettingTab(this.app, this));
  }

  async onunload(): Promise<void> {
    this.timer.destroy();
  }

  // Controls
  startTimer(mode?: 'work' | 'short-break' | 'long-break'): void {
    this.timer.start(this.activeTask?.text, mode);
    const label = mode === 'short-break' ? 'Short break' : mode === 'long-break' ? 'Long break' : 'Focus time';
    new Notice(`${label} started`);
  }

  pauseTimer(): void {
    this.timer.pause();
    new Notice('Paused');
  }

  resumeTimer(): void {
    this.timer.resume();
    new Notice('Resumed');
  }

  stopTimer(): void {
    // Return active task to the list (don't remove it)
    this.returnTaskToList();
    this.timer.stop();
    new Notice('Timer reset');
    this.updateStatusBar('Ready');
    // Refresh views to show task back in list
    for (const leaf of this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE)) {
      (leaf.view as PomodoroView).renderLocalTasks();
    }
  }

  skipTimer(): void {
    this.timer.skip();
    new Notice('Skipped to next phase');
  }

  extendTimer(minutes: number): void {
    this.timer.extend(minutes);
    new Notice(`+${minutes} minutes`);
  }

  markTaskDone(): void {
    const taskName = this.activeTask?.text || this.timer.getStatus().activeTask;
    if (taskName) {
      new Notice(`Done: ${taskName}`);
      // Remove from local task list in views
      for (const leaf of this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE)) {
        (leaf.view as PomodoroView).removeLocalTask(taskName);
      }
      this.activeTask = null;
      this.timer.setTask(null);
    } else {
      new Notice('Session complete');
    }
    this.timer.stop();
    this.updateStatusBar('Ready');
    this.updateView(this.timer.getStatus());
  }

  returnTaskToList(): void {
    const taskName = this.activeTask?.text || this.timer.getStatus().activeTask;
    if (taskName) {
      // Task goes back to the list, not removed
      this.activeTask = null;
      this.timer.setTask(null);
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
    for (const leaf of existing) leaf.detach();
    if (this.statusBarItem) {
      const name = this.settings.timerName || 'Pomodoro';
      const state = this.timer.getStatus().state;
      if (state !== 'idle') {
        this.statusBarItem.setText(`${name}: ${getStateLabel(state)} ${formatTime(this.timer.getStatus().timeRemaining)} (click to show)`);
      } else {
        this.statusBarItem.setText(`${name} (click to show)`);
      }
    }
  }

  toggleView(): void {
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    existing.length > 0 ? this.hideView() : this.activateView();
  }

  async popoutTimer(): Promise<void> {
    if (!Platform.isDesktop) return;
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    for (const leaf of existing) leaf.detach();
    const leaf = this.app.workspace.openPopoutLeaf({ size: { width: 340, height: 540 } });
    await leaf.setViewState({ type: POMODORO_VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
    setTimeout(() => { leaf.view?.containerEl?.win?.focus?.(); }, 200);
  }

  async activateView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE);
    if (existing.length > 0) { this.app.workspace.revealLeaf(existing[0]); return; }
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
  }

  private async handleComplete(status: TimerStatus): Promise<void> {
    if (this.settings.soundEnabled) {
      playSound(this.settings.soundFile, this.settings.soundVolume);
    }
    if (this.settings.notifySystem && Platform.isDesktop) {
      try {
        new Notification('Pomodoro Complete', {
          body: `${status.completedPomodoros} pomodoro${status.completedPomodoros !== 1 ? 's' : ''} completed.`,
          silent: !this.settings.notifySound,
        });
      } catch (e) { /* not available */ }
    }
    if (this.settings.notifyOnComplete) {
      new Notice(`Pomodoro #${status.completedPomodoros} complete. ${getStateLabel(status.state)} time.`);
    }
    await this.taskSync.logPomodoro(status.activeTask, this.settings.workDuration);
    if (this.activeTask) {
      await this.taskSync.updateTaskPomodoro(this.activeTask);
    }
  }

  private handleStateChange(status: TimerStatus): void {
    this.updateView(status);
    this.updateStatusBar(`${getStateLabel(status.state)} ${formatTime(status.timeRemaining)}`);
  }

  private updateView(status: TimerStatus): void {
    for (const leaf of this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE)) {
      (leaf.view as PomodoroView).updateTimer(status);
    }
  }

  private updateStatusBar(text: string): void {
    if (this.statusBarItem) {
      this.statusBarItem.setText(`${this.settings.timerName || 'Pomodoro'}: ${text}`);
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
    // Live-update views
    for (const leaf of this.app.workspace.getLeavesOfType(POMODORO_VIEW_TYPE)) {
      const view = leaf.view as PomodoroView;
      const container = view.containerEl.children[1] as HTMLElement;
      container.className = container.className.replace(/pomodoro-theme-\S+/g, '').trim();
      container.addClass(`pomodoro-theme-${this.settings.theme}`);
      container.className = container.className.replace(/pomodoro-size-\S+/g, '').trim();
      container.addClass(`pomodoro-size-${this.settings.timerSize}`);
      if (this.settings.customPrimary) container.style.setProperty('--pomo-accent', this.settings.customPrimary);
      else container.style.removeProperty('--pomo-accent');
      if (this.settings.customSecondary) container.style.setProperty('--pomo-break', this.settings.customSecondary);
      else container.style.removeProperty('--pomo-break');
      if (this.settings.customAccentColor) container.style.setProperty('--pomo-ring-color', this.settings.customAccentColor);
      else container.style.removeProperty('--pomo-ring-color');
      view.refreshTasks();
    }
  }
}
