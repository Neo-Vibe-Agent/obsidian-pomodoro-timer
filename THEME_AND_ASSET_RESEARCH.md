# Theme and Asset Research

Research compiled 2026-03-26 for the Obsidian Pomodoro Timer plugin.

---

## 1. Top Obsidian Themes by Popularity

The Obsidian community has 416+ themes. These are the top 15 by downloads and community recognition, based on obsidianstats.com data, Knowledge Ecology rankings, and official Gems of the Year awards.

| Rank | Theme | Vibe / Color Palette | Notes |
|------|-------|---------------------|-------|
| 1 | **Minimal** | Clean, neutral grays. Ships with color scheme presets: Dracula, Everforest, Gruvbox, macOS, Nord, Notion, Solarized, Things. Supports low/high contrast + true black OLED mode. | ~500k downloads. Official "Best Theme" award winner. 4.8k GitHub stars. The dominant theme. |
| 2 | **Things** | Inspired by Cultured Code's Things app. Soft whites, clean blues, native macOS feel. Rounded corners, subtle shadows. | Consistently top 5. Feels like a native Apple app. |
| 3 | **Blue Topaz** | Vibrant blue accents (#4B98C0 range), soft backgrounds, high customizability via Style Settings plugin. Chinese developer community favorite. | Top 5 by downloads. Very feature-rich settings panel. |
| 4 | **AnuPpuccin** | Pastel-forward, ships with Catppuccin, Dracula, and other colorschemes deeply integrated into UI elements. Rainbow accents, playful but polished. | 2022 Gem of the Year. Currently on hiatus but still widely used. |
| 5 | **Catppuccin** | 4 "flavors" (Latte, Frappe, Macchiato, Mocha) with 26 pastel colors each. Warm, soothing mid-contrast palette. Rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender. | Huge cross-app ecosystem (200+ ports). Very active community. |
| 6 | **Primary** | Soft, playful, relaxed. Warm tones, rounded UI, feels creative and inviting. Works well in both light and dark. | "Instantly puts you in a relaxed state that opens the door to creativity." |
| 7 | **Obsidian Nord** | Based on the Nord palette: arctic blue-gray tones (#2E3440, #3B4252, #434C5E, #4C566A for dark; #D8DEE9, #E5E9F0, #ECEFF4 for light). Frost blues (#8FBCBB, #88C0D0, #81A1C1, #5E81AC). | Simple, soothing, minimal config needed. |
| 8 | **Everforest** | Earthy greens and warm browns. Calming, nature-inspired palette. One of the oldest community themes. | Steady downloads. Appeals to nature/calm aesthetic. |
| 9 | **Dracula** | Dark purple background (#282A36), purple/pink/green/cyan accents (#BD93F9, #FF79C6, #50FA7B, #8BE9FD). High contrast on dark. | Classic dev theme. Huge cross-app ecosystem. |
| 10 | **Cupertino** | Native Apple-inspired, clean whites and system grays. Mobile-friendly, focused writing experience. | 2024 Gems of the Year WINNER. Rising fast. |
| 11 | **Prism** | Colorful highlights, vibrant accents activated through mark tags. Requires Style Settings for full effect. | Unique highlight-focused approach. |
| 12 | **Obsidian Gruvbox** | Retro warm palette: dark browns (#282828), warm oranges (#D65D0E), yellows (#D79921), greens (#98971A), aqua (#689D6A). | Classic retro dev aesthetic. |
| 13 | **Solarized** | Ethan Schoonover's famous palette: base tones (#002B36 dark, #FDF6E3 light) with precise accent colors. Designed for readability. | Scientific approach to color. |
| 14 | **Fancy A Story** | Immersive, story-writing focused. Unique typography and layout for creative writing. | 2024 Gems of the Year runner-up. |
| 15 | **Underwater** | Customizable with wide variety of color schemes. Ocean-inspired default palette. | 2024 Gems of the Year runner-up. |

### Key Takeaways for Plugin Compatibility

- **Minimal alone is ~50% of themed users.** Our plugin MUST look perfect in Minimal with all its color scheme presets.
- The community gravitates toward pastel palettes (Catppuccin, AnuPpuccin), nature tones (Everforest, Nord), and Apple-native aesthetics (Things, Cupertino).
- Most popular themes use CSS custom properties (`--background-primary`, `--text-normal`, `--interactive-accent`, etc.). Plugins that inherit these variables look native automatically.
- Dark mode is dominant but light mode support is required. True black/OLED mode is a bonus.

---

## 2. Top Timer/Pomodoro App Aesthetics

### App-by-App Breakdown

**Forest** (iOS/Android, most popular)
- Gamification-driven: plant a virtual tree that grows during focus, dies if you leave
- Warm greens, earthy browns, organic textures
- Coin/gem reward system with visual forest growing over time
- Why users love it: emotional connection, guilt of killing a tree, seeing your forest grow

**Pomofocus** (Web, pomofocus.io)
- Ultra-minimal browser-based timer
- Color-coded modes: red (#BA4949) for focus, blue (#4A7FA5) for short break, green (#6A994E) for long break
- Big centered countdown number, minimal controls
- Why users love it: zero friction, distraction-free, just works

**Session** (Mac/iOS, premium)
- Most design-forward Pomodoro app on Mac
- Sleek, dark UI with subtle gradients
- Encourages reflection: define what you're working on, reflect after
- Analytics dashboard with session history
- Why users love it: beautiful, feels intentional, deep work philosophy

**Flow** (Mac/iOS)
- Feels like Apple built it: native macOS design language
- Clean menu bar integration, lightweight
- Minimal UI, soft colors, system-native feel
- Why users love it: invisible when working, just a menu bar timer

**Be Focused** (Mac/iOS)
- Apple-native, minimalist, menu bar focused
- Clean and uncluttered, feels invisible during work
- Now feels dated compared to Session/Flow
- Why users love it: simplicity, iCloud sync, reliability

**Toggl Track** (Cross-platform)
- Professional, data-driven aesthetic
- Purple brand color, clean dashboard
- Pomodoro mode links directly to time logs and reports
- Why users love it: Pomodoro + time tracking in one, great for freelancers

**Focus Keeper** (iOS)
- Colorful "timer wheel" with tactile visual feedback
- Bright, engaging colors
- Streak tracking with satisfying completion sounds
- Why users love it: visual progress, gamification-lite

**Flocus** (Web)
- Aesthetic productivity dashboard
- Customizable themes paired with ambient soundscapes
- Soft, restorative visual atmosphere
- Why users love it: the vibe, ambient sounds, visual themes

### Universal Design Patterns

1. **Big, centered countdown** is the anchor element in every successful timer app
2. **Color-coded states** (work vs. break) with distinct but not jarring transitions
3. **Minimal controls** during active sessions, more options in settings
4. **Progress indicators** (completed pomodoros as dots, circles, or visual metaphors)
5. **Dark backgrounds** dominate, with light mode as secondary option
6. **Rounded shapes** (circular timers, pill buttons, rounded cards) feel approachable
7. **Subtle animations** on state transitions (start, pause, complete)
8. **Statistics/analytics** as a secondary view, not cluttering the timer

### Color Psychology in Timer Apps

- **Red/warm tones** for focus sessions (urgency, energy, attention)
- **Blue/cool tones** for short breaks (calm, recovery, rest)
- **Green/nature tones** for long breaks (renewal, growth, restoration)
- **Neutral/dark backgrounds** to reduce eye strain during long sessions

---

## 3. Obsidian Community Plugin Submission Checklist

### Repository Requirements

- [ ] Public GitHub repository
- [ ] `LICENSE` file present (MIT, Apache 2.0, or GPL recommended)
- [ ] `README.md` in root of repo describing purpose and usage
- [ ] No real API keys or secrets committed

### manifest.json

```json
{
  "id": "pomodoro-timer",
  "name": "Pomodoro",
  "version": "1.0.0",
  "minAppVersion": "1.5.0",
  "description": "A beautiful, themeable Pomodoro timer with task sync, calendar integration, and CLI companion.",
  "author": "Neo Vibe",
  "authorUrl": "https://neovibe.io",
  "fundingUrl": {
    "Buy Me a Coffee": "https://buymeacoffee.com/neovibe",
    "GitHub Sponsor": "https://github.com/sponsors/Neo-Vibe-Agent"
  },
  "isDesktopOnly": false
}
```

Rules:
- [ ] `id` is alphanumeric with dashes only, no "obsidian" prefix
- [ ] `version` matches the GitHub release tag exactly (e.g., `1.0.0`, NOT `v1.0.0`)
- [ ] `name` is not a template phrase like "Sample Plugin"
- [ ] `description` accurately reflects functionality
- [ ] `isDesktopOnly` set to `true` if not tested on mobile

### GitHub Release Format

- [ ] Create a release with tag matching manifest.json version exactly (e.g., `1.0.0`)
- [ ] Attach these as individual binary assets (NOT just source zip):
  - `main.js` (compiled plugin code)
  - `manifest.json` (plugin metadata)
  - `styles.css` (plugin styles)
- [ ] manifest.json exists both in repo root AND as a release asset

### community-plugins.json PR

1. Fork `obsidianmd/obsidian-releases`
2. Add entry to the END of `community-plugins.json`:

```json
{
  "id": "pomodoro-timer",
  "name": "Pomodoro",
  "author": "Neo Vibe",
  "description": "A beautiful, themeable Pomodoro timer with task sync, calendar integration, and CLI companion.",
  "repo": "Neo-Vibe-Agent/obsidian-pomodoro"
}
```

3. Submit PR using the plugin submission template
4. Complete the PR checklist (attestation of quality and maintenance commitment)
5. Automated validation (`validate-plugin-entry.yml`) runs on the PR

### README Requirements

- [ ] Clear description of what the plugin does
- [ ] Feature list
- [ ] Screenshots showing the plugin in action
- [ ] Installation instructions
- [ ] Configuration/settings documentation
- [ ] Attribution for any code from other plugins

**Screenshot Best Practices:**
- Include 2-4 screenshots minimum
- Show the plugin in both dark and light mode
- Show the main timer view, settings panel, and any unique features
- Recommended: 1200-1600px wide, PNG format
- Show the plugin looking native in a popular theme (Minimal recommended)
- GIFs/short videos are excellent for demonstrating timer animations

### Funding/Monetization Setup

**Buy Me a Coffee:**
- [ ] Create account at buymeacoffee.com
- [ ] Set up a page with plugin description and goals
- [ ] Add link to manifest.json `fundingUrl`
- [ ] Creates a "Support" button in the Obsidian plugin browser

**GitHub Sponsors:**
- [ ] Enable GitHub Sponsors on your account/org
- [ ] Create `.github/FUNDING.yml` in repo:
  ```yaml
  buy_me_a_coffee: neovibe
  github: Neo-Vibe-Agent
  ```
- [ ] Add link to manifest.json `fundingUrl`

**How it appears in Obsidian:**
The `fundingUrl` field in manifest.json creates a clickable funding link in the plugin's page within Obsidian's community plugin browser. Users see it when browsing or after installing.

### Post-Submission Marketing

- [ ] Announce in Obsidian Forum "Share and Showcase" section
- [ ] Announce in Obsidian Discord #updates channel
- [ ] Create a short demo video/GIF
- [ ] Consider a blog post or tutorial

### Policy Compliance

- [ ] Review [Developer Policies](https://docs.obsidian.md/Developer+policies)
- [ ] Review [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [ ] Test on Windows, macOS, and Linux (desktop required)
- [ ] Test on iOS/Android if `isDesktopOnly` is false
- [ ] No external network calls without user consent/awareness

---

## 4. Theme Recommendations for Our Plugin

### Current Plugin Themes (10)

Default, Minimal, Neon, Forest, Orange, Matrix, Cyberpunk, Angel, Ocean, City

### Analysis: What to ADD

Based on the top Obsidian themes, we should add these 3-5 themes to match what the community actually uses:

**1. ADD: "Catppuccin" theme**
- Why: Catppuccin is the fastest-growing color ecosystem with 200+ app ports. Obsidian users using the Catppuccin theme will expect plugins to match.
- Palette: Warm pastels. Use Mocha flavor as default (dark: #1E1E2E background, #CDD6F4 text, #F5C2E7 pink accent, #89B4FA blue accent).
- Priority: HIGH. This is a massive community.

**2. ADD: "Nord" theme**
- Why: Nord is a top-10 Obsidian theme and a major cross-app ecosystem. Clean, professional, universally liked.
- Palette: Arctic blues and grays. Dark: #2E3440 background, #D8DEE9 text, #88C0D0 frost blue accent, #81A1C1 secondary.
- Priority: HIGH.

**3. ADD: "Dracula" theme**
- Why: Dracula is one of the most popular dark themes across all dev tools. Obsidian's Dracula theme is top 10.
- Palette: #282A36 background, #F8F8F2 text, #BD93F9 purple accent, #FF79C6 pink, #50FA7B green, #8BE9FD cyan.
- Priority: MEDIUM-HIGH.

**4. ADD: "Solarized" theme**
- Why: Classic, scientifically designed palette. Obsidian's Solarized is well-used and the Minimal theme includes it as a built-in color scheme.
- Palette: Dark (#002B36 bg, #839496 text, #268BD2 blue accent) and Light (#FDF6E3 bg, #657B83 text, #268BD2 blue accent).
- Priority: MEDIUM.

**5. ADD: "Everforest" theme (or rename existing "Forest")**
- Why: Everforest is one of the oldest and most-loved Obsidian themes. Our current "Forest" theme could be renamed/adjusted to match.
- Palette: #2F383E background, #D3C6AA text, #A7C080 green accent, #7FBBB3 aqua, #D699B6 purple.
- Priority: MEDIUM.

### Analysis: What to MODIFY

**Rename "Forest" to "Everforest"**
- Align with the well-known Everforest color palette that Obsidian users recognize.
- Adjust hex values to match the actual Everforest palette.

**Rename "Minimal" to "Clean" or "Slate"**
- Avoid confusion with Obsidian's Minimal theme (which is the #1 theme by downloads).
- Our "Minimal" theme is a visual preset, not the Minimal theme. Users will expect it to match the actual Minimal theme, which could cause confusion.
- Recommendation: rename to "Clean" or "Slate" to avoid the naming collision.

**Review "Default" theme**
- Should inherit Obsidian's CSS custom properties as much as possible.
- If Default already reads from `--background-primary`, `--text-normal`, `--interactive-accent`, then it will automatically match any Obsidian theme the user has installed. This is the most important theme to get right.

### Themes to KEEP As-Is

- **Neon**: Unique, flashy, appeals to a specific crowd. No popular Obsidian theme matches this, which makes it distinctive.
- **Matrix**: Same, distinctive and fun.
- **Cyberpunk**: Unique aesthetic, keep it.
- **Ocean**: Overlaps slightly with Nord but different enough to keep.
- **Angel**: Unique light/pastel aesthetic.
- **City**: Unique urban/dark aesthetic.
- **Orange**: Unique warm accent theme.

### Summary of Changes

| Action | Theme | Reason |
|--------|-------|--------|
| ADD | Catppuccin | Top-growing color ecosystem, massive community |
| ADD | Nord | Top-10 theme, universally clean |
| ADD | Dracula | Top-10 dark theme across all apps |
| ADD | Solarized | Classic, scientific palette, Minimal preset |
| RENAME | Forest -> Everforest | Match the well-known Obsidian theme name |
| RENAME | Minimal -> Clean | Avoid confusion with Obsidian's #1 theme |

This brings us from 10 to 14 themes total: Default, Clean (was Minimal), Neon, Everforest (was Forest), Orange, Matrix, Cyberpunk, Angel, Ocean, City, Catppuccin, Nord, Dracula, Solarized.

---

## 5. Sound Design for Timer Apps

### What the Best Timer Apps Use

**Completion Sounds (end of focus session)**
- Bell/chime sounds are the gold standard
- Tibetan singing bowl: rich harmonics, gradual decay, zero stress response
- Meditation gong: deep, resonant, signals clear boundary
- Simple bell "ding": classic Pomodoro, familiar, reliable
- Wind chime: light, airy, pleasant transition
- Target: 50-60 decibels (conversational speech level)

**Break Transition Sounds (end of break, back to work)**
- Brighter, shorter chime or two-tone bell
- Slightly more alert-generating than completion sounds
- Should signal "time to re-engage" without being jarring
- Over time, these become Pavlovian triggers for focus (optimal conditioning after 30-60 days)

**Ambient/Background Sounds (during sessions)**
- Rain (most universally popular)
- Ocean waves
- Cafe/coffee shop murmur (Coffitivity proved this category)
- Brown noise (deeper than white noise, growing in popularity)
- Fireplace crackling
- Forest birds and stream
- Lo-fi music integration

### Sound Design Principles

1. **Gradual onset, gradual decay**: Bells and chimes work because they don't terminate abruptly. Buzzer-style sounds trigger startle responses and cortisol spikes, which are counterproductive.
2. **Different sounds for different transitions**: Use distinct sounds for work-end vs. break-end. This leverages Pavlovian conditioning so users' brains learn the associations.
3. **Volume matters more than sound choice**: 50-60dB is ideal. Never allow maximum volume. The best apps cap timer sounds well below system max.
4. **Consistency builds habit**: The same sounds repeated over 30-60 days create stronger conditioned responses. Don't change sounds frequently.
5. **Ticking is optional but powerful**: The original Pomodoro technique used a kitchen timer's ticking to create time awareness. Some users love it, many find it distracting. Always make it optional.

### Our Current Sounds vs. Competition

Current plugin sounds: bell, chime, ding, complete.

**To be competitive, add:**

| Category | Sound | Priority | Notes |
|----------|-------|----------|-------|
| Completion | Singing bowl | HIGH | Most requested "premium" timer sound |
| Completion | Soft gong | MEDIUM | Deep, resonant alternative |
| Break start | Gentle two-tone chime | HIGH | Distinct from completion sounds |
| Break end | Rising chime | HIGH | Brighter, signals re-engagement |
| Ambient | Rain | HIGH | Most popular ambient sound universally |
| Ambient | Brown noise | HIGH | Growing fast in popularity |
| Ambient | Cafe murmur | MEDIUM | Proven focus enhancer |
| Ambient | Lo-fi beats | MEDIUM | Very popular with the Obsidian demographic |
| Ambient | Fireplace | LOW | Nice to have, cozy |
| Optional | Soft ticking | MEDIUM | Classic Pomodoro purist feature |

### Competitive Advantage Opportunities

1. **Theme-matched sounds**: Each visual theme could have a suggested/default sound pairing. Neon theme gets electronic tones, Everforest gets nature sounds, etc.
2. **Fade-out on breaks**: Noisli popularized this. Ambient sounds gradually fade as a break begins rather than cutting abruptly.
3. **Custom sound upload**: Let users add their own .mp3/.wav completion sounds.
4. **Volume per sound type**: Separate sliders for completion sounds vs. ambient sounds.

---

## Sources

- [Top 35 Obsidian Themes (Knowledge Ecology)](https://www.knowledgeecology.me/top-35-best-obsidian-themes-as-decided-by-its-users/)
- [ObsidianStats Themes](https://www.obsidianstats.com/themes)
- [Minimal Theme GitHub](https://github.com/kepano/obsidian-minimal)
- [Catppuccin Theme GitHub](https://github.com/catppuccin/obsidian)
- [AnuPpuccin Theme GitHub](https://github.com/AnubisNekhet/AnuPpuccin)
- [Obsidian 2024 Gems of the Year](https://obsidian.md/blog/2024-goty-winners/)
- [Submit Your Plugin (Obsidian Docs)](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Submission Requirements (Obsidian Docs)](https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins)
- [Plugin Submission Guide (DeepWiki)](https://deepwiki.com/obsidianmd/obsidian-releases/6.1-plugin-submission-guide)
- [obsidian-releases GitHub](https://github.com/obsidianmd/obsidian-releases)
- [Best Pomodoro Timer Apps 2026 (Reclaim)](https://reclaim.ai/blog/best-pomodoro-timer-apps)
- [Best Aesthetic Pomodoro Timers (Takwa)](https://www.takwa.app/blog/best-pomodoro-timer)
- [Forest App](https://www.forestapp.cc/)
- [Session App](https://www.stayinsession.com/)
- [Pomofocus](https://pomofocus.io/)
- [Pomodoro Sound Alerts (Blog Timer)](https://theblogtimer.com/guides/pomodoro-sound-alerts)
- [Noisli](https://www.noisli.com/)
- [Flocus](https://flocus.com/)
