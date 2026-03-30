import { App, TFile } from 'obsidian';
import { PomodoroSettings, TaskItem } from './types';

export class TaskSync {
  private app: App;
  private settings: PomodoroSettings;

  constructor(app: App, settings: PomodoroSettings) {
    this.app = app;
    this.settings = settings;
  }

  updateSettings(settings: PomodoroSettings): void {
    this.settings = settings;
  }

  async getTasks(): Promise<TaskItem[]> {
    if (!this.settings.taskSyncEnabled) return [];

    switch (this.settings.taskSource) {
      case 'obsidian-tasks':
        return this.getActiveFileTasks();
      case 'custom-path':
        return this.getCustomPathTasks();
      default:
        return [];
    }
  }

  // Read tasks from the currently active file only (no vault-wide scan)
  private async getActiveFileTasks(): Promise<TaskItem[]> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return [];
    return this.readTasksFromFile(activeFile);
  }

  private async getCustomPathTasks(): Promise<TaskItem[]> {
    if (!this.settings.customTaskPath) return [];
    const file = this.app.vault.getAbstractFileByPath(this.settings.customTaskPath);
    if (!(file instanceof TFile)) return [];
    return this.readTasksFromFile(file);
  }

  private async readTasksFromFile(file: TFile): Promise<TaskItem[]> {
    const tasks: TaskItem[] = [];
    const content = await this.app.vault.cachedRead(file);
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(\s*)- \[ \] (.+)$/);
      if (match) {
        const text = match[2].trim();
        if (text.length === 0) continue;

        const pomoMatch = text.match(/\[pomo::\s*(\d+)\/(\d+)\]/);
        tasks.push({
          text: text.replace(/\[pomo::\s*\d+\/\d+\]/, '').trim(),
          path: file.path,
          line: i,
          completed: false,
          estimatedPomodoros: pomoMatch ? parseInt(pomoMatch[2]) : undefined,
          completedPomodoros: pomoMatch ? parseInt(pomoMatch[1]) : 0,
        });
      }
    }

    return tasks;
  }

  async logPomodoro(task: string | null, duration: number): Promise<void> {
    if (!this.settings.logCompletedPomodoros) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const entry = `| ${dateStr} | ${timeStr} | ${duration}min | ${task || 'No task'} |`;

    let file = this.app.vault.getAbstractFileByPath(this.settings.logFile);

    if (!file) {
      const header = `# Pomodoro Log\n\n| Date | Time | Duration | Task |\n|------|------|----------|------|\n`;
      await this.app.vault.create(this.settings.logFile, header + entry + '\n');
    } else if (file instanceof TFile) {
      const content = await this.app.vault.read(file);
      await this.app.vault.modify(file, content + entry + '\n');
    }
  }

  async updateTaskPomodoro(task: TaskItem): Promise<void> {
    if (!task.path) return; // Custom input tasks have no file path
    const file = this.app.vault.getAbstractFileByPath(task.path);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const lines = content.split('\n');
    const line = lines[task.line];
    if (!line) return;

    const pomoRegex = /\[pomo::\s*(\d+)\/(\d+)\]/;
    const match = line.match(pomoRegex);
    const completed = (task.completedPomodoros || 0) + 1;

    if (match) {
      lines[task.line] = line.replace(pomoRegex, `[pomo:: ${completed}/${parseInt(match[2])}]`);
    } else {
      lines[task.line] = line.trimEnd() + ` [pomo:: ${completed}/4]`;
    }

    await this.app.vault.modify(file, lines.join('\n'));
  }
}
