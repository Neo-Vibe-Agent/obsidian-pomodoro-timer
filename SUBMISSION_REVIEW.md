# Pomodoro Plugin: AI Council Final Edge Case Review

Date: 2026-03-26
Reviewers: Jordan Crawford (GTM lens), Nick Saraev (production lens), Greg Isenberg (product/community lens), Nate Herk (reliability lens)

---

## 1. What Breaks? Edge Case Audit

### Timer at 0 / Negative Values
- **formatTime with negative seconds**: `formatTime(-5)` produces `"-1:55"` because `Math.floor(-5/60) = -1` and `-5 % 60 = -5`. The timer clamps to 0 via `Math.max(0, ...)` in the interval, so this probably never fires in practice, but the format function itself is unguarded.
- **getProgressPercentage with totalTime=0**: Returns 0 (guarded). Good.
- **extend() when idle**: Adds time to `totalTime` and `timeRemaining` even in idle state. If you hit +5m while idle, the internal status diverges from what the view shows (view reads `settings.workDuration`, not `status.timeRemaining` when idle). Low severity but confusing if someone triggers the command from the palette.

### Very Long Sessions (90min)
- Timestamp-based timing means no drift. Good.
- The 30-minute restore window (`restoreTimerState`) means if you close Obsidian during a 90-min session and reopen 31 minutes later, the timer is silently discarded. Should probably be `max(totalTime, 30*60)` instead of hardcoded 30 minutes.

### Rapid Clicking Start/Pause
- `start()` calls `startInterval()` which calls `stopInterval()` first. Safe against double-interval.
- `pause()` records `pausedElapsed` by adding `Math.floor((Date.now() - startedAt) / 1000)`. Rapid pause/resume cycles accumulate rounding errors (floor loses fractional seconds each cycle). Over many cycles this could shave seconds off. Minor.

### Closing Panel Mid-Timer
- Timer runs on the plugin, not the view. Closing the panel does NOT stop the timer. Good.
- `onClose()` cleans up document-level listeners. Good.
- Sound still plays on completion even if panel is closed. Good.

### Switching Themes Mid-Timer
- Theme class is set once in `onOpen()`. Changing the theme in settings does NOT update the active view's theme class. **The view shows the old theme until you close and reopen it.** This is a bug users will notice.

### Multiple Views Open
- `updateView()` iterates all leaves of the type. Good.
- `popoutTimer()` detaches ALL existing instances first, then opens one popout. Good.
- `activateView()` reuses the first existing instance. Good.
- But: each view registers its own document-level mousemove/mouseup listeners. If someone manually opens two views (split pane), two sets of drag handlers are active. Low severity (the timer section is local), but the document-level handlers will fire for both. Cosmetic at worst.

### Mobile/iPad Behavior
- `manifest.json` has `isDesktopOnly: false`. Good.
- `new Notification()` (Web Notification API) may not work on mobile Obsidian. Should guard with `if (typeof Notification !== 'undefined')`.
- Touch handlers exist for drag. Good.
- `touchstart` is passive:true but never calls `e.preventDefault()`, so the page may scroll while dragging on mobile. Could be annoying.
- Status bar exists on mobile. Good.
- Popout windows don't exist on mobile. The popout command will likely throw or silently fail. Should be guarded or hidden on mobile.

### Very Small Sidebar Width
- Ring uses `clamp(120px, 60%, 220px)` with container queries (`cqi`). Should handle narrow widths gracefully.
- Mode tabs with three items ("Pomodoro", "Short Break", "Long Break") at very narrow widths could overflow. No `flex-wrap` or overflow handling. Could clip or cause horizontal scroll.

### Very Large Popout Window
- Popout opens at 340x540. Content is centered. At large sizes, it just has more whitespace. No issue.

### Settings Clobbering Timer State
- `saveSettings()` calls `saveData(this.settings)`. `saveTimerState()` calls `loadData()`, adds `_timerState`, then `saveData(data)`. But `loadSettings()` does `Object.assign({}, DEFAULT_SETTINGS, await this.loadData())`, which means `_timerState` bleeds into `this.settings` as an extra property. When `saveSettings()` fires, it overwrites data with `this.settings` (which includes `_timerState`). This actually works by accident, but it's fragile. If `_timerState` ever collides with a setting name, it breaks.

