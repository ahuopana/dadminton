# Dadminton – Badminton Notes

Tactical note taking for junior singles badminton. A single self-contained file that runs in any browser, offline, with no account.

**Use it:** https://ahuopana.github.io/Dadminton/ (or open `index.html` from a download).

## Features

- Draw the shuttle's path on a top view or a side view (with height) of the court. Each time the line turns back towards the net, the player on that side hit it. Where it ends decides the point: win, out, wide or into the net.
- Tap a half for a fault by that player. Quick +/− score corrections.
- Several games per match: point target, win by 2, cap, time limit, best of N.
- Compare several matches side by side with stats and notes.
- Export and import JSON, export CSV. Matches are saved in the browser.
- Full screen mode with an exit button.

See the [user guide](docs/USER_GUIDE.md) for how to use it.

## Development

There is no build step. Edit `index.html` and open it in a browser.

```
npm install
npx playwright install chromium
npm test
```

Tests run the app in headless Chromium and check the scoring rules, game flow, side view and compare view.

## Releasing

1. Update the version in `index.html` (`VERSION`), `package.json` and `CHANGELOG.md`.
2. Commit, then tag and push: `git tag v1.1.0 && git push origin main v1.1.0`.
3. The `Release` workflow creates a GitHub release with `index.html` attached. The `Pages` workflow publishes the latest `main` to GitHub Pages.

GitHub Pages must use **GitHub Actions** as its source (Settings → Pages → Build and deployment).

## Licence

Apache 2.0, see [LICENSE](LICENSE).
