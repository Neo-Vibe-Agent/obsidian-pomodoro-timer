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

    // Timer Settings
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
      .setDesc('Minutes per pomodoro')
      .addSlider(slider => slider
        .setLimits(1, 90, 1)
        .setValue(this.plugin.settings.workDuration)
        .setDynamicTooltip()
        .onChange((value) => {
          this.plugin.settings.workDuration = value;
          this.debouncedSave();
        }));

    new Setting(containerEl)
      .setName('Short break')
      .setDesc('Minutes for short break')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.shortBreakDuration)
        .setDynamicTooltip()
        .onChange((value) => {
          this.plugin.settings.shortBreakDuration = value;
          this.debouncedSave();
        }));

    new Setting(containerEl)
      .setName('Long break')
      .setDesc('Minutes for long break')
      .addSlider(slider => slider
        .setLimits(5, 60, 1)
        .setValue(this.plugin.settings.longBreakDuration)
        .setDynamicTooltip()
        .onChange((value) => {
          this.plugin.settings.longBreakDuration = value;
          this.debouncedSave();
        }));

    new Setting(containerEl)
      .setName('Long break interval')
      .setDesc('Number of pomodoros before a long break')
      .addSlider(slider => slider
        .setLimits(2, 8, 1)
        .setValue(this.plugin.settings.longBreakInterval)
        .setDynamicTooltip()
        .onChange((value) => {
          this.plugin.settings.longBreakInterval = value;
          this.debouncedSave();
        }));

    new Setting(containerEl)
      .setName('Auto-start breaks')
      .setDesc('Automatically start break when pomodoro ends')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartBreaks)
        .onChange(async (value) => {
          this.plugin.settings.autoStartBreaks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Auto-start work')
      .setDesc('Automatically start next pomodoro when break ends')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartWork)
        .onChange(async (value) => {
          this.plugin.settings.autoStartWork = value;
          await this.plugin.saveSettings();
        }));

    // Sound Settings
    containerEl.createEl('h2', { text: 'Sound' });

    new Setting(containerEl)
      .setName('Sound enabled')
      .setDesc('Play sound when timer completes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.soundEnabled)
        .onChange(async (value) => {
          this.plugin.settings.soundEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sound')
      .setDesc('Completion sound')
      .addDropdown(dropdown => {
        for (const name of getSoundNames()) {
          dropdown.addOption(name, name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
        dropdown.setValue(this.plugin.settings.soundFile)
          .onChange(async (value) => {
            this.plugin.settings.soundFile = value;
            await this.plugin.saveSettings();
            // Preview the sound
            playSound(value, this.plugin.settings.soundVolume);
          });
      })
      .addButton(btn => btn
        .setButtonText('Test')
        .onClick(() => {
          playSound(this.plugin.settings.soundFile, this.plugin.settings.soundVolume);
        }));

    new Setting(containerEl)
      .setName('Volume')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.1)
        .setValue(this.plugin.settings.soundVolume)
        .setDynamicTooltip()
        .onChange((value) => {
          this.plugin.settings.soundVolume = value;
          this.debouncedSave();
        }));

    // Task Settings
    containerEl.createEl('h2', { text: 'Tasks' });

    new Setting(containerEl)
      .setName('Task sync')
      .setDesc('Sync tasks from your vault')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.taskSyncEnabled)
        .onChange(async (value) => {
          this.plugin.settings.taskSyncEnabled = value;
          await this.plugin.saveSettings();
          this.display(); // Re-render to show/hide dependent settings
        }));

    if (this.plugin.settings.taskSyncEnabled) {
      new Setting(containerEl)
        .setName('Task source')
        .setDesc('Where to read tasks from')
        .addDropdown(dropdown => dropdown
          .addOption('obsidian-tasks', 'Obsidian Tasks plugin')
          .addOption('dataview', 'DataView')
          .addOption('custom-path', 'Custom file path')
          .setValue(this.plugin.settings.taskSource)
          .onChange(async (value: any) => {
            this.plugin.settings.taskSource = value;
            await this.plugin.saveSettings();
            this.display();
          }));

      if (this.plugin.settings.taskSource === 'custom-path') {
        new Setting(containerEl)
          .setName('Custom task file')
          .setDesc('Vault path to your task file (e.g., tasks.md)')
          .addText(text => text
            .setPlaceholder('tasks.md')
            .setValue(this.plugin.settings.customTaskPath)
            .onChange(async (value) => {
              this.plugin.settings.customTaskPath = value;
              await this.plugin.saveSettings();
            }));
      }

      new Setting(containerEl)
        .setName('Log completed pomodoros')
        .setDesc('Write completed pomodoros to a log file')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.logCompletedPomodoros)
          .onChange(async (value) => {
            this.plugin.settings.logCompletedPomodoros = value;
            await this.plugin.saveSettings();
          }));
    }

    // Calendar Settings
    containerEl.createEl('h2', { text: 'Calendar' });

    new Setting(containerEl)
      .setName('Calendar sync')
      .setDesc('Show upcoming calendar events to plan pomodoros')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.calendarSyncEnabled)
        .onChange(async (value) => {
          this.plugin.settings.calendarSyncEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.calendarSyncEnabled) {
      new Setting(containerEl)
        .setName('Google Calendar ID')
        .setDesc('Your Google Calendar ID (found in Calendar Settings)')
        .addText(text => text
          .setPlaceholder('your-email@gmail.com')
          .setValue(this.plugin.settings.googleCalendarId)
          .onChange(async (value) => {
            this.plugin.settings.googleCalendarId = value;
            await this.plugin.saveSettings();
          }));
    }

    // CLI Settings
    containerEl.createEl('h2', { text: 'CLI Companion' });

    new Setting(containerEl)
      .setName('CLI sync')
      .setDesc('Share timer state with a terminal companion via file watching')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.cliSyncEnabled)
        .onChange(async (value) => {
          this.plugin.settings.cliSyncEnabled = value;
          await this.plugin.saveSettings();
        }));

    // Theme Settings
    containerEl.createEl('h2', { text: 'Appearance' });

    new Setting(containerEl)
      .setName('Theme')
      .addDropdown(dropdown => dropdown
        .addOption('default', 'Default')
        .addOption('minimal', 'Minimal')
        .addOption('neon', 'Neon')
        .addOption('forest', 'Forest')
        .addOption('orange', 'Orange')
        .addOption('matrix', 'Matrix')
        .addOption('cyberpunk', 'Cyberpunk')
        .addOption('angel', 'Angel')
        .addOption('ocean', 'Ocean')
        .addOption('city', 'City')
        .setValue(this.plugin.settings.theme)
        .onChange(async (value: any) => {
          this.plugin.settings.theme = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Timer size')
      .addDropdown(dropdown => dropdown
        .addOption('small', 'Small')
        .addOption('medium', 'Medium')
        .addOption('large', 'Large')
        .setValue(this.plugin.settings.timerSize)
        .onChange(async (value: any) => {
          this.plugin.settings.timerSize = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Status bar')
      .setDesc('Show timer in status bar')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showInStatusBar)
        .onChange(async (value) => {
          this.plugin.settings.showInStatusBar = value;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('h2', { text: 'Custom Colors' });
    containerEl.createEl('p', { text: 'Override theme colors. Leave empty to use theme defaults.', cls: 'setting-item-description' });

    new Setting(containerEl)
      .setName('Primary color')
      .setDesc('Main accent (timer ring, buttons)')
      .addText(text => text
        .setPlaceholder('#2dd4a8')
        .setValue(this.plugin.settings.customPrimary)
        .onChange(async (value) => {
          this.plugin.settings.customPrimary = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Secondary color')
      .setDesc('Break state color')
      .addText(text => text
        .setPlaceholder('#60a5fa')
        .setValue(this.plugin.settings.customSecondary)
        .onChange(async (value) => {
          this.plugin.settings.customSecondary = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Accent color')
      .setDesc('Highlights, active states')
      .addText(text => text
        .setPlaceholder('#ff006e')
        .setValue(this.plugin.settings.customAccentColor)
        .onChange(async (value) => {
          this.plugin.settings.customAccentColor = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Scroll sensitivity')
      .setDesc('How sensitive the scroll/drag time adjustment is (1 = least, 5 = most)')
      .addSlider(slider => slider
        .setLimits(1, 5, 1)
        .setValue(this.plugin.settings.scrollSensitivity)
        .setDynamicTooltip()
        .onChange((value) => {
          this.plugin.settings.scrollSensitivity = value;
          this.debouncedSave();
        }));

    // Notifications
    containerEl.createEl('h2', { text: 'Notifications' });

    new Setting(containerEl)
      .setName('System notifications')
      .setDesc('Show OS-level notification when timer completes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.notifySystem)
        .onChange(async (value) => {
          this.plugin.settings.notifySystem = value;
          await this.plugin.saveSettings();
        }));
  }
}