---

## 2. What Would a Plugin Reviewer Flag?

### Manifest Issues
- **Plugin ID "pomodoro"**: Too generic. The Obsidian plugin list has naming conventions. Other plugins already use "pomodoro" in their IDs. The reviewer will likely ask for a more specific ID like `neo-vibe-pomodoro` or `pomodoro-timer-neo`.
- **minAppVersion "1.5.0"**: Very old. Current Obsidian is 1.7+. This is fine (no breaking APIs used from newer versions), but reviewers may ask if it's been tested on 1.5.

### Code Quality Flags
- `(this.app as any).setting?.open?.()` in view.ts line 96-97: Type assertion to `any`. Reviewers flag this. It works but is a code smell. The official approach is `this.app.setting.open()` but the types aren't exported. Common pattern but worth a comment.
- Calendar sync uses Google Calendar API with the Calendar ID as both the calendar identifier AND the API key (line 41 of calendar-sync.ts). This is broken. The `key=` parameter should be a Google API key, not the calendar ID. This feature does not work as shipped.
- CLI bridge polls every 500ms with a 200ms debounce. On low-end machines this could be noticeable. Reviewer may flag the polling interval.

### Missing Build Artifacts
- No `main.js` or `styles.css` in the root (build output). Need to verify the build actually produces these. The submission requires `main.js`, `manifest.json`, and `styles.css` in a GitHub release.

### README Discrepancies
- README says "4 built-in themes: Default, Minimal, Neon, Forest" but there are 10 themes. README is stale.
- README lists "Pop out Pomodoro to floating window" command but it's not in the commands table.
- No screenshots. This is not a blocker for review but is a huge miss for downloads.

### License
- README says MIT but no LICENSE file exists in the repo.

---

## 3. What Makes a User Uninstall in 5 Minutes?

1. **Calendar sync is broken out of the box.** If someone enables it and enters their calendar ID, it silently fails. The API URL is malformed (uses calendarId as API key). Since the feature is off by default, most users won't hit this immediately, but anyone who does will lose trust.

2. **Theme change doesn't apply until view is reopened.** User picks "Neon" in settings, goes back to the timer, sees the old theme. Thinks it's broken.

