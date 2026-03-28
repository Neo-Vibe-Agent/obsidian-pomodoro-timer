# Final Bug Audit: Pomodoro Plugin v1.0.0

Audited: 2026-03-26
Files reviewed: 13 source files, line by line
Perspectives: Ras Mic (schema/architecture), Matthew Miller (reliability), Nate Herk (production hardening), Nick Saraev (simplest-thing-that-works)

---

## P0: Would crash or break core functionality

### 1. saveSettings() overwrites _timerState persistence data
**File**: `src/main.ts`, line 304-305
**What**: `saveSettings()` calls `this.saveData(this.settings)`, which replaces the entire plugin data store. But `saveTimerState()` (line 252) stores `_timerState` inside that same data object via `loadData()`. When settings are saved, any persisted `_timerState` is wiped out. If you change a setting mid-session and then close Obsidian, the timer state is lost and cannot be restored on relaunch.
**Fix**: `saveSettings()` should merge settings into existing data: `const data = await this.loadData() || {}; Object.assign(data, this.settings); await this.saveData(data);`. Alternatively, `loadSettings()` already does `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())`, so `_timerState` bleeds into `this.settings` as a stale property but gets re-saved correctly only if nothing else calls `saveData(this.settings)` in between. The core issue is that `saveData(this.settings)` does not preserve `_timerState`.

### 2. Scroll wheel handlers conflict: two 'wheel' listeners on ringWrapper
**File**: `src/view.ts`, lines 184-191 and 251-258
**What**: Two `wheel` event listeners are registered on `this.ringWrapper`. Both check for `e.ctrlKey`. The first one (scroll-to-adjust-time) requires `e.metaKey || e.ctrlKey` and runs only when idle. The second one (pinch-to-zoom) requires `e.ctrlKey` and calls `e.stopPropagation()`. On macOS, pinch-to-zoom on a trackpad sends `ctrlKey + wheel`, which means BOTH handlers fire (since stopPropagation prevents bubbling to parents, not to other listeners on the same element). When idle, a pinch gesture would simultaneously adjust the timer duration AND zoom the ring.
**Fix**: The pinch handler should set a flag or the scroll handler should check that `e.ctrlKey` alone (without metaKey) is not a pinch. Or combine both into a single handler. Most reliable: in the scroll-to-adjust handler, return early if `e.ctrlKey` (since that is the pinch gesture), and only honor `e.metaKey` for scroll-to-adjust.

### 3. restoreTimerState does not actually restore the timer
**File**: `src/main.ts`, lines 258-281
**What**: `restoreTimerState()` reads the saved state, calculates adjusted remaining time, and shows a Notice saying "click the timer to resume." But it never actually calls `this.timer.restore()` or sets any timer state. The timer remains idle. The Notice tells the user to "click the timer" but clicking would start a fresh timer, not resume the saved one. The entire persistence feature is non-functional.
**Fix**: After calculating adjustedRemaining, call something like `this.timer.restoreState(saved, adjustedRemaining)` and add a corresponding method to PomodoroTimer that sets the internal status to the saved state (paused, with the adjusted time).

### 4. Google Calendar API URL uses calendarId as the API key
**File**: `src/calendar-sync.ts`, line 41
**What**: The URL ends with `&key=${this.settings.googleCalendarId}`. The `key` parameter should be a Google API key, but this passes the calendar ID (which is typically an email address). The request will always fail with a 403. Calendar sync is completely broken.
**Fix**: Either add a separate `googleApiKey` setting, or document that the feature requires a valid API key and wire it up properly.

---

## P1: Noticeable bug users would report

### 5. showInStatusBar setting is not wired up
**File**: `src/types.ts`, line 37; `src/settings.ts`, line 287-294; `src/main.ts`, line 47
**What**: The `showInStatusBar` setting exists in types, has a toggle in settings, but `main.ts` always creates the status bar item unconditionally (line 47). Toggling the setting off does nothing. The status bar is always visible.
**Fix**: Check `this.settings.showInStatusBar` before creating the status bar item, and show/hide it when the setting changes.

### 6. showUpcomingEvents setting is not wired up
**File**: `src/types.ts`, line 27
**What**: `showUpcomingEvents: boolean` exists in the settings interface and defaults to `true`, but nothing in the codebase reads it. Calendar display is controlled only by `calendarSyncEnabled`.
**Fix**: Either remove the setting or wire it into the calendar section visibility logic.

### 7. customCss setting is not wired up
**File**: `src/types.ts`, line 35
**What**: `customCss: string` exists in the settings interface, defaults to `''`, but no settings UI exposes it and no code applies it.
**Fix**: Either remove it or add a textarea in settings and inject the CSS into the view container.

### 8. notifyOnComplete and notifySound settings have no UI
**File**: `src/types.ts`, lines 48-49; `src/main.ts`, lines 231-233 and 224
**What**: `notifyOnComplete` is used in `handleComplete` (line 231) and `notifySound` is used for the system notification `silent` property (line 224), but neither has a toggle in the settings tab. Only `notifySystem` has a settings toggle. Users cannot configure these.
**Fix**: Add setting toggles for `notifyOnComplete` and `notifySound`, or collapse them into `notifySystem`.

