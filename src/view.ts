import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TimerStatus, TaskItem, TimerState } from './types';
import { formatTime, getProgressPercentage, getStateLabel } from './utils/format';
import type PomodoroPlugin from './main';

export const POMODORO_VIEW_TYPE = 'pomodoro-view';

const RING_SIZE = { small: 140, medium: 200, large: 260 };
const RING_STROKE = { small: 5, medium: 7, large: 9 };
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
  private hintText: HTMLElement;
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
  private calendarSection: HTMLElement;
  private calendarContent: HTMLElement;
  private popoutBtn: HTMLElement;
  private lastRenderedState: string = '';
  private activePreset: number;
  private selectedMode: 'work' | 'short-break' | 'long-break' = 'work';
  // Global event handler refs for cleanup
  private _onMouseMove: ((e: MouseEvent) => void) | null = null;
  private _onMouseUp: (() => void) | null = null;
  private _onTouchMove: ((e: TouchEvent) => void) | null = null;
  private _onTouchEnd: (() => void) | null = null;
  private zoomScale: number = 1;

  constructor(leaf: WorkspaceLeaf, plugin: PomodoroPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.activePreset = plugin.settings.workDuration;
  }

  getViewType(): string { return POMODORO_VIEW_TYPE; }
  getDisplayText(): string { return 'Pomodoro'; }
  getIcon(): string { return 'timer'; }

  async onOpen(): Promise<void> {
    this.container = this.containerEl.children[1];
    this.container.empty();
    this.container.addClass('pomodoro-container');
    this.container.addClass(`pomodoro-theme-${this.plugin.settings.theme}`);
    this.container.addClass(`pomodoro-size-${this.plugin.settings.timerSize}`);
    this.container.addClass('pomodoro-state-idle');

    const c = this.container as HTMLElement;

    // ===== HEADER BAR =====
    const header = c.createDiv({ cls: 'pomodoro-header' });
    header.createSpan({ cls: 'pomodoro-header-title', text: 'Pomodoro' });
    const headerActions = header.createDiv({ cls: 'pomodoro-header-actions' });

    // Popout button
    this.popoutBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn pomodoro-popout-btn',
      attr: { 'aria-label': 'Pop out', title: 'Pop out to floating window' }
    });
    this.popoutBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
    this.popoutBtn.addEventListener('click', () => this.plugin.popoutTimer());

    // Eye/hide button (minimizes to status bar)
    const hideBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn pomodoro-hide-btn',
      attr: { 'aria-label': 'Hide', title: 'Hide to status bar (click status bar to show)' }
    });
    hideBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    hideBtn.addEventListener('click', () => this.plugin.hideView());

    // Close button
    const closeBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn pomodoro-close-btn',
      attr: { 'aria-label': 'Close', title: 'Close Pomodoro' }
    });
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.addEventListener('click', () => this.leaf.detach());

    // Settings gear
    const settingsBtn = headerActions.createEl('button', {
      cls: 'pomodoro-header-btn',
      attr: { 'aria-label': 'Settings', title: 'Open Pomodoro settings' }
    });
    settingsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
    settingsBtn.addEventListener('click', () => {
      // Open plugin settings tab
      (this.app as any).setting?.open?.();
      (this.app as any).setting?.openTabById?.('pomodoro');
    });

    // ===== MODE TABS =====
    this.modeTabs = c.createDiv({ cls: 'pomodoro-mode-tabs' });
    this.renderModeTabs('work');

    // ===== TIMER ZONE =====
    const timerSection = c.createDiv({ cls: 'pomodoro-timer-section' });

    // Ring - uses viewBox so it scales with CSS width/height
    const viewSize = 200; // internal SVG coordinate space (fixed)
    const stroke = 7;
    const radius = (viewSize - stroke * 2) / 2;
    this.ringCircumference = 2 * Math.PI * radius;

    this.ringWrapper = timerSection.createDiv({ cls: 'pomodoro-ring-wrapper' });
    // Size is now controlled by CSS (responsive), not fixed pixels

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

    // Content inside ring
    const ringContent = this.ringWrapper.createDiv({ cls: 'pomodoro-ring-content' });
    this.timerDisplay = ringContent.createDiv({
      cls: 'pomodoro-timer-display',
      text: formatTime(this.plugin.settings.workDuration * 60)
    });
    this.stateLabel = ringContent.createDiv({ cls: 'pomodoro-ring-state', text: 'FOCUS' });

    // --- Interaction handlers (stored for cleanup in onClose) ---
    let clickBlocked = false;
    let isDragging = false;
    let dragStartY = 0;
    let dragAccumulator = 0;

    // Click ring to start/pause (only if not dragging)
    this.ringWrapper.addEventListener('mousedown', () => { clickBlocked = false; });
    this.ringWrapper.addEventListener('mousemove', () => { clickBlocked = true; });
    this.ringWrapper.addEventListener('click', () => {
      if (clickBlocked) return;
      const state = this.plugin.timer.getStatus().state;
      if (state === 'idle') this.plugin.startTimer(this.selectedMode);
      else if (state === 'paused') this.plugin.resumeTimer();
      else this.plugin.pauseTimer();
    });

    // Scroll to adjust time when idle (requires Cmd/Ctrl held for trackpad safety)
    this.ringWrapper.addEventListener('wheel', (e: WheelEvent) => {
      const state = this.plugin.timer.getStatus().state;
      if (state !== 'idle') return;
      if (!e.metaKey && !e.ctrlKey) return; // require modifier key
      e.preventDefault();
      const delta = e.deltaY > 0 ? -1 : 1;
      this.adjustIdleTime(delta);
    }, { passive: false });

    // Drag to adjust time when idle
    this.ringWrapper.addEventListener('mousedown', (e: MouseEvent) => {
      const state = this.plugin.timer.getStatus().state;
      if (state !== 'idle') return;
      isDragging = true;
      dragStartY = e.clientY;
      dragAccumulator = 0;
      this.ringWrapper.addClass('dragging');
      e.preventDefault();
    });

    // Store global handlers so we can remove them in onClose
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
    this._onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY - e.touches[0].clientY;
      dragAccumulator += deltaY;
      dragStartY = e.touches[0].clientY;
      const px = this.getSensitivityPx();
      const minutesDelta = Math.trunc(dragAccumulator / px);
      if (minutesDelta !== 0) {
        dragAccumulator -= minutesDelta * px;
        this.adjustIdleTime(minutesDelta);
      }
    };
    this._onTouchEnd = () => {
      if (isDragging) { isDragging = false; this.ringWrapper.removeClass('dragging'); }
    };

    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);

    this.ringWrapper.addEventListener('touchstart', (e: TouchEvent) => {
      const state = this.plugin.timer.getStatus().state;
      if (state !== 'idle') return;
      isDragging = true;
      dragStartY = e.touches[0].clientY;
      dragAccumulator = 0;
      this.ringWrapper.addClass('dragging');
    }, { passive: true });
    document.addEventListener('touchmove', this._onTouchMove, { passive: true });
    document.addEventListener('touchend', this._onTouchEnd);

    // Pinch-to-zoom on timer section (like graph view)
    let lastPinchDist = 0;
    timerSection.addEventListener('wheel', (e: WheelEvent) => {
      if (!e.ctrlKey) return; // pinch on trackpad sends ctrl+wheel
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.03 : 0.03;
      this.zoomScale = Math.max(0.5, Math.min(2.0, this.zoomScale + delta));
      timerSection.style.transform = `scale(${this.zoomScale})`;
      timerSection.style.transformOrigin = 'center top';
    }, { passive: false });

    // Double-click to reset zoom
    timerSection.addEventListener('dblclick', () => {
      this.zoomScale = 1;
      timerSection.style.transform = 'scale(1)';
    });

    // Set initial ring preview for idle state
    if (this.ringCircle) {
      const initPct = (this.plugin.settings.workDuration / 90) * 100;
      const initOffset = this.ringCircumference * (1 - initPct / 100);
      this.ringCircle.setAttribute('stroke-dashoffset', String(initOffset));
    }

    // ===== DURATION PRESETS =====
    this.presetBtns = timerSection.createDiv({ cls: 'pomodoro-presets' });
    this.renderPresets();

    // ===== PRIMARY ACTION BUTTON =====
    this.primaryBtn = timerSection.createEl('button', { cls: 'pomodoro-primary-btn', text: 'Start' });
    this.primaryBtn.addEventListener('click', () => {
      const state = this.plugin.timer.getStatus().state;
      if (state === 'idle') this.plugin.startTimer();
      else if (state === 'paused') this.plugin.resumeTimer();
      else this.plugin.pauseTimer();
    });

    // ===== SECONDARY CONTROLS =====
    this.secondaryControls = timerSection.createDiv({ cls: 'pomodoro-secondary-controls' });
    this.renderSecondaryControls('idle');

    // ===== CYCLE DOTS + STATS =====
    this.cycleDots = c.createDiv({ cls: 'pomodoro-cycle-dots' });
    this.renderCycleDots(0);
    this.pomodoroCount = c.createDiv({ cls: 'pomodoro-count', text: '0m | 0 sessions | 0 done' });

    // ===== TASK DISPLAY =====
    this.taskDisplay = c.createDiv({ cls: 'pomodoro-active-task' });

    // ===== TASK LIST (collapsible) =====
    this.taskSection = c.createDiv({ cls: 'pomodoro-task-section' });
    const taskHeader = this.taskSection.createDiv({ cls: 'pomodoro-section-header' });
    taskHeader.createEl('h4', { text: 'Tasks', cls: 'pomodoro-section-title' });
    const taskChevron = taskHeader.createSpan({ cls: 'pomodoro-chevron' });
    taskChevron.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    // Quick task input
    const taskInputWrapper = this.taskSection.createDiv({ cls: 'pomodoro-task-input-wrapper' });
    const taskInput = taskInputWrapper.createEl('input', {
      cls: 'pomodoro-task-input',
      attr: { type: 'text', placeholder: 'Add a task...' }
    });
    taskInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && taskInput.value.trim()) {
        const name = taskInput.value.trim();
        this.plugin.setActiveTaskByName(name);
        taskInput.value = '';
        // Show as active task display
        if (this.taskDisplay) {
          this.taskDisplay.setText(name);
          this.taskDisplay.toggleClass('has-task', true);
        }
      }
    });
    // Click the + icon to submit
    const taskAddBtn = taskInputWrapper.createEl('button', {
      cls: 'pomodoro-task-add-btn',
      attr: { 'aria-label': 'Add task' }
    });
    taskAddBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    taskAddBtn.addEventListener('click', () => {
      if (taskInput.value.trim()) {
        const name = taskInput.value.trim();
        this.plugin.setActiveTaskByName(name);
        taskInput.value = '';
        if (this.taskDisplay) {
          this.taskDisplay.setText(name);
          this.taskDisplay.toggleClass('has-task', true);
        }
      }
    });

    this.taskList = this.taskSection.createDiv({ cls: 'pomodoro-task-list' });
    // Start collapsed
    this.taskSection.addClass('collapsed');
    taskHeader.addEventListener('click', () => {
      this.taskSection.toggleClass('collapsed', !this.taskSection.hasClass('collapsed'));
    });

    // ===== CALENDAR (collapsible) =====
    this.calendarSection = c.createDiv({ cls: 'pomodoro-calendar-section pomodoro-collapsible collapsed' });
    const calHeader = this.calendarSection.createDiv({ cls: 'pomodoro-section-header' });
    calHeader.createEl('h4', { text: 'Upcoming', cls: 'pomodoro-section-title' });
    const calChevron = calHeader.createSpan({ cls: 'pomodoro-chevron' });
    calChevron.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    calHeader.addEventListener('click', () => {
      this.calendarSection.toggleClass('collapsed', !this.calendarSection.hasClass('collapsed'));
    });
    this.calendarContent = this.calendarSection.createDiv({ cls: 'pomodoro-calendar-content' });

    await this.refreshTasks();
    await this.refreshCalendar();
  }

  async onClose(): Promise<void> {
    // Clean up global event listeners to prevent memory leaks
    if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove);
    if (this._onMouseUp) document.removeEventListener('mouseup', this._onMouseUp);
    if (this._onTouchMove) document.removeEventListener('touchmove', this._onTouchMove as any);
    if (this._onTouchEnd) document.removeEventListener('touchend', this._onTouchEnd);
    this._onMouseMove = null;
    this._onMouseUp = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
  }

  updateTimer(status: TimerStatus): void {
    if (this.timerDisplay) {
      this.timerDisplay.setText(formatTime(status.timeRemaining));
    }

    if (this.stateLabel) {
      const labels: Record<string, string> = {
        'idle': 'FOCUS',
        'work': 'FOCUS',
        'short-break': 'SHORT BREAK',
        'long-break': 'LONG BREAK',
        'paused': 'PAUSED',
      };
      this.stateLabel.setText(labels[status.state] || 'FOCUS');
    }

    // Ring progress
    if (this.ringCircle) {
      const pct = getProgressPercentage(status.timeRemaining, status.totalTime);
      const offset = this.ringCircumference * (1 - pct / 100);
      this.ringCircle.setAttribute('stroke-dashoffset', String(offset));

    }

    // Primary button text
    if (this.primaryBtn) {
      const btnText: Record<string, string> = {
        'idle': 'Start',
        'work': 'Pause',
        'short-break': 'Pause',
        'long-break': 'Pause',
        'paused': 'Resume',
      };
      this.primaryBtn.setText(btnText[status.state] || 'Start');
      this.primaryBtn.className = `pomodoro-primary-btn pomodoro-primary-${status.state}`;
    }

    // State class on container
    if (this.container && status.state !== this.lastRenderedState) {
      this.container.removeClass('pomodoro-state-idle');
      this.container.removeClass('pomodoro-state-work');
      this.container.removeClass('pomodoro-state-short-break');
      this.container.removeClass('pomodoro-state-long-break');
      this.container.removeClass('pomodoro-state-paused');
      this.container.addClass(`pomodoro-state-${status.state}`);

      // Phase transition animation
      if (this.lastRenderedState && this.lastRenderedState !== status.state) {
        this.container.addClass('pomodoro-phase-transition');
        setTimeout(() => this.container.removeClass('pomodoro-phase-transition'), 600);
      }

      // Update mode tabs highlight
      this.renderModeTabs(status.state === 'short-break' || status.state === 'long-break' ? status.state : 'work');

      // Show/hide presets based on state
      if (this.presetBtns) {
        this.presetBtns.toggleClass('hidden', status.state !== 'idle');
      }
    }

    // Cycle dots
    if (this.cycleDots) this.renderCycleDots(status.completedPomodoros);

    // Stats
    if (this.pomodoroCount) {
      const totalMin = status.completedPomodoros * this.plugin.settings.workDuration;
      this.pomodoroCount.setText(`${totalMin}m | ${status.completedPomodoros} sessions | ${status.completedPomodoros} done`);
    }

    // Active task
    if (this.taskDisplay) {
      this.taskDisplay.setText(status.activeTask || '');
      this.taskDisplay.toggleClass('has-task', !!status.activeTask);
    }

    // Secondary controls only on state change
    if (status.state !== this.lastRenderedState) {
      this.renderSecondaryControls(status.state);
      this.lastRenderedState = status.state;
    }
  }

  private renderModeTabs(activeMode: string): void {
    if (!this.modeTabs) return;
    this.modeTabs.empty();

    const modes = [
      { id: 'work', label: 'Pomodoro' },
      { id: 'short-break', label: 'Short Break' },
      { id: 'long-break', label: 'Long Break' },
    ];

    for (const mode of modes) {
      const tab = this.modeTabs.createDiv({
        cls: `pomodoro-mode-tab ${mode.id === activeMode ? 'active' : ''}`,
        text: mode.label
      });
      tab.dataset.mode = mode.id;
      tab.addEventListener('click', () => {
        const state = this.plugin.timer.getStatus().state;
        if (state !== 'idle') return;

        // Track selected mode so Start uses it
        this.selectedMode = mode.id as 'work' | 'short-break' | 'long-break';

        let minutes = this.plugin.settings.workDuration;
        if (mode.id === 'short-break') minutes = this.plugin.settings.shortBreakDuration;
        if (mode.id === 'long-break') minutes = this.plugin.settings.longBreakDuration;

        this.timerDisplay.setText(formatTime(minutes * 60));

        // Update state label
        const labels: Record<string, string> = {
          'work': 'FOCUS',
          'short-break': 'SHORT BREAK',
          'long-break': 'LONG BREAK',
        };
        if (this.stateLabel) this.stateLabel.setText(labels[mode.id] || 'FOCUS');

        // Update active tab
        this.modeTabs.querySelectorAll('.pomodoro-mode-tab').forEach(t => t.removeClass('active'));
        tab.addClass('active');

        // Update ring color
        if (this.container) {
          this.container.removeClass('pomodoro-state-idle');
          this.container.removeClass('pomodoro-state-work');
          this.container.removeClass('pomodoro-state-short-break');
          this.container.removeClass('pomodoro-state-long-break');
          if (mode.id === 'work') {
            this.container.addClass('pomodoro-state-idle');
          } else {
            this.container.addClass(`pomodoro-state-${mode.id}`);
          }
        }
      });
    }
  }

  private renderPresets(): void {
    if (!this.presetBtns) return;
    this.presetBtns.empty();

    for (const preset of PRESETS) {
      const btn = this.presetBtns.createDiv({
        cls: `pomodoro-preset ${this.activePreset === preset.minutes ? 'active' : ''}`,
        text: preset.label
      });
      btn.addEventListener('click', () => {
        const state = this.plugin.timer.getStatus().state;
        if (state !== 'idle') return;

        this.activePreset = preset.minutes;
        this.plugin.settings.workDuration = preset.minutes;
        this.plugin.saveSettings();
        this.timerDisplay.setText(formatTime(preset.minutes * 60));
        this.renderPresets();
      });
    }
  }

  private getSensitivityPx(): number {
    // sensitivity 1=40px, 2=30px, 3=20px, 4=15px, 5=10px per minute
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

      // Update ring to show duration proportionally (90min = full ring)
      if (this.ringCircle) {
        const pct = (next / 90) * 100;
        const offset = this.ringCircumference * (1 - pct / 100);
        this.ringCircle.setAttribute('stroke-dashoffset', String(offset));
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

    if (state === 'work') {
      createBtn('+5m', 'pomodoro-btn-extend', () => this.plugin.extendTimer(5));
      createBtn('Done', 'pomodoro-btn-done', () => this.plugin.markTaskDone());
      createBtn('Skip', 'pomodoro-btn-skip', () => this.plugin.skipTimer());
      createBtn('Reset', 'pomodoro-btn-reset', () => this.plugin.stopTimer());
    } else if (state === 'short-break' || state === 'long-break') {
      createBtn('Skip', 'pomodoro-btn-skip', () => this.plugin.skipTimer());
      createBtn('Reset', 'pomodoro-btn-reset', () => this.plugin.stopTimer());
    } else if (state === 'paused') {
      createBtn('+5m', 'pomodoro-btn-extend', () => this.plugin.extendTimer(5));
      createBtn('Reset', 'pomodoro-btn-reset', () => this.plugin.stopTimer());
    }
  }

  async refreshTasks(): Promise<void> {
    if (!this.taskList) return;
    this.taskList.empty();

    let tasks;
    try {
      tasks = await this.plugin.taskSync.getTasks();
    } catch (e) {
      this.taskList.createDiv({ cls: 'pomodoro-no-tasks', text: 'Could not load tasks' });
      return;
    }

    if (tasks.length === 0) {
      this.taskList.createDiv({ cls: 'pomodoro-no-tasks', text: 'No tasks found' });
      return;
    }

    for (const task of tasks.slice(0, 25)) {
      const taskEl = this.taskList.createDiv({ cls: 'pomodoro-task-item' });
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

  async refreshCalendar(): Promise<void> {
    if (!this.calendarContent) return;
    this.calendarContent.empty(); // Only empty content, not header/chevron

    if (!this.plugin.settings.calendarSyncEnabled) return;

    try {
      const events = await this.plugin.calendarSync.getUpcomingEvents();
      const availablePomos = this.plugin.calendarSync.getAvailablePomodoros(this.plugin.settings.workDuration);

      if (availablePomos !== Infinity) {
        this.calendarContent.createDiv({ cls: 'pomodoro-calendar-hint', text: `${availablePomos} pomodoro${availablePomos !== 1 ? 's' : ''} before next event` });
      }
      if (events.length === 0) {
        this.calendarContent.createDiv({ cls: 'pomodoro-no-events', text: 'No upcoming events' });
        return;
      }
      for (const event of events.slice(0, 5)) {
        const eventEl = this.calendarContent.createDiv({ cls: 'pomodoro-calendar-event' });
        const time = event.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        eventEl.createSpan({ cls: 'pomodoro-event-time', text: time });
        eventEl.createSpan({ cls: 'pomodoro-event-title', text: event.title });
      }
    } catch (e) {
      this.calendarContent.createDiv({ cls: 'pomodoro-no-events', text: 'Calendar unavailable' });
    }
  }
}
