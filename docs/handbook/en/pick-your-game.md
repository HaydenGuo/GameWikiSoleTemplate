---
title: "Chapter 1 · Pick Your Game: Pick Wrong and All the Work After Is Wasted"
description: "Four gates filter games worth building for: list candidates, score them, confirm search volume, eye the competition. Build-or-drop in two days, AI prompt included."
manual: learn
order: 1
icon: lucide:crosshair
tldr: "This chapter does exactly one thing: help you decide which game to build for. List 10 to 20 candidates, score each one (60 or above passes), confirm in Google Trends that people actually search for it, then spend two minutes checking how crowded Google's results page is. Pass all four gates and start immediately — the whole process should take no more than two days."
updated: 2026-08-26
---

## Where you are, and what this chapter solves

You want to earn traffic money from a game guide site. The whole thing is like opening a snack shop: **first decide what snack you sell, then decorate the store**.

Most beginners build the site right away — that's like opening the shop only to discover nobody on this street eats what you sell. Game guide traffic follows a rule: after a new game takes off, the **2 to 8 weeks** are the golden window. That month-plus of searches can be 60% to 80% of the game's lifetime search volume. Pick the right window and even ordinary content ranks; pick the wrong one and nobody reads you no matter how well you write.

So lesson one is not building a site. It's picking the product. Judge two things:

1. Will this game take off? (does anyone search for it)
2. When it does, are there still open seats on page one of Google's results? (is the competition crowded)

**Two iron rules so you don't pick forever**: a score of 60 or above means act, and a too-crowded results page is a hard veto; from starting to deciding, spend at most 2 days. Picking a game is racing the clock, not doing research.

## What you'll have when this chapter is done

- One clear decision: this game — **build** or **drop**
- A "first-day 10 pages" list: which 10 pieces of content to write on day one, and in what order

## A few words to know (just for this chapter)

- **Search volume**: how many people search a term on Google each day. More people = more potential customers.
- **SEO**: the whole toolkit for getting Google to rank your pages higher. You'll be using it throughout this book.
- **SERP**: the Google search results page itself. The top 10 spots on page one are the golden storefronts — most clicks land there.

## Gate 1: List your candidates (30 minutes)

Find new games from the places below; gather 10 to 20 candidates before moving on. Pick 3 to 5 from each:

