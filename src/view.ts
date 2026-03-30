import { ItemView, WorkspaceLeaf, Platform } from 'obsidian';
import { TimerStatus, TaskItem } from './types';
import { formatTime, getProgressPercentage, getStateLabel } from './utils/format';
import type PomodoroPlugin from './main';

export const POMODORO_VIEW_TYPE = 'pomodoro-view';

const PRESETS = [
  { label: '25m', minutes: 25 },
  { label: '50m', minutes: 50 },
  { label: '90m', minutes: 90 },
];

export class PomodoroView extends ItemView {
  plugin: PomodoroPlugin;
  private container: Element;
  private ringWrapper: HTMLElement;
  private timerDisplay: HTMLElement;
  private stateLabel: HTMLElement;
  private ringCircle: SVGCircleElement;
  private ringCircumference: number;
  private modeTabs: HTMLElement;
  private presetBtns: HTMLElement;
  private cycleDots: HTMLElement;
  private pomodoroCount: HTMLElement;
  private taskDisplay: HTMLElement;
  private secondaryControls: HTMLElement;
  private primaryBtn: HTMLElement;
  private taskSection: HTMLElement;
  private taskList: HTMLElement;
  private lastRenderedState: string = '';
  private activePreset: number;
  private selectedMode: 'work' | 'short-break' | 'long-break' = 'work';
  private taskInputWrapper: HTMLElement;
  private _onMouseMove: ((e: MouseEvent) => void) | null = null;
  private _onMouseUp: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: PomodoroPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.activePreset = plugin.settings.workDuration;
  }

  getViewType(): string { return POMODORO_VIEW_TYPE; }
  getDisplayText(): string { return this.plugin.settings.timerName || 'Pomodoro'; }
  getIcon(): string { return 'timer'; }

  async onOpen(): Promise<void> {
    this.container = this.containerEl.children[1];
    this.container.empty();
    this.container.addClass('pomodoro-container');
    this.container.addClass(`pomodoro-theme-${this.plugin.settings.theme}`);
    this.container.addClass(`pomodoro-size-${this.plugin.settings.timerSize}`);
    this.container.addClass('pomodoro-state-idle');

    const c = this.container as HTMLElement;

    // ===== HEADER =====
    const header = c.createDiv({ cls: 'pomodoro-header' });
    header.createSpan({ cls: 'pomodoro-header-title', text: this.plugin.settings.timerName || 'Pomodoro' });
    const headerActions = header.createDiv({ cls: 'pomodoro-header-actions' });

    // Popout (desktop only)
    if (Platform.isDesktop) {
      const popoutBtn = headerActions.createEl('button', {
        cls: 'pomodoro-header-btn',
        attr: { 'aria-label': 'Pop out', title: 'Floating window' }
      });
      popoutBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
      popoutBtn.addEventListener('click', () => this.plugin.popoutTimer());
    }

    // Hide
    const hideBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn',
      attr: { 'aria-label': 'Hide', title: 'Minimize to status bar' }
    });
    hideBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    hideBtn.addEventListener('click', () => this.plugin.hideView());

    // Settings
    const settingsBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn',
      attr: { 'aria-label': 'Settings', title: 'Settings' }
    });
    settingsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    settingsBtn.addEventListener('click', () => {
      (this.app as any).setting?.open?.();
      (this.app as any).setting?.openTabById?.('all-in-one-pomodoro');
    });

    // Close
    const closeBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn',
      attr: { 'aria-label': 'Close', title: 'Close' }
    });
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', () => this.leaf.detach());

    // ===== MODE TABS =====
    this.modeTabs = c.createDiv({ cls: 'pomodoro-mode-tabs' });
    this.renderModeTabs('work');

    // ===== TIMER =====
    const timerSection = c.createDiv({ cls: 'pomodoro-timer-section' });

    // Ring (SVG viewBox scales responsively)
    const viewSize = 200;
    const stroke = 7;
    const radius = (viewSize - stroke * 2) / 2;
    this.ringCircumference = 2 * Math.PI * radius;

    this.ringWrapper = timerSection.createDiv({ cls: 'pomodoro-ring-wrapper' });

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${viewSize} ${viewSize}`);
    svg.classList.add('pomodoro-ring-svg');

    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', String(viewSize / 2));
    bgCircle.setAttribute('cy', String(viewSize / 2));
    bgCircle.setAttribute('r', String(radius));
    bgCircle.setAttribute('fill', 'none');
    bgCircle.classList.add('pomodoro-ring-bg');
    svg.appendChild(bgCircle);

    this.ringCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.ringCircle.setAttribute('cx', String(viewSize / 2));
    this.ringCircle.setAttribute('cy', String(viewSize / 2));
    this.ringCircle.setAttribute('r', String(radius));
    this.ringCircle.setAttribute('fill', 'none');
    this.ringCircle.setAttribute('stroke-dasharray', String(this.ringCircumference));
    this.ringCircle.setAttribute('stroke-dashoffset', '0');
    this.ringCircle.classList.add('pomodoro-ring-progress');
    svg.appendChild(this.ringCircle);
    this.ringWrapper.appendChild(svg);

    // Timer display inside ring
    const ringContent = this.ringWrapper.createDiv({ cls: 'pomodoro-ring-content' });
    this.timerDisplay = ringContent.createDiv({ cls: 'pomodoro-timer-display', text: formatTime(this.plugin.settings.workDuration * 60) });
    this.stateLabel = ringContent.createDiv({ cls: 'pomodoro-ring-state', text: 'FOCUS' });

    // Set initial ring fill
    const initPct = (this.plugin.settings.workDuration / 90) * 100;
    this.ringCircle.setAttribute('stroke-dashoffset', String(this.ringCircumference * (1 - initPct / 100)));

    // Click ring to start/pause/resume
    let clickBlocked = false;
    this.ringWrapper.addEventListener('mousedown', () => { clickBlocked = false; });
    this.ringWrapper.addEventListener('mousemove', () => { clickBlocked = true; });
    this.ringWrapper.addEventListener('click', () => {
      if (clickBlocked) return;
      const running = this.plugin.timer.isRunning();
      const state = this.plugin.timer.getStatus().state;
      if (state === 'idle') this.plugin.startTimer(this.selectedMode);
      else if (state === 'paused') this.plugin.resumeTimer();
      else if (!running) this.plugin.timer.beginPhase();  // break waiting to start
      else this.plugin.pauseTimer();
    });

    // Scroll to adjust time when idle
    this.ringWrapper.addEventListener('wheel', (e: WheelEvent) => {
      const state = this.plugin.timer.getStatus().state;
      if (state !== 'idle') return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      this.adjustIdleTime(delta);
    }, { passive: false });

    // Drag to adjust time when idle
    let isDragging = false;
    let dragStartY = 0;
    let dragAccumulator = 0;

    this.ringWrapper.addEventListener('mousedown', (e: MouseEvent) => {
      if (this.plugin.timer.getStatus().state !== 'idle') return;
      isDragging = true;
      dragStartY = e.clientY;
      dragAccumulator = 0;
      this.ringWrapper.addClass('dragging');
      e.preventDefault();
    });

    this._onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY - e.clientY;
      dragAccumulator += deltaY;
      dragStartY = e.clientY;
      const px = this.getSensitivityPx();
      const minutesDelta = Math.trunc(dragAccumulator / px);
      if (minutesDelta !== 0) {
        dragAccumulator -= minutesDelta * px;
        this.adjustIdleTime(minutesDelta);
      }
    };
    this._onMouseUp = () => {
      if (isDragging) { isDragging = false; this.ringWrapper.removeClass('dragging'); }
    };
    // Use the view's own document (works in both sidebar and popout window)
    const doc = this.containerEl.doc;
    doc.addEventListener('mousemove', this._onMouseMove);
    doc.addEventListener('mouseup', this._onMouseUp);

    // ===== PRESETS =====
    this.presetBtns = timerSection.createDiv({ cls: 'pomodoro-presets' });
    this.renderPresets();

    // ===== PRIMARY BUTTON =====
    this.primaryBtn = timerSection.createEl('button', { cls: 'pomodoro-primary-btn', text: 'Start' });
    this.primaryBtn.addEventListener('click', () => {
      const state = this.plugin.timer.getStatus().state;
      const running = this.plugin.timer.isRunning();
      if (state === 'idle') this.plugin.startTimer(this.selectedMode);
      else if (state === 'paused') this.plugin.resumeTimer();
      else if (!running) this.plugin.timer.beginPhase();
      else this.plugin.pauseTimer();
    });

    // ===== SECONDARY CONTROLS =====
    this.secondaryControls = timerSection.createDiv({ cls: 'pomodoro-secondary-controls' });

    // ===== CYCLE DOTS + STATS =====
    this.cycleDots = c.createDiv({ cls: 'pomodoro-cycle-dots' });
    this.renderCycleDots(0);
    this.pomodoroCount = c.createDiv({ cls: 'pomodoro-count', text: '0m | 0 sessions | 0 done' });

    // ===== TASK DISPLAY =====
    this.taskDisplay = c.createDiv({ cls: 'pomodoro-active-task' });

    // ===== TASK LIST (collapsible) =====
    this.taskSection = c.createDiv({ cls: 'pomodoro-task-section collapsed' });
    const taskHeader = this.taskSection.createDiv({ cls: 'pomodoro-section-header' });
    taskHeader.createEl('h4', { text: 'Tasks', cls: 'pomodoro-section-title' });
    const taskChevron = taskHeader.createSpan({ cls: 'pomodoro-chevron' });
    taskChevron.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

    // Task input
    this.taskInputWrapper = this.taskSection.createDiv({ cls: 'pomodoro-task-input-wrapper' });
    const taskInputWrapper = this.taskInputWrapper;
    const taskInput = taskInputWrapper.createEl('input', {
      cls: 'pomodoro-task-input',
      attr: { type: 'text', placeholder: 'Add a task...' }
    });

    const addTaskToList = () => {
      if (this.plugin.timer.isRunning()) return; // locked while timer is running
      const name = taskInput.value.trim();
      if (!name) return;
      this.plugin.localTasks.push(name);
      taskInput.value = '';
      this.renderLocalTasks();
    };

    taskInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') addTaskToList();
    });

    const taskAddBtn = taskInputWrapper.createEl('button', { cls: 'pomodoro-task-add-btn', attr: { 'aria-label': 'Add' } });
    taskAddBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    taskAddBtn.addEventListener('click', addTaskToList);

    this.taskList = this.taskSection.createDiv({ cls: 'pomodoro-task-list' });
    taskHeader.addEventListener('click', () => {
      this.taskSection.toggleClass('collapsed', !this.taskSection.hasClass('collapsed'));
    });

    await this.refreshTasks();
  }

  async onClose(): Promise<void> {
    const doc = this.containerEl.doc;
    if (this._onMouseMove) doc.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseUp) doc.removeEventListener('mouseup', this._onMouseUp);
    this._onMouseMove = null;
    this._onMouseUp = null;
  }

  updateTimer(status: TimerStatus): void {
    if (this.timerDisplay) this.timerDisplay.setText(formatTime(Math.floor(status.timeRemaining)));

    if (this.stateLabel) {
      const labels: Record<string, string> = { 'idle': 'FOCUS', 'work': 'FOCUS', 'short-break': 'SHORT BREAK', 'long-break': 'LONG BREAK', 'paused': 'PAUSED' };
      this.stateLabel.setText(labels[status.state] || 'FOCUS');
    }

    // Apply state class BEFORE ring update so CSS transition rules are active
    if (this.container && status.state !== this.lastRenderedState) {
      ['idle', 'work', 'short-break', 'long-break', 'paused'].forEach(s => this.container.removeClass(`pomodoro-state-${s}`));
      this.container.addClass(`pomodoro-state-${status.state}`);

      if (this.lastRenderedState) {
        this.container.addClass('pomodoro-phase-transition');
        setTimeout(() => this.container.removeClass('pomodoro-phase-transition'), 600);
      }
      this.renderModeTabs(status.state === 'short-break' || status.state === 'long-break' ? status.state : 'work');
      if (this.presetBtns) this.presetBtns.toggleClass('hidden', status.state !== 'idle');
    }

    if (this.ringCircle) {
      // Always use 90-min scale so the ring never jumps between states
      const remainingMinutes = status.timeRemaining / 60;
      const fillRatio = remainingMinutes / 90;
      this.ringCircle.setAttribute('stroke-dashoffset', String(this.ringCircumference * (1 - fillRatio)));
    }

    if (this.primaryBtn) {
      // If timer is ticking, show Pause. If not ticking (idle, waiting-to-start break, paused), show Start/Resume.
      const isRunning = this.plugin.timer.isRunning();
      let btnText = 'Start';
      if (isRunning) btnText = 'Pause';
      else if (status.state === 'paused') btnText = 'Resume';
      this.primaryBtn.setText(btnText);
      this.primaryBtn.className = `pomodoro-primary-btn pomodoro-primary-${status.state}`;
    }

    if (this.cycleDots) this.renderCycleDots(status.completedPomodoros);

    if (this.pomodoroCount) {
      const totalMin = status.completedPomodoros * this.plugin.settings.workDuration;
      this.pomodoroCount.setText(`${totalMin}m | ${status.completedPomodoros} sessions | ${status.completedPomodoros} done`);
    }

    if (this.taskDisplay) {
      this.taskDisplay.setText(status.activeTask || '');
      this.taskDisplay.toggleClass('has-task', !!status.activeTask);
    }

    // Lock/unlock task input and list based on running state
    const isRunning = this.plugin.timer.isRunning();
    if (this.taskInputWrapper) {
      this.taskInputWrapper.toggleClass('locked', isRunning);
    }

    if (status.state !== this.lastRenderedState) {
      this.renderSecondaryControls(status.state);
      this.renderLocalTasks(); // re-render to update locked state
      this.lastRenderedState = status.state;
    }
  }

  private renderModeTabs(activeMode: string): void {
    if (!this.modeTabs) return;
    this.modeTabs.empty();
    const modes = [
      { id: 'work', label: 'Focus Time' },
      { id: 'short-break', label: 'Short Break' },
      { id: 'long-break', label: 'Long Break' },
    ];
    for (const mode of modes) {
      const tab = this.modeTabs.createDiv({ cls: `pomodoro-mode-tab ${mode.id === activeMode ? 'active' : ''}`, text: mode.label });
      tab.addEventListener('click', () => {
        const running = this.plugin.timer.isRunning();
        if (running) return; // can't switch while timer is actively counting
        // Stop current timer if switching modes from a waiting break
        const state = this.plugin.timer.getStatus().state;
        if (state !== 'idle') {
          this.plugin.timer.stop();
        }
        this.selectedMode = mode.id as any;
        let minutes = this.plugin.settings.workDuration;
        if (mode.id === 'short-break') minutes = this.plugin.settings.shortBreakDuration;
        if (mode.id === 'long-break') minutes = this.plugin.settings.longBreakDuration;
        this.timerDisplay.setText(formatTime(minutes * 60));
        if (this.stateLabel) {
          const labels: Record<string, string> = { 'work': 'FOCUS', 'short-break': 'SHORT BREAK', 'long-break': 'LONG BREAK' };
          this.stateLabel.setText(labels[mode.id] || 'FOCUS');
        }
        this.modeTabs.querySelectorAll('.pomodoro-mode-tab').forEach(t => t.removeClass('active'));
        tab.addClass('active');
        if (this.ringCircle) {
          const pct = (minutes / 90) * 100;
          this.ringCircle.setAttribute('stroke-dashoffset', String(this.ringCircumference * (1 - pct / 100)));
        }
        // Update state color
        ['idle', 'work', 'short-break', 'long-break'].forEach(s => this.container.removeClass(`pomodoro-state-${s}`));
        this.container.addClass(mode.id === 'work' ? 'pomodoro-state-idle' : `pomodoro-state-${mode.id}`);
      });
    }
  }

  private renderPresets(): void {
    if (!this.presetBtns) return;
    this.presetBtns.empty();
    for (const preset of PRESETS) {
      const btn = this.presetBtns.createDiv({ cls: `pomodoro-preset ${this.activePreset === preset.minutes ? 'active' : ''}`, text: preset.label });
      btn.addEventListener('click', () => {
        if (this.plugin.timer.getStatus().state !== 'idle') return;
        this.activePreset = preset.minutes;
        this.plugin.settings.workDuration = preset.minutes;
        this.plugin.saveSettings();
        this.timerDisplay.setText(formatTime(preset.minutes * 60));
        this.renderPresets();
        if (this.ringCircle) {
          const pct = (preset.minutes / 90) * 100;
          this.ringCircle.setAttribute('stroke-dashoffset', String(this.ringCircumference * (1 - pct / 100)));
        }
      });
    }
  }

  private getSensitivityPx(): number {
    const map: Record<number, number> = { 1: 40, 2: 30, 3: 20, 4: 15, 5: 10 };
    return map[this.plugin.settings.scrollSensitivity] || 20;
  }

  private adjustIdleTime(delta: number): void {
    const current = this.plugin.settings.workDuration;
    const next = Math.max(1, Math.min(90, current + delta));
    if (next !== current) {
      this.plugin.settings.workDuration = next;
      this.plugin.saveSettings();
      this.timerDisplay.setText(formatTime(next * 60));
      this.activePreset = next;
      this.renderPresets();
      if (this.ringCircle) {
        this.ringCircle.setAttribute('stroke-dashoffset', String(this.ringCircumference * (1 - (next / 90))));
      }
    }
  }

  private renderCycleDots(completedPomodoros: number): void {
    if (!this.cycleDots) return;
    this.cycleDots.empty();
    const interval = this.plugin.settings.longBreakInterval;
    const currentInCycle = completedPomodoros % interval;
    for (let i = 0; i < interval; i++) {
      const dot = this.cycleDots.createDiv({ cls: 'pomodoro-cycle-dot' });
      if (i < currentInCycle) dot.addClass('filled');
      else if (i === currentInCycle) dot.addClass('current');
    }
  }

  private renderSecondaryControls(state: string): void {
    if (!this.secondaryControls) return;
    this.secondaryControls.empty();
    if (state === 'idle') return;

    const createBtn = (text: string, cls: string, onClick: () => void) => {
      const btn = this.secondaryControls.createEl('button', { text, cls: `pomodoro-secondary-btn ${cls}` });
      btn.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    };

    const ext = this.plugin.settings.extendMinutes || 5;
    const hasTask = !!(this.plugin.timer.getStatus().activeTask);

    let effectiveState = state;
    if (state === 'paused') {
      const prev = this.plugin.timer.getPreviousState();
      effectiveState = (prev === 'short-break' || prev === 'long-break') ? prev : 'work';
    }

    if (effectiveState === 'work') {
      createBtn(`+${ext}m`, 'pomodoro-btn-extend', () => this.plugin.extendTimer(ext));
      createBtn('Done', 'pomodoro-btn-done', () => this.plugin.markTaskDone());
      createBtn('Skip to Break', 'pomodoro-btn-skip', () => this.plugin.skipTimer());
      createBtn('Reset', 'pomodoro-btn-reset', () => this.plugin.stopTimer());
    } else {
      createBtn('Done', 'pomodoro-btn-done', () => this.plugin.markTaskDone());
      createBtn('Skip Break', 'pomodoro-btn-skip', () => this.plugin.skipTimer());
      createBtn('Reset', 'pomodoro-btn-reset', () => this.plugin.stopTimer());
    }
  }

  removeLocalTask(name: string): void {
    const idx = this.plugin.localTasks.indexOf(name);
    if (idx !== -1) {
      this.plugin.localTasks.splice(idx, 1);
      this.renderLocalTasks();
    }
  }

  renderLocalTasks(): void {
    if (!this.taskList) return;
    this.taskList.empty();

    const isLocked = this.plugin.timer.isRunning();

    // Show local tasks first
    for (let i = 0; i < this.plugin.localTasks.length; i++) {
      const name = this.plugin.localTasks[i];
      const taskEl = this.taskList.createDiv({ cls: `pomodoro-task-item ${isLocked ? 'locked' : ''}` });
      taskEl.createSpan({ cls: 'pomodoro-task-text', text: name });

      // Remove button (hidden when locked)
      if (!isLocked) {
        const removeBtn = taskEl.createSpan({ cls: 'pomodoro-task-remove' });
        removeBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.plugin.localTasks.splice(i, 1);
          this.renderLocalTasks();
        });
      }

      // Click to activate (always has listener, but checks running state)
      taskEl.addEventListener('click', () => {
        if (this.plugin.timer.isRunning()) return; // locked while running
        const state = this.plugin.timer.getStatus().state;
        if (state !== 'idle' && state !== 'paused') return; // also block during waiting breaks
        this.plugin.setActiveTaskByName(name);
        if (this.taskDisplay) {
          this.taskDisplay.setText(name);
          this.taskDisplay.toggleClass('has-task', true);
        }
        this.taskList.querySelectorAll('.pomodoro-task-item').forEach(el => el.removeClass('active'));
        taskEl.addClass('active');
      });

      // Highlight if this is the active task
      const activeTask = this.plugin.timer.getStatus().activeTask;
      if (activeTask === name) taskEl.addClass('active');
    }

    if (this.plugin.localTasks.length === 0) {
      this.taskList.createDiv({ cls: 'pomodoro-no-tasks', text: 'No tasks yet' });
    }
  }

  async refreshTasks(): Promise<void> {
    // Render local tasks, then append vault tasks below if sync is enabled
    this.renderLocalTasks();

    if (!this.plugin.settings.taskSyncEnabled) return;

    let tasks;
    try { tasks = await this.plugin.taskSync.getTasks(); }
    catch (e) { return; }

    if (tasks.length === 0) return;

    // Add a separator if we have local tasks
    if (this.plugin.localTasks.length > 0 && tasks.length > 0) {
      this.taskList.createDiv({ cls: 'pomodoro-task-separator' });
    }

    for (const task of tasks.slice(0, 15)) {
      const taskEl = this.taskList.createDiv({ cls: 'pomodoro-task-item pomodoro-vault-task' });
      taskEl.createSpan({ cls: 'pomodoro-task-text', text: task.text });
      if (task.estimatedPomodoros) {
        taskEl.createSpan({ cls: 'pomodoro-task-pomo-count', text: `${task.completedPomodoros || 0}/${task.estimatedPomodoros}` });
      }
      taskEl.addEventListener('click', () => {
        this.plugin.setActiveTask(task);
        this.taskList.querySelectorAll('.pomodoro-task-item').forEach(el => el.removeClass('active'));
        taskEl.addClass('active');
      });
    }
  }
}