### 9. logFile setting has no UI
**File**: `src/types.ts`, line 22; `src/task-sync.ts`, line 139
**What**: The `logFile` setting (defaults to `pomodoro-log.md`) is used in `logPomodoro()` but has no settings UI. Users cannot change where logs are written without editing data.json manually.
**Fix**: Add a text field in the settings UI for the log file path, shown conditionally when `logCompletedPomodoros` is true.

### 10. Preset click saves settings, triggers full view refresh loop
**File**: `src/view.ts`, lines 530-536
**What**: Clicking a preset calls `this.plugin.saveSettings()` which triggers `main.ts:saveSettings()` which iterates all view leaves and calls `view.refreshTasks()` (line 329). This triggers a vault-wide task scan on every preset click. For vaults with many files, this causes a noticeable lag when simply selecting 25m vs 50m.
**Fix**: Use a lighter settings save that does not trigger the full view refresh, or debounce the task refresh.

### 11. adjustIdleTime also saves settings on every pixel of drag
**File**: `src/view.ts`, lines 545-561
**What**: `adjustIdleTime()` calls `this.plugin.saveSettings()` on every minute increment during drag. Combined with issue #10, each minute adjustment triggers a task refresh and full settings cascade.
**Fix**: Debounce the save, or only save on drag end (mouseup/touchend).

### 12. handleComplete logs workDuration regardless of actual session type
**File**: `src/main.ts`, line 235
**What**: `await this.taskSync.logPomodoro(status.activeTask, this.settings.workDuration)` always logs `workDuration`, even when a short-break or long-break completes. The logged duration is wrong for break completions.
**Fix**: Pass `status.totalTime / 60` to get the actual duration of the completed phase.

### 13. CSS invert swap is circular and may not work
**File**: `styles.css`, lines 875-879
**What**: The invert mode tries to swap accent and break colors using CSS variables: `--pomo-accent: var(--pomo-break)` and `--pomo-break: var(--pomo-accent-orig)`. But `--pomo-accent-orig` is set to `var(--pomo-accent)` which is now `var(--pomo-break)` because of the first override. CSS custom properties resolve lazily, creating a circular reference. The swap may produce identical colors or unexpected results depending on the browser.
**Fix**: Use a class toggle that sets concrete color values, or use a different approach. One option: toggle a data attribute and define explicit swapped colors per theme.

### 14. pause() double-counts elapsed time if called twice
**File**: `src/timer.ts`, lines 75-84
**What**: `pause()` checks `state !== 'idle'` but not `state !== 'paused'`. If `pause()` is called when already paused (e.g., via command palette while UI already shows paused), it adds to `pausedElapsed` again using the stale `startedAt` from the previous resume. `previousState` also gets overwritten to 'paused', breaking resume logic.
**Fix**: Add `if (this.status.state === 'paused') return;` at the top of `pause()`.

### 15. extend() during idle modifies totalTime/timeRemaining but has no visible effect
**File**: `src/timer.ts`, lines 107-113
**What**: If `extend()` is called during idle state, it modifies `totalTime` and `timeRemaining` on the idle status, but the view does not respond because idle display is driven by `settings.workDuration`. The extended time would be used if start is called, but the display would snap back to the settings-based duration.
**Fix**: Either prevent extend during idle, or sync the extended values to the display.

### 16. Popout button visible on mobile but popoutTimer is desktop-only
**File**: `src/view.ts`, lines 72-78; `src/main.ts`, line 176
**What**: The popout button is rendered unconditionally in the view. On mobile, clicking it calls `this.plugin.popoutTimer()` which returns early due to `!Platform.isDesktop`. The button is present but does nothing.
**Fix**: Conditionally render the popout button based on `Platform.isDesktop`, or add `import { Platform } from 'obsidian'` to view.ts and hide the button.

### 17. formatTime produces fractional seconds display
**File**: `src/utils/format.ts`, line 3
**What**: `seconds % 60` does not round, and `timeRemaining` from the timer can have fractional values from the `Date.now()` division. This could display "24:59.7272..." in rare timing edge cases. The `padStart(2, '0')` on a decimal string would not pad correctly.
**Fix**: Add `Math.floor()` or `Math.round()` to the seconds calculation: `const secs = Math.floor(seconds % 60)`.

---

## P2: Minor polish issues

### 18. RING_SIZE and RING_STROKE constants are unused
**File**: `src/view.ts`, lines 8-9
**What**: These constants are defined but never referenced. Size is now CSS-driven.
**Fix**: Remove dead code.

### 19. hintText property declared but never assigned
**File**: `src/view.ts`, line 21
**What**: `private hintText: HTMLElement` is declared but never initialized or used anywhere.
**Fix**: Remove the unused property.

