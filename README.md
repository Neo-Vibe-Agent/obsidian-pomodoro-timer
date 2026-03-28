# Pomodoro

A beautiful, themeable Pomodoro timer for Obsidian with task sync, calendar integration, and CLI companion.

## Features

**Core Timer**
- Configurable work, short break, and long break durations
- Long break intervals (every N pomodoros)
- Auto-start breaks and work sessions
- Built-in sounds (bell, chime, ding, complete)
- System notifications
- Status bar display with click-to-open

**Task Sync**
- Sync with Obsidian Tasks plugin
- DataView integration
- Custom file path support
- Track pomodoros per task with `[pomo:: 3/8]` inline fields
- Automatic pomodoro logging to a markdown table

**Calendar Integration**
- Google Calendar sync via public API
- Shows upcoming events in the timer panel
- "N pomodoros before next event" calculation
- Plan your focus blocks around your schedule

**CLI Companion**
- Shared state file (`.pomodoro-state.json`) for terminal integration
- Start a pomodoro in Obsidian, see it in your terminal
- Start one in the terminal, see it in Obsidian
- File-watching bridge with debounced sync

**Theming**
- 4 built-in themes: Default, Minimal, Neon, Forest
- Full CSS variable customization
- Style Settings plugin compatible (color pickers, font selection)
- Responsive sizing (small, medium, large)

## Installation

### From Obsidian Community Plugins
1. Open Settings > Community Plugins
2. Search for "Pomodoro"
3. Install and enable

### Manual
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder `pomodoro` in your vault's `.obsidian/plugins/` directory
3. Copy the files into the folder
4. Enable the plugin in Settings > Community Plugins

## Usage

1. Click the timer icon in the left ribbon (or run "Open Pomodoro panel" from command palette)
2. Select a task from the task list (optional)
3. Click "Start"
4. Focus until the timer completes
5. Take your break
6. Repeat

### Commands

| Command | Hotkey | Description |
|---------|--------|-------------|
| Start pomodoro | - | Start a new work session |
| Pause pomodoro | - | Pause the current timer |
| Stop pomodoro | - | Stop and reset the timer |
| Skip to next phase | - | Skip to the next break or work session |
| Open Pomodoro panel | - | Open the timer panel |

### Task Tracking

Add `[pomo:: 0/8]` to any task to track estimated vs completed pomodoros:

```markdown
- [ ] Write the API documentation [pomo:: 3/8]
- [ ] Review pull requests [pomo:: 0/4]
```

The plugin updates the count automatically when you complete a pomodoro with that task selected.

## Support

If you find this plugin useful, consider supporting development:

- [Buy Me a Coffee](https://buymeacoffee.com/neovibe)
- [GitHub Sponsors](https://github.com/sponsors/Neo-Vibe-Agent)

## License

MIT

Built by [Neo Vibe](https://neovibe.io)
