# Button/State Matrix -- Pomodoro Timer

## Current State (what exists)

The ring is the primary control (Start when idle, Pause when running, Resume when paused). Secondary buttons render below the ring based on state. Current implementation:

| State | Ring Action | Secondary Buttons |
|-------|-------------|-------------------|
| idle | Start | (none) |
| work | Pause | +Xm, Done, Skip, Reset |
| short-break | Pause | Done, Skip, Reset |
| long-break | Pause | Done, Skip, Reset |
| paused | Resume | +Xm, Reset |

## Problems with Current State

1. **"Done" during breaks makes no sense.** Done marks the active task complete and clears it. That is a work-state action, not a break-state action. Nobody finishes a task during a break.
2. **"Done" without an active task is confusing.** If no task is selected, tapping Done just shows "No active task" -- wasted button real estate.
3. **"Skip" is ambiguous.** During work it skips to break. During break it skips to next work. Both call `handlePhaseComplete()`. That is fine mechanically but the label "Skip" does not communicate what happens next.
4. **Paused state is missing Skip and Done.** If you are paused mid-work and want to mark the task done or skip to break, you have to resume first. Unnecessary friction.

## Skip Behavior (clarified)

`skip()` calls `handlePhaseComplete()`, which means:

- **During work**: increments completed pomodoros, transitions to break (short or long based on cycle)
- **During break**: transitions to next work session

So "Skip" always means "end this phase early, move to the next one." The label should communicate direction.

## Recommendation: Simplified Matrix

**Principles:**
- Ring handles Start/Pause/Resume (no change)
- "Done" only shows when there is an active task
- "Skip" gets a directional label so you know what comes next
- Paused state inherits the buttons of whatever state was paused (minus Pause itself)
- Keep button count to 3 max in any state (this is a fun plugin, not a cockpit)

### Primary Control (Ring Tap)

| State | Ring Label | Ring Action |
|-------|-----------|-------------|
| idle | Start | Start timer |
| work | Pause | Pause timer |
| short-break | Pause | Pause timer |
| long-break | Pause | Pause timer |
| paused | Resume | Resume timer |

### Secondary Buttons

| State | Has Task? | Buttons (left to right) |
|-------|-----------|------------------------|
| idle | any | (none) |
| work | no | +Xm, Skip to Break, Reset |
| work | yes | +Xm, Done, Skip to Break |
| short-break | no | Skip Break, Reset |
| short-break | yes | Done, Skip Break |
| long-break | no | Skip Break, Reset |
| long-break | yes | Done, Skip Break |
| paused (was work) | no | +Xm, Skip to Break, Reset |
| paused (was work) | yes | +Xm, Done, Skip to Break |
| paused (was break) | no | Skip Break, Reset |
| paused (was break) | yes | Done, Skip Break |

### Button Definitions

| Button | Label | What It Does |
|--------|-------|-------------|
| +Xm | `+5m` (configurable) | Adds X minutes to current timer. Only during work (or paused-work). No point extending a break. |
| Done | `Done` | Marks active task complete in Obsidian, clears active task. Only visible when a task is selected. |
| Skip to Break | `Skip to Break` | Ends work early, counts the pomodoro, starts break. |
| Skip Break | `Skip Break` | Ends break early, starts next work session. |
| Reset | `Reset` | Stops timer, returns to idle. Nuclear option. Pushed to last position or hidden when Done is present (keeps max 3 buttons). |

### Why This Works

1. **Max 3 buttons in any state.** When "Done" is visible, it replaces "Reset" (which is rarely what you actually want mid-session). Reset is the escape hatch, not the primary action.
2. **Skip labels tell you where you are going.** "Skip to Break" and "Skip Break" are self-documenting. No ambiguity.
3. **Paused inherits context.** If you paused during work, you get work buttons. If you paused during break, you get break buttons. The only difference is the ring says Resume instead of Pause.
4. **Done is task-gated.** No task selected, no Done button. Clean.
5. **+Xm only during work.** Nobody needs to extend a 5-minute break. If they want longer breaks, that is a settings change.

### Edge Case: Reset Access When Task Is Active

When a task is active, Reset gets hidden to keep the 3-button max. If someone truly wants to reset mid-task, they can either:
- Tap Done first (clears task, Reset reappears), or
- Use the command palette (`Stop pomodoro` command already exists)

This is the right tradeoff. Reset is a rare destructive action. It should not compete for space with the buttons you actually use.

## Implementation Notes

- `renderSecondaryControls` needs access to: `state`, `previousState` (for paused context), `hasActiveTask`
- The timer already tracks `previousState` via the pause/resume logic in `timer.ts`
- Button labels "Skip to Break" and "Skip Break" are longer. Style with smaller font or abbreviate to "To Break" / "Skip Break" if space is tight.
- Alternative short labels: the caret arrow approach, e.g. `Break >>` and `Work >>`. Test both, see what fits the UI.
