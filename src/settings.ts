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

  private addColorSetting(container: HTMLElement, name: string, desc: string, placeholder: string, value: string, onChange: (val: string) => void): void {
    const setting = new Setting(container).setName(name).setDesc(desc);

    // Color picker (native OS picker)
    const pickerEl = setting.controlEl.createEl('input', {
      attr: { type: 'color', value: value || placeholder }
    });
    pickerEl.classList.add('pomodoro-color-picker');
    pickerEl.addEventListener('input', (e) => {
      const hex = (e.target as HTMLInputElement).value;
      textEl.value = hex;
      onChange(hex);
    });

    // Text input for manual hex entry
    const textEl = setting.controlEl.createEl('input', {
      cls: 'pomodoro-color-text',
      attr: { type: 'text', placeholder, value: value || '' }
    });
    textEl.addEventListener('change', () => {
      const hex = textEl.value.trim();
      if (hex && /^#[0-9a-fA-F]{3,8}$/.test(hex)) {
        pickerEl.value = hex;
      }
      onChange(hex);
    });

    // Clear button
    const clearBtn = setting.controlEl.createEl('button', { text: 'Clear', cls: 'pomodoro-color-clear' });
    clearBtn.addEventListener('click', () => {
      textEl.value = '';
      pickerEl.value = placeholder;
      onChange('');
    });
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Timer
    containerEl.createEl('h2', { text: 'Timer' });

    new Setting(containerEl)
      .setName('Timer Name')
      .setDesc('Custom name shown in header and status bar')
      .addText(text => text
        .setPlaceholder('Pomodoro')
        .setValue(this.plugin.settings.timerName)
        .onChange(async (value) => {
          this.plugin.settings.timerName = value || 'Pomodoro';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Work Duration')
      .setDesc('Minutes per focus session')
      .addSlider(slider => slider
        .setLimits(1, 90, 1)
        .setValue(this.plugin.settings.workDuration)
        .setDynamicTooltip()
        .onChange(async (value) => { this.plugin.settings.workDuration = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Short Break')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.shortBreakDuration)
        .setDynamicTooltip()
        .onChange(async (value) => { this.plugin.settings.shortBreakDuration = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Long Break')
      .addSlider(slider => slider
        .setLimits(5, 60, 1)
        .setValue(this.plugin.settings.longBreakDuration)
        .setDynamicTooltip()
        .onChange(async (value) => { this.plugin.settings.longBreakDuration = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Long Break Interval')
      .setDesc('Focus sessions before a long break')
      .addSlider(slider => slider
        .setLimits(2, 8, 1)
        .setValue(this.plugin.settings.longBreakInterval)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.longBreakInterval = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Extend Time')
      .setDesc('Minutes added by the + button')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.extendMinutes)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.extendMinutes = value; this.debouncedSave(); }));

    new Setting(containerEl)
      .setName('Auto-Start Breaks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartBreaks)
        .onChange(async (value) => { this.plugin.settings.autoStartBreaks = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Auto-Start Work')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartWork)
        .onChange(async (value) => { this.plugin.settings.autoStartWork = value; await this.plugin.saveSettings(); }));

    // Sound
    containerEl.createEl('h2', { text: 'Sound' });

    new Setting(containerEl)
      .setName('Sound Enabled')
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
      .setName('Task Sync')
      .setDesc('Show tasks from your active file')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.taskSyncEnabled)
        .onChange(async (value) => { this.plugin.settings.taskSyncEnabled = value; await this.plugin.saveSettings(); this.display(); }));

    if (this.plugin.settings.taskSyncEnabled) {
      new Setting(containerEl)
        .setName('Task Source')
        .addDropdown(dropdown => dropdown
          .addOption('obsidian-tasks', 'Active file tasks')
          .addOption('custom-path', 'Custom file path')
          .setValue(this.plugin.settings.taskSource)
          .onChange(async (value: any) => { this.plugin.settings.taskSource = value; await this.plugin.saveSettings(); this.display(); }));

      if (this.plugin.settings.taskSource === 'custom-path') {
        new Setting(containerEl)
          .setName('Task File Path')
          .addText(text => text
            .setPlaceholder('tasks.md')
            .setValue(this.plugin.settings.customTaskPath)
            .onChange(async (value) => { this.plugin.settings.customTaskPath = value; await this.plugin.saveSettings(); }));
      }

      new Setting(containerEl)
        .setName('Log Completed Pomodoros')
        .setDesc('Write session log to a markdown file')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.logCompletedPomodoros)
          .onChange(async (value) => { this.plugin.settings.logCompletedPomodoros = value; await this.plugin.saveSettings(); }));
    }

    // Appearance
    containerEl.createEl('h2', { text: 'Appearance' });

    const themeSetting = new Setting(containerEl)
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
        .setDisabled(this.plugin.settings.useCustomColors)
        .onChange(async (value: any) => { this.plugin.settings.theme = value; await this.plugin.saveSettings(); }));
    if (this.plugin.settings.useCustomColors) {
      themeSetting.setDesc('Disabled while custom colors are active');
      themeSetting.settingEl.style.opacity = '0.5';
    }

    new Setting(containerEl)
      .setName('Timer Size')
      .addDropdown(dropdown => dropdown
        .addOption('small', 'Small')
        .addOption('medium', 'Medium')
        .addOption('large', 'Large')
        .setValue(this.plugin.settings.timerSize)
        .onChange(async (value: any) => { this.plugin.settings.timerSize = value; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Scroll Sensitivity')
      .setDesc('How fast scroll/drag adjusts time (1=slow, 5=fast)')
      .addSlider(slider => slider
        .setLimits(1, 5, 1)
        .setValue(this.plugin.settings.scrollSensitivity)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.scrollSensitivity = value; this.debouncedSave(); }));

    // Custom Colors
    containerEl.createEl('h2', { text: 'Custom Colors' });

    new Setting(containerEl)
      .setName('Use Custom Colors')
      .setDesc('Override theme colors with your own')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useCustomColors)
        .onChange(async (value) => {
          this.plugin.settings.useCustomColors = value;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.useCustomColors) {
      this.addColorSetting(containerEl, 'Focus Color', 'Ring, buttons, tabs, and text during focus', '#3b82f6',
        this.plugin.settings.customPrimary,
        async (value) => { this.plugin.settings.customPrimary = value; await this.plugin.saveSettings(); });

      this.addColorSetting(containerEl, 'Break Color', 'Ring, buttons, and tabs during breaks', '#ef4444',
        this.plugin.settings.customSecondary,
        async (value) => { this.plugin.settings.customSecondary = value; await this.plugin.saveSettings(); });
    }

    // Notifications
    containerEl.createEl('h2', { text: 'Notifications' });

    new Setting(containerEl)
      .setName('System Notifications')
      .setDesc('OS-level notification when timer completes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.notifySystem)
        .onChange(async (value) => { this.plugin.settings.notifySystem = value; await this.plugin.saveSettings(); }));

  }
}
