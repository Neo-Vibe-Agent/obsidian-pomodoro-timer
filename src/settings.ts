import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import { PomodoroSettings, DEFAULT_SETTINGS } from './types';
import { getSoundNames, playSound } from './utils/sound';
import type PomodoroPlugin from './main';

export class PomodoroSettingTab extends PluginSettingTab {
  plugin: PomodoroPlugin;
  private debouncedSave: () => void;

  constructor(app: App, plugin: PomodoroPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.debouncedSave = debounce(() => this.plugin.saveSettings(), 300, true);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Timer
    containerEl.createEl('h2', { text: 'Timer' });

    new Setting(containerEl)
      .setName('Timer name')
      .setDesc('Custom name shown in header and status bar')
      .addText(text => text
        .setPlaceholder('Pomodoro')
        .setValue(this.plugin.settings.timerName)
        .onChange(async (value) => {
          this.plugin.settings.timerName = value || 'Pomodoro';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Work duration')
      .setDesc('Minutes per focus session')
      .addSlider(slider => slider
        .setLimits(1, 90, 1)
        .setValue(this.plugin.settings.workDuration)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.workDuration = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Short break')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.shortBreakDuration)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.shortBreakDuration = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Long break')
      .addSlider(slider => slider
        .setLimits(5, 60, 1)
        .setValue(this.plugin.settings.longBreakDuration)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.longBreakDuration = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Long break interval')
      .setDesc('Focus sessions before a long break')
      .addSlider(slider => slider
        .setLimits(2, 8, 1)
        .setValue(this.plugin.settings.longBreakInterval)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.longBreakInterval = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Extend time')
      .setDesc('Minutes added by the + button')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.extendMinutes)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.extendMinutes = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Auto-start breaks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartBreaks)
        .onChange(async (value) => { this.plugin.settings.autoStartBreaks = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Auto-start work')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartWork)
        .onChange(async (value) => { this.plugin.settings.autoStartWork = value; await this.plugin.saveSettings(); }));

    // Sound
    containerEl.createEl('h2', { text: 'Sound' });

    new Setting(containerEl)
      .setName('Sound enabled')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.soundEnabled)
        .onChange(async (value) => { this.plugin.settings.soundEnabled = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Sound')
      .addDropdown(dropdown => {
        for (const name of getSoundNames()) {
          dropdown.addOption(name, name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
        dropdown.setValue(this.plugin.settings.soundFile)
          .onChange(async (value) => {
            this.plugin.settings.soundFile = value;
            await this.plugin.saveSettings();
            playSound(value, this.plugin.settings.soundVolume);
          });
      })
      .addButton(btn => btn.setButtonText('Test').onClick(() => {
        playSound(this.plugin.settings.soundFile, this.plugin.settings.soundVolume);
      }));

    new Setting(containerEl)
      .setName('Volume')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.soundVolume)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.soundVolume = value; this.debouncedSave(); }));

    // Tasks
    containerEl.createEl('h2', { text: 'Tasks' });

    new Setting(containerEl)
      .setName('Task sync')
      .setDesc('Show tasks from your active file')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.taskSyncEnabled)
        .onChange(async (value) => { this.plugin.settings.taskSyncEnabled = value; await this.plugin.saveSettings(); this.display(); }));

    if (this.plugin.settings.taskSyncEnabled) {
      new Setting(containerEl)
        .setName('Task source')
        .addDropdown(dropdown => dropdown
          .addOption('obsidian-tasks', 'Active file tasks')
          .addOption('custom-path', 'Custom file path')
          .setValue(this.plugin.settings.taskSource)
          .onChange(async (value: any) => { this.plugin.settings.taskSource = value; await this.plugin.saveSettings(); this.display(); }));

      if (this.plugin.settings.taskSource === 'custom-path') {
        new Setting(containerEl)
          .setName('Task file path')
          .addText(text => text
            .setPlaceholder('tasks.md')
            .setValue(this.plugin.settings.customTaskPath)
            .onChange(async (value) => { this.plugin.settings.customTaskPath = value; await this.plugin.saveSettings(); }));
      }

      new Setting(containerEl)
        .setName('Log completed pomodoros')
        .setDesc('Write session log to a markdown file')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.logCompletedPomodoros)
          .onChange(async (value) => { this.plugin.settings.logCompletedPomodoros = value; await this.plugin.saveSettings(); }));
    }

    // Appearance
    containerEl.createEl('h2', { text: 'Appearance' });

    new Setting(containerEl)
      .setName('Theme')
      .addDropdown(dropdown => dropdown
        .addOption('default', 'Default')
        .addOption('clean', 'Clean')
        .addOption('neon', 'Neon')
        .addOption('forest', 'Forest')
        .addOption('citrus', 'Citrus')
        .addOption('matrix', 'Matrix')
        .addOption('cyberpunk', 'Cyberpunk')
        .addOption('angel', 'Angel')
        .addOption('ocean', 'Ocean')
        .addOption('city', 'City')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value: any) => { this.plugin.settings.theme = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Timer size')
      .addDropdown(dropdown => dropdown
        .addOption('small', 'Small')
        .addOption('medium', 'Medium')
        .addOption('large', 'Large')
        .setValue(this.plugin.settings.timerSize)
        .onChange(async (value: any) => { this.plugin.settings.timerSize = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Scroll sensitivity')
      .setDesc('How fast scroll/drag adjusts time (1=slow, 5=fast)')
      .addSlider(slider => slider
        .setLimits(1, 5, 1)
        .setValue(this.plugin.settings.scrollSensitivity)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.scrollSensitivity = value; this.debouncedSave(); }));

    // Custom Colors
    containerEl.createEl('h2', { text: 'Custom Colors' });
    containerEl.createEl('p', { text: 'Override theme colors. Leave empty to use theme defaults.', cls: 'setting-item-description' });

    new Setting(containerEl)
      .setName('Primary')
      .setDesc('Focus ring and buttons')
      .addText(text => text.setPlaceholder('#2dd4a8').setValue(this.plugin.settings.customPrimary)
        .onChange(async (value) => { this.plugin.settings.customPrimary = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Secondary')
      .setDesc('Break state color')
      .addText(text => text.setPlaceholder('#60a5fa').setValue(this.plugin.settings.customSecondary)
        .onChange(async (value) => { this.plugin.settings.customSecondary = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Accent')
      .setDesc('Highlights and active states')
      .addText(text => text.setPlaceholder('#ff006e').setValue(this.plugin.settings.customAccentColor)
        .onChange(async (value) => { this.plugin.settings.customAccentColor = value; await this.plugin.saveSettings(); }));

    // Notifications
    containerEl.createEl('h2', { text: 'Notifications' });

    new Setting(containerEl)
      .setName('System notifications')
      .setDesc('OS-level notification when timer completes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.notifySystem)
        .onChange(async (value) => { this.plugin.settings.notifySystem = value; await this.plugin.saveSettings(); }));
  }
}
