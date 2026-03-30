import { App, PluginSettingTab, Setting, debounce } from 'obsidian';
import { PomodoroSettings } from './types';
import { getSoundNames, playSound } from './utils/sound';
import type PomodoroPlugin from './main';

export class PomodoroSettingTab extends PluginSettingTab {
  plugin: PomodoroPlugin;
  private debouncedSave: () => void;

  constructor(app: App, plugin: PomodoroPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.debouncedSave = debounce(() => { void this.plugin.saveSettings(); }, 300, true);
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
    new Setting(containerEl).setName('Timer').setHeading();

    new Setting(containerEl)
      .setName('Timer name')
      .setDesc('Custom name shown in header and status bar')
      .addText(text => text
        .setPlaceholder('Pomodoro')
        .setValue(this.plugin.settings.timerName)
        .onChange((value) => {
          this.plugin.settings.timerName = value || 'Pomodoro';
          void this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Work duration')
      .setDesc('Minutes per focus session')
      .addSlider(slider => slider
        .setLimits(1, 90, 1)
        .setValue(this.plugin.settings.workDuration)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.workDuration = value; void this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Short break')
      .addSlider(slider => slider
        .setLimits(1, 30, 1)
        .setValue(this.plugin.settings.shortBreakDuration)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.shortBreakDuration = value; void this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Long break')
      .addSlider(slider => slider
        .setLimits(5, 60, 1)
        .setValue(this.plugin.settings.longBreakDuration)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.longBreakDuration = value; void this.plugin.saveSettings(); }));

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
        .onChange((value) => { this.plugin.settings.autoStartBreaks = value; void this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Auto-start work')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartWork)
        .onChange((value) => { this.plugin.settings.autoStartWork = value; void this.plugin.saveSettings(); }));

    // Sound
    new Setting(containerEl).setName('Sound').setHeading();

    new Setting(containerEl)
      .setName('Sound enabled')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.soundEnabled)
        .onChange((value) => { this.plugin.settings.soundEnabled = value; void this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Sound')
      .addDropdown(dropdown => {
        for (const name of getSoundNames()) {
          dropdown.addOption(name, name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
        }
        dropdown.setValue(this.plugin.settings.soundFile)
          .onChange((value) => {
            this.plugin.settings.soundFile = value;
            void this.plugin.saveSettings();
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
    new Setting(containerEl).setName('Tasks').setHeading();

    new Setting(containerEl)
      .setName('Task sync')
      .setDesc('Show tasks from your active file')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.taskSyncEnabled)
        .onChange((value) => { this.plugin.settings.taskSyncEnabled = value; void this.plugin.saveSettings(); this.display(); }));

    if (this.plugin.settings.taskSyncEnabled) {
      new Setting(containerEl)
        .setName('Task source')
        .addDropdown(dropdown => dropdown
          .addOption('obsidian-tasks', 'Active file tasks')
          .addOption('custom-path', 'Custom file path')
          .setValue(this.plugin.settings.taskSource)
          .onChange((value) => { this.plugin.settings.taskSource = value as PomodoroSettings['taskSource']; void this.plugin.saveSettings(); this.display(); }));

      if (this.plugin.settings.taskSource === 'custom-path') {
        new Setting(containerEl)
          .setName('Task file path')
          .addText(text => text
            .setPlaceholder('tasks.md')
            .setValue(this.plugin.settings.customTaskPath)
            .onChange((value) => { this.plugin.settings.customTaskPath = value; void this.plugin.saveSettings(); }));
      }

      new Setting(containerEl)
        .setName('Log completed pomodoros')
        .setDesc('Write session log to a markdown file')
        .addToggle(toggle => toggle
          .setValue(this.plugin.settings.logCompletedPomodoros)
          .onChange((value) => { this.plugin.settings.logCompletedPomodoros = value; void this.plugin.saveSettings(); }));
    }

    // Appearance
    new Setting(containerEl).setName('Appearance').setHeading();

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
        .onChange((value) => { this.plugin.settings.theme = value as PomodoroSettings['theme']; void this.plugin.saveSettings(); }));
    if (this.plugin.settings.useCustomColors) {
      themeSetting.setDesc('Disabled while custom colors are active');
      themeSetting.settingEl.addClass('pomodoro-setting-disabled');
    }

    new Setting(containerEl)
      .setName('Timer size')
      .addDropdown(dropdown => dropdown
        .addOption('small', 'Small')
        .addOption('medium', 'Medium')
        .addOption('large', 'Large')
        .setValue(this.plugin.settings.timerSize)
        .onChange((value) => { this.plugin.settings.timerSize = value as PomodoroSettings['timerSize']; void this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Scroll sensitivity')
      .setDesc('How fast scroll/drag adjusts time (1=slow, 5=fast)')
      .addSlider(slider => slider
        .setLimits(1, 5, 1)
        .setValue(this.plugin.settings.scrollSensitivity)
        .setDynamicTooltip()
        .onChange((value) => { this.plugin.settings.scrollSensitivity = value; this.debouncedSave(); }));

    // Custom Colors
    new Setting(containerEl).setName('Custom colors').setHeading();

    new Setting(containerEl)
      .setName('Use custom colors')
      .setDesc('Override theme colors with your own')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.useCustomColors)
        .onChange((value) => {
          this.plugin.settings.useCustomColors = value;
          void this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.useCustomColors) {
      this.addColorSetting(containerEl, 'Focus color', 'Ring, buttons, tabs, and text during focus', '#3b82f6',
        this.plugin.settings.customPrimary,
        (value) => { this.plugin.settings.customPrimary = value; void this.plugin.saveSettings(); });

      this.addColorSetting(containerEl, 'Break color', 'Ring, buttons, and tabs during breaks', '#ef4444',
        this.plugin.settings.customSecondary,
        (value) => { this.plugin.settings.customSecondary = value; void this.plugin.saveSettings(); });
    }

    // Notifications
    new Setting(containerEl).setName('Notifications').setHeading();

    new Setting(containerEl)
      .setName('System notifications')
      .setDesc('OS-level notification when timer completes')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.notifySystem)
        .onChange((value) => { this.plugin.settings.notifySystem = value; void this.plugin.saveSettings(); }));

  }
}
