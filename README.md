# Pomodoro Timer

A beautiful, themeable Pomodoro timer for Obsidian with a circular progress ring, 10 themes, 12 sounds, and a floating popout window.

No files created in your vault. No network calls. Inherits your Obsidian theme by default.

## Features

- **Circular progress ring** that fills as you work. Click to start, pause, or resume. Scroll to set time.
- **Mode tabs**: Focus Time, Short Break, Long Break with auto-cycling and configurable intervals.
- **10 built-in themes**: Default, Clean, Neon, Forest, Orange, Matrix, Cyberpunk, Angel, Ocean, City.
- **12 built-in sounds**: Bell, Chime, Ding, Complete, Soft Chime, Digital, Zen Bowl, Raindrop, Level Up, Warm Tone, Alert, Success.
- **Popout window**: Float the timer over your workspace in a separate window.
- **Quick task input**: Add a task inline and track it during your session.
- **Duration presets**: 25m, 50m, 90m. Or scroll/drag to set any duration (1-90 min).
- **Custom colors**: Override any theme with your own primary, secondary, and accent colors.
- **Status bar**: Shows timer state and remaining time. Click to show/hide the panel.
- **Pomodoro log**: Optionally log completed sessions to a markdown file.
- **Keyboard shortcuts**: Start, pause, stop, skip, toggle panel, popout. All via command palette.

## Screenshots

(Coming soon)

## Installation

### From Community Plugins
1. Open **Settings > Community Plugins**
2. Search for **"Pomodoro Timer"**
3. Click **Install**, then **Enable**

### Manual
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create `pomodoro-timer/` in your vault's `.obsidian/plugins/` directory
3. Copy the files into the folder
4. Enable in **Settings > Community Plugins**

## Commands

| Command | Description |
|---------|-------------|
| Start pomodoro | Start a focus session |
| Pause pomodoro | Pause the timer |
| Stop pomodoro | Reset the timer |
| Skip to next phase | Jump to the next break or focus session |
| Open Pomodoro panel | Show the timer in the sidebar |
| Hide Pomodoro panel | Minimize to status bar |
| Toggle Pomodoro panel | Show or hide |
| Pop out to floating window | Open in a separate window (desktop) |

## Task Tracking

Add `[pomo:: 0/8]` to any task to track pomodoros:

```markdown
- [ ] Write the API documentation [pomo:: 3/8]
- [ ] Review pull requests [pomo:: 0/4]
```

The count updates automatically when you complete a session with that task selected.

## Themes

| Theme | Vibe |
|-------|------|
| Default | Teal, adapts to your Obsidian theme |
| Clean | Monochrome, thin lines |
| Neon | Hot pink + cyan, glowing |
| Forest | Earthy greens |
| Orange | Warm amber on dark |
| Matrix | Green on black, monospace |
| Cyberpunk | Blue neon + pink, double glow |
| Angel | White and gold |
| Ocean | Teal on deep green |
| City | Grayscale + orange |

All themes support the [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin for additional customization.

## Roadmap

Planned for future releases:
- Calendar integration (show upcoming events, plan pomodoros around meetings)
- CLI companion (sync timer state with terminal tools)
- Timer state persistence (resume after restart)
- Additional themes (Catppuccin, Nord, Dracula, Solarized)

## Support

If this plugin helps you focus, consider supporting development:

- [Buy Me a Coffee](https://buymeacoffee.com/neovibe)
- [GitHub Sponsors](https://github.com/sponsors/Neo-Vibe-Agent)

## License

MIT. Built by [Neo Vibe](https://neovibe.io).
