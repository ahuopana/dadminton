# Changelog

## Unreleased

- Compare: heatmap mode. Pick a player and see where their shots landed and where their faults ended, in top view and side view. With several matches ticked, the player's matches are also combined into one heatmap (players are matched by name).
- Player heights (in New match and Names & rules). The side view draws both players at scale, so arcs can be read against their height.
- Side view: the net is drawn at its real height, 1.55 m.
- Side view: the scoreboard overlaps the top of the court so the court can be bigger. While you draw, the scoreboard fades and ignores touches; otherwise it works as before.

## 1.0.0

First release.

- Top view and side view (height) of the court. Draw the shuttle's path; hits are detected where the line turns back towards the net, and the landing decides the point (win, out, wide, into the net).
- Tap a half for a fault by that player.
- Several games per match with point target, win by 2, cap, time limit and best-of setting. Next game button and match winner.
- Quick +/− score correction, logged in the point list. Manual game result override.
- Swap sides, with earlier arrows following the players.
- Shot tags, match notes and a point list.
- Compare several matches with stats.
- Export and import JSON, export CSV. Data saved in the browser.
- Full screen mode.