### 20. getStateEmoji returns empty strings
**File**: `src/utils/format.ts`, lines 31-39
**What**: Every case in `getStateEmoji()` returns an empty string. The function is defined but is a no-op. It is also never called anywhere in the codebase.
**Fix**: Remove dead code or populate if emojis are intended for a future feature.

### 21. formatTimeShort is unused
**File**: `src/utils/format.ts`, lines 7-14
**What**: `formatTimeShort()` is exported but never imported or called anywhere.
**Fix**: Remove or keep if planned for status bar compact mode.

### 22. PomodoroLogEntry interface is unused
**File**: `src/types.ts`, lines 116-123
**What**: The `PomodoroLogEntry` interface is defined but never referenced in any code.
**Fix**: Remove dead type.

### 23. settings.ts opens wrong settings tab ID
**File**: `src/view.ts`, line 115
**What**: `(this.app as any).setting?.openTabById?.('pomodoro')` uses the ID 'pomodoro', but the actual setting tab ID is typically the plugin ID from manifest.json, which is 'pomodoro-timer'. This means clicking the gear icon opens the settings panel but does not navigate to the Pomodoro tab.
**Fix**: Use `'pomodoro-timer'` to match the manifest ID.

### 24. cliStateFile writes JSON inside the vault
**File**: `src/cli-bridge.ts`, lines 41-52
**What**: The default `cliStateFile` is `.pomodoro-state.json`. This creates a JSON file visible in the vault file explorer. Users may be confused by a JSON file appearing in their notes.
**Fix**: Either document this behavior, use a path under `.obsidian/plugins/pomodoro-timer/`, or hide the file from the explorer.

### 25. Debounce in settings uses leading edge
**File**: `src/settings.ts`, line 13
**What**: `debounce(() => this.plugin.saveSettings(), 300, true)` with `true` means the debounce fires on the leading edge (immediately on first call). For slider drags, this means every slider change fires immediately, then waits 300ms. The debounce gives minimal benefit since most changes are individual toggles.
**Fix**: Consider trailing edge (`false` or omit the third param) for slider controls so the save only fires after the user stops dragging.

### 26. Multiple views can exist but completedPomodoros resets independently
**File**: `src/main.ts`, line 286-289
**What**: `updateView()` iterates all leaves and updates them, which is correct. However if the user pops out to a floating window and also has the sidebar view, both show the same data. This is actually fine, but if the popout is closed and reopened, the view initializes fresh showing "25:00" idle regardless of timer state.
**Fix**: In `onOpen()`, immediately call `this.plugin.timer.getStatus()` and render the current state, not just the defaults.

### 27. dataview task source is identical to obsidian-tasks source
**File**: `src/task-sync.ts`, lines 72-101 vs 32-69
**What**: The `getDataviewTasks()` method does essentially the same thing as `getObsidianTasks()` but without the optimization (checking hasUncompletedTasks before reading) and without parsing pomo metadata. The "DataView" option in settings implies it would use the DataView plugin API, but it does not. It is a slower duplicate.
**Fix**: Either actually integrate with the DataView API (`app.plugins.plugins['dataview']?.api`), or remove the option and document that task sync uses the metadata cache.

### 28. Container width query unit `cqi` may not be supported everywhere
**File**: `styles.css`, line 235
**What**: `font-size: clamp(1.6em, 8cqi, 3.5em)` uses `cqi` (container query inline). While modern browsers support this, Obsidian's Electron version may lag. If unsupported, the font falls back to the `clamp` minimum (1.6em), which is small.
**Fix**: Add a fallback: set the font-size with a non-cqi value first, then override with the cqi version. Or use `vw` based sizing.

### 29. color-mix() may not be supported on older Obsidian versions
**File**: `styles.css`, lines 68, 288, 637, 728, 858, 884
**What**: `color-mix(in srgb, ...)` is used in multiple places. Obsidian's minimum version in manifest is 1.5.0 which shipped with an older Electron. If the Chromium version does not support `color-mix`, these styles silently fail, producing no background/color.
**Fix**: Provide fallback values before the `color-mix` declarations.

### 30. Rapid start/stop does not clear activeTask
**File**: `src/main.ts`, lines 107-111
**What**: `stopTimer()` resets the timer and saves idle state, but does not clear `this.activeTask`. If the user stops and starts again, the previous task is still associated. `startTimer()` only sets the task if a mode parameter triggers it through `this.activeTask?.text`.
**Fix**: Either clear `this.activeTask` in `stopTimer()`, or document that the task persists across sessions intentionally.

---

## Summary

| Priority | Count | Key Themes |
|----------|-------|------------|
| P0 | 4 | Data persistence wipe, scroll conflict, dead restore, broken calendar API |
| P1 | 13 | Unwired settings, performance on drag, display bugs, state edge cases |
| P2 | 13 | Dead code, minor CSS compat, polish |

### Critical path for submission
Fix P0 items 1-3 before shipping. Item 4 (calendar) can ship broken if documented as "coming soon" since it requires an API key nobody has configured yet. All P1 items should be addressed before community plugin review.
