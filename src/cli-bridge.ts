import { App, TFile, debounce } from 'obsidian';
import { PomodoroSettings, CLIState, TimerStatus } from './types';

export class CLIBridge {
  private app: App;
  private settings: PomodoroSettings;
  private watching: boolean = false;
  private onExternalUpdate: (status: TimerStatus) => void;
  private fileWatcher: ReturnType<typeof setInterval> | null = null;
  private lastModified: number = 0;

  constructor(
    app: App,
    settings: PomodoroSettings,
    onExternalUpdate: (status: TimerStatus) => void
  ) {
    this.app = app;
    this.settings = settings;
    this.onExternalUpdate = onExternalUpdate;
  }

  updateSettings(settings: PomodoroSettings): void {
    this.settings = settings;
    if (settings.cliSyncEnabled && !this.watching) {
      this.startWatching();
    } else if (!settings.cliSyncEnabled && this.watching) {
      this.stopWatching();
    }
  }

  async writeState(status: TimerStatus): Promise<void> {
    if (!this.settings.cliSyncEnabled) return;

    const state: CLIState = {
      timer: status,
      lastUpdated: Date.now(),
      source: 'obsidian',
    };

    const content = JSON.stringify(state, null, 2);
    const file = this.app.vault.getAbstractFileByPath(this.settings.cliStateFile);

    try {
      if (file instanceof TFile) {
        await this.app.vault.modify(file, content);
      } else {
        await this.app.vault.create(this.settings.cliStateFile, content);
      }
      this.lastModified = Date.now();
    } catch (e) {
      console.warn('Pomodoro: CLI state write failed', e);
    }
  }

  startWatching(): void {
    if (this.watching) return;
    this.watching = true;

    // Poll for file changes every 500ms (debounced)
    this.fileWatcher = setInterval(async () => {
      await this.checkForExternalUpdate();
    }, 500);
  }

  stopWatching(): void {
    this.watching = false;
    if (this.fileWatcher) {
      clearInterval(this.fileWatcher);
      this.fileWatcher = null;
    }
  }

  private checkForExternalUpdate = debounce(async () => {
    if (!this.settings.cliSyncEnabled) return;

    const file = this.app.vault.getAbstractFileByPath(this.settings.cliStateFile);
    if (!(file instanceof TFile)) return;

    const stat = await this.app.vault.adapter.stat(this.settings.cliStateFile);
    if (!stat || stat.mtime <= this.lastModified) return;

    try {
      const content = await this.app.vault.read(file);
      const state: CLIState = JSON.parse(content);

      if (state.source === 'cli' && state.lastUpdated > this.lastModified) {
        this.lastModified = state.lastUpdated;
        this.onExternalUpdate(state.timer);
      }
    } catch (e) {
      // Ignore parse errors (file might be mid-write)
    }
  }, 200, true);

  destroy(): void {
    this.stopWatching();
  }
}