| Where to look | What to watch |
|---|---|
| [The newest page on itch.io](https://itch.io/games/newest) (pick Play in browser) | New games every day, the least competition |
| [Steam's new-release and wishlist charts](https://store.steampowered.com/explore/new/) | High game quality, but more people watching too |
| [Roblox's Discover page](https://www.roblox.com/discover) (switch to the Rising / Up-and-Coming sort) | The densest crowd of players searching "codes" |
| Recent breakouts on YouTube gaming channels | Over 50K views in 7 days means people really watch |

Candidate pool too small? The repo doc [`docs/sourcing.md`](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/sourcing.md) is the full playbook: **9 sourcing channels** (how to read SteamDB's trending charts, spotting outlier videos from small creators on social media, sweeping game-aggregator sitemaps…), plus a **decision log table** — game name | build / skip / maybe | launch date | site link. Anything you can't call goes down as "maybe", and gets a second look the next day. Twenty minutes of channel-surfing a day yields a steady 3 to 5 new candidates: sourcing becomes a pipeline, not luck.

## Gate 2: Score every candidate (5 minutes each)

Four scoring items, 100 points max, **60 or above advances to the next gate**:

1. **Is there enough to write** (hard gate): does the game have enough mechanics, items, and bosses to write guides for? Pure match-three mini-games have no guide demand — eliminate outright.
2. **Is there popularity evidence**: comment counts, subscriber counts, concurrent players; is the author still updating (still updating = a longer window)?
3. **Will players search**: when players want a guide, will they search "game name + wiki / guide / codes"?
4. **Is English content missing**: few English guides is both popularity evidence and your opportunity.

## Gate 3: Confirm people really search (the most important gate)

Open [Google Trends](https://trends.google.com), click "Compare", and enter two terms: `your game name codes` and a baseline term whose heat you roughly know (don't know one? Use `roblox codes` — it's a perennial big term).

Read the curve: **your game's line must be going up to be worth building.** The best move is to copy the curve data and feed it to your AI for judgment (prompt at the end of this chapter).

A common trap: huge YouTube views but no Trends searches — viewers watch on YouTube and leave; they never come searching for guides.

**Two-source rule**: popularity evidence must come from at least two unrelated places (e.g. Trends + YouTube). If only one source is hot, watch it for a week before deciding.

## Gate 4: Check how crowded Google's results page is (2 minutes, hard veto)

Google `game name wiki` and `game name codes`, and read page one:

| What you see | Verdict |
|---|---|
| Fewer than 10 results, or mostly PDFs, forum threads, YouTube videos | Open seats — **build now** |
| A [Fandom](https://www.fandom.com) (an old wiki site) exists, but the content is thin and updates are slow | Winnable — take its spot with fuller content |
| [Fandom](https://www.fandom.com) or [Game8](https://game8.co) (a pro gaming site), thick content and daily updates | **Drop it, next candidate** |

One more signal that's easy to miss: **a full page one ≠ no room**. Check whether those results actually answer what the player came to search for — if the whole page answers a different question (intent mismatch: players want nostalgia, page one is all gameplay min-maxing), a page that answers the real question can push past sites that merely "know the keywords". How to check, plus a real-world case, is in the "intent fit" section of [`docs/sourcing.md`](https://github.com/PNGTRID/AnvilWiki/blob/main/docs/sourcing.md).

## Let AI run the four gates for you (recommended)

Organize the materials below and feed them to an AI (ZCode / Claude Code / Codex — any one; the ChatGPT web app works too). **Replace everything inside `<>` with yours, then copy and send the whole block**:

```text
You are a game wiki selection analyst. Evaluate through the four-layer funnel: discovery → scoring → demand validation → competition validation.
**Input:**
Game name: <game name>
Google Trends data: <paste the comparison of "{game name} codes/wiki" vs your baseline term>
Top 10 Google results: <paste the result lists for "{game name} wiki" and "{game name} codes">
Other signals: <YouTube views / Roblox concurrent players / community discussion>
**Task:**
1. Scoring table (0-100, ≥60 passes): wiki content depth (hard gate, eliminate outright if insufficient) / social proof / title searchability / English content
2. Demand validation: is the Trends curve genuinely rising; is the two-source rule met (two independent sources such as Trends + YouTube)
3. SERP opening: fewer than 10 results or mostly PDFs/forums/YouTube = an opening, build immediately; thick daily-updated Fandom = drop it
4. Verdict: build / winnable / drop / watch for a week, with a paragraph of reasoning
Analysis only — do not write any files.
```

Note the last line, "Analysis only — do not write any files" — at the selection stage the AI only gives advice; it never touches your repo.

## Produce your "first-day 10 pages" list

Once you decide "build", immediately have the AI turn the verdict into a day-one writing plan:

```text
Based on the selection verdict, plan the first-day 10 pages. Game name: <game name>; verified search terms: <list>.
Priority: codes → beginner guide → 3 boss guides → tier list → how-to-redeem FAQ → pages for the Top 3 window terms.
Output a table: priority / page / slug / category / suggested title / target keyword / materials I need to provide.
Mark pages lacking data as "waiting on my input" and ask me with a clear list. Plan only — do not produce pages.
```

Why does the codes page rank first? Because it pulls the most traffic, and players assume it updates daily, so they come back again and again. The full order:

1. Codes page (player favorite, repeat visits)
2. Beginner guide (a newcomer's first search)
3. to 5. Guides for the three most important bosses
6. Tier list (must-read for players who want to get stronger)
7. A "how to redeem codes" FAQ page
8. to 10. Pages for the three highest-volume terms you verified during selection

## If you get stuck

- **"I don't know which game has potential"**: go back to Gate 1 and spend 10 minutes on each of the four sources — quantity first, quality later.
- **"Two games both score above 60 — which one?"**: pick the one with the emptier Google results page. An open SERP is worth more than heat.
- **"I can't read Trends"**: look at one thing only — is your game's line above or below the baseline, and is it rising or falling. Rising = people search.
- **"I still can't decide"**: the default move is to drop it and look at the next candidate. Remember the two-day limit.

## ✅ Acceptance criteria (all must hold)

- You can say it off the top of your head: which game, why (which two pieces of popularity evidence), what the competition looks like (the shape of the results page)
- You hold a 10-row writing list, each row with a title and a target search term
- ☐ From starting selection to making the decision took no more than 2 days

## Next step

The game is chosen and you still have nothing — the next chapter spends 30 minutes installing 6 tools (a one-time install, yours forever), and the chapter after that gets a working site onto your computer. [Go to Chapter 2 · Before You Set Off: Install the 6 Tools](/landing/docs/install-tools)