3. **No visual hint for scroll/drag to adjust time.** The drag-to-set and Cmd+scroll features are invisible. No tooltip, no visual affordance. Users will never discover these without reading docs (they won't).

4. **Task sync enabled by default but requires tasks in vault.** Default `taskSyncEnabled: true` with `taskSource: 'obsidian-tasks'` means on first open, the plugin scans all markdown files looking for unchecked tasks. For a large vault this could be slow. And the "Tasks" section shows "No tasks found" which feels broken.

5. **The default theme has a dark background (`#1a1a2e`) that may clash with light-mode Obsidian.** The `--pomo-bg` falls back to `var(--background-primary)` but only if the CSS variable isn't set. The default theme's dark blue will look jarring in a light vault.

---

## 4. Top 5 Things to Fix Before Submission (Prioritized)

### P0: Fix or disable calendar sync
The Google Calendar API URL is malformed. Either fix it with a proper API key flow, or disable `calendarSyncEnabled` default and add a note that this is experimental. A broken feature is worse than a missing feature.
- File: `src/calendar-sync.ts` line 41
- Fix: Either require a separate Google API key setting, or remove the calendar section for v1 and add it in v1.1.

### P1: Apply theme changes to active view without reopening
When `saveSettings()` fires, update the theme class on all active views.
- File: `src/main.ts` in `saveSettings()`, and `src/view.ts` add a `updateTheme()` method
- Fix: In `saveSettings()`, call a method on all active views to swap the theme class.

### P2: Fix the manifest plugin ID
Change `"id": "pomodoro"` to something unique like `"id": "pomodoro-timer"` or `"id": "neo-vibe-pomodoro"`. Check the existing community plugin list to avoid collisions.
- File: `manifest.json`

### P3: Guard mobile edge cases
- Wrap `new Notification()` in a try/catch or `typeof` check
- Guard `popoutTimer()` for mobile (check `Platform.isDesktop` from Obsidian API)
- Prevent page scroll during touch drag on the ring (`e.preventDefault()` in touchmove when dragging)
- File: `src/main.ts`, `src/view.ts`

### P4: Update README to match reality
- Update theme count (10, not 4)
- Add the popout command to the commands table
- Add at least one screenshot (this alone will 2-3x install rate)
- Add a LICENSE file (MIT)
- File: `README.md`, add `LICENSE`

---

## 5. Submission Checklist

### Repository Requirements
- [ ] Public GitHub repo under `Neo-Vibe-Agent` org
- [ ] `main` branch with stable code
- [ ] `LICENSE` file (MIT) in repo root
- [ ] `.gitignore` excludes `node_modules/`, build artifacts if needed

### Required Files in Release
- [ ] `main.js` (built, minified)
- [ ] `manifest.json` (must match repo root)
- [ ] `styles.css` (must match repo root)
- [ ] All three files attached to a GitHub Release tagged with the version (e.g., `1.0.0`)

### manifest.json Checks
- [ ] `id` is unique (not already taken in community plugins list)
- [ ] `name` is clear and not misleading
- [ ] `version` follows semver
- [ ] `minAppVersion` is accurate (test against it)
- [ ] `author` matches GitHub account
- [ ] `authorUrl` is valid
- [ ] `fundingUrl` values are valid URLs
- [ ] `isDesktopOnly` is accurate (if mobile issues remain, set to `true`)

### README Checks
- [ ] Clear description of what the plugin does
- [ ] At least one screenshot or GIF
- [ ] Installation instructions (community + manual)
- [ ] Usage instructions
- [ ] All features documented accurately (theme count, commands, etc.)

### Code Quality
- [ ] Builds cleanly with `npm run build`
- [ ] No `console.log` in production (only `console.warn` for errors, which is fine)
- [ ] No hardcoded paths or user-specific data
- [ ] All intervals/timeouts cleaned up on unload
- [ ] Event listeners cleaned up on view close

### Submission PR
- [ ] Fork `obsidianmd/obsidian-releases` repo
- [ ] Add entry to `community-plugins.json`:
  ```json
  {
    "id": "pomodoro-timer",
    "name": "Pomodoro Timer",
    "author": "Neo Vibe",
    "description": "A beautiful, themeable Pomodoro timer with task sync, calendar integration, and CLI companion.",
    "repo": "Neo-Vibe-Agent/obsidian-pomodoro"
  }
  ```
- [ ] Submit PR to `obsidianmd/obsidian-releases`
- [ ] Wait for review (typically 1-4 weeks)

### Pre-Submit Smoke Test
- [ ] Fresh install in a test vault (no prior settings)
- [ ] Start/pause/resume/stop/skip all work
- [ ] Phase transitions work (work > break > work)
- [ ] Sound plays on completion
- [ ] All 10 themes render correctly
- [ ] Status bar shows and updates
- [ ] Popout window opens and receives updates
- [ ] Task list loads (with tasks in vault)
- [ ] Settings save and persist across restart
- [ ] Timer persists across Obsidian restart (within 30 min)
- [ ] Mobile: opens, displays, basic start/stop works
- [ ] Light mode: default theme doesn't look broken
- [ ] Dark mode: all themes look correct
- [ ] Narrow sidebar: nothing overflows or clips badly

---

## Council Notes

**Jordan**: "The README is the message. Right now it undersells by 60%. You have 10 themes and the README says 4. You have scroll-to-set, drag, pinch-to-zoom, popout windows, and none of that is in the README. Fix the README before anything else, because that's what converts browsers to installers."

**Nick**: "Would the calendar sync survive 30 days in production? No. It's using the calendar ID as an API key. Either ship it disabled with an 'experimental' label or rip it out for v1. A broken feature in the community directory is worse than a missing one. The core timer is solid though. Boring automation that works."

**Greg**: "Where's the screenshot? Distribution beats product. You could have the best pomodoro plugin ever made and nobody installs it without a hero image. One GIF of the neon theme with the ring animating and you're done. That's your install conversion right there."

**Nate**: "The reliability stack checks out for the core timer: timestamp-based (no drift), interval cleanup on destroy, state persistence across restart. The settings/timer-state sharing the same data blob is fragile but works. The real risk is the mobile path. If `isDesktopOnly: false` but Notification API and popout windows don't work on mobile, you'll get 1-star reviews from iPad users. Either test on mobile or set `isDesktopOnly: true` for v1."
