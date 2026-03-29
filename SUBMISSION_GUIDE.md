# Pomodoro Timer: Obsidian Community Plugin Submission Guide

## Pre-Submission Checklist

- [x] Plugin ID: `pomodoro-timer` (unique, no collision)
- [x] manifest.json version: `1.1.0`
- [x] versions.json maps 1.1.0 to minAppVersion 1.5.0
- [x] LICENSE file (MIT)
- [x] README.md (under 100 lines, features, commands, themes, roadmap)
- [x] No network calls in v1.1
- [x] No vault files created by default (log is opt-in)
- [x] isDesktopOnly: false (basic features work on mobile, popout guarded)
- [x] Clean build: `npm run build` produces main.js and styles.css
- [ ] Screenshots (3-4, see below)
- [ ] GitHub repo created and pushed
- [ ] GitHub release v1.1.0 created with assets
- [ ] community-plugins.json PR submitted
- [ ] Buy Me a Coffee page live

---

## Step 1: Create GitHub Repo

```bash
# Install gh if needed
brew install gh

# Login
gh auth login

# Create repo
cd ~/nv/tools/obsidian-pomodoro
gh repo create Neo-Vibe-Agent/obsidian-pomodoro-timer --public --source=. --remote=origin --push

# Or if repo already exists:
git remote add origin git@github.com:Neo-Vibe-Agent/obsidian-pomodoro-timer.git
git push -u origin release/v1.1
```

---

## Step 2: Take Screenshots

Need 3-4 screenshots saved to the repo. Suggested shots:

1. **Timer running (Neon or Cyberpunk theme)** - Ring animating, Focus state, time counting down
2. **Theme gallery** - Show 4-6 themes side by side (or a grid composite)
3. **Settings panel** - Show the clean settings UI
4. **Popout window** - Floating timer over Obsidian workspace

Save to `screenshots/` in the repo. Reference in README:
```markdown
![Timer](screenshots/timer-neon.png)
![Themes](screenshots/theme-gallery.png)
```

---

## Step 3: Create GitHub Release

```bash
# Tag the release
git tag 1.1.0
git push origin 1.1.0

# Create release with assets
gh release create 1.1.0 \
  main.js \
  manifest.json \
  styles.css \
  --title "v1.1.0" \
  --notes "Initial public release. 10 themes, 12 sounds, circular progress ring, task tracking, popout window, custom colors."
```

IMPORTANT: Assets must be uploaded as individual files, NOT zipped. The Obsidian app downloads them individually.

---

## Step 4: Submit to Community Plugins

```bash
# Fork the releases repo
gh repo fork obsidianmd/obsidian-releases --clone

# Edit community-plugins.json, add this entry (alphabetical by id):
```

Add this JSON entry to `community-plugins.json`:

```json
{
  "id": "pomodoro-timer",
  "name": "Pomodoro Timer",
  "author": "Neo Vibe",
  "description": "A beautiful, themeable Pomodoro timer with circular progress ring, 10 themes, 12 sounds, task tracking, and floating popout window.",
  "repo": "Neo-Vibe-Agent/obsidian-pomodoro-timer"
}
```

```bash
# Commit and push
git add community-plugins.json
git commit -m "Add pomodoro-timer plugin"
git push origin main

# Create PR
gh pr create --title "Add pomodoro-timer plugin" --body "## Plugin Submission

- **Plugin ID**: pomodoro-timer
- **Plugin Name**: Pomodoro Timer
- **Author**: Neo Vibe
- **Repo**: Neo-Vibe-Agent/obsidian-pomodoro-timer
- **Description**: A beautiful, themeable Pomodoro timer with circular progress ring, 10 themes, 12 sounds, task tracking, and floating popout window.

### Checklist
- [x] Plugin follows the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [x] Plugin has a license (MIT)
- [x] Plugin has a README
- [x] manifest.json has all required fields
- [x] Plugin does not contain obfuscated code
- [x] Plugin does not make network requests"
```

---

## Step 5: Buy Me a Coffee

1. Go to https://buymeacoffee.com/
2. Sign up as "neovibe"
3. Set up page:
   - Name: Neo Vibe
   - Tagline: "Building AI-native tools for knowledge workers"
   - Photo: Neo Vibe logo
   - Default coffee price: $5
4. Copy the URL (should be buymeacoffee.com/neovibe)
5. Verify it matches manifest.json fundingUrl

---

## Step 6: GitHub Sponsors (Optional)

1. Go to https://github.com/sponsors/Neo-Vibe-Agent
2. Set up sponsor tiers:
   - $3/month: "Supporter"
   - $5/month: "Power User"
   - $10/month: "Builder"
3. Verify it matches manifest.json fundingUrl

---

## Post-Submission

After the PR is merged:
- Plugin appears in Obsidian community plugin directory
- Users can install from Settings > Community Plugins > Browse
- Future updates: just create new GitHub releases, users get auto-updates
- Monitor GitHub issues for bug reports
- Respond quickly to issues (this is the #1 differentiator vs dead competitors)

### Marketing Channels
- Post on r/ObsidianMD (200K+ subscribers)
- Post on Obsidian Discord (#plugin-showcase)
- Post on Obsidian Forum (Share & Showcase)
- LinkedIn post: "I built a Pomodoro timer for Obsidian"
- X/Twitter: tag @obaborin

### v1.2 Roadmap (bring back from v1.0-local)
- Calendar sync (with proper iCal URL, not Google API)
- CLI companion (separate npm package)
- Timer state persistence (properly implemented)
- Invert toggle (fixed CSS swap)
- Pinch-to-zoom (single handler)
- DataView integration
- Catppuccin, Nord, Dracula, Solarized themes
