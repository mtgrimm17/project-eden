# Project Eden — design

**Status: concept locked (v0.0.3). Week-1 slice defined below.** Working title TBD.

## One sentence

A generational parenting roguelike: keep yourself and your baby alive one frantic 60-second year
at a time, then take over as the kid you raised, inheriting every shortcut you took.

## Pillars

1. **Prioritise under pressure.** Overcooked, not Sims. Many simultaneous tasks, not enough time.
2. **Short-term gain, long-term loss.** Every shortcut (junk food, skipping quiet time, ignoring
   the baby) is faster now and quietly lowers a maximum for the rest of a life.
3. **You become what you raised.** The handoff to the kid at 18 is the payoff. Their bars, maxima
   and traits are the parenting you did.
4. **The narrator is the tone.** A GLaDOS-style AI observer analysing human parenting with
   sarcastic omniscience. Better writing than the examples here; same register.

## Time

- **One round = one year = up to 60 seconds.** The round ends (you sleep) when stamina hits 0.
- **Stamina is seconds per round.** Max stamina is 100 at 18 and decays with age (roughly 50 at 58);
  decisions and mini-game performance change the decay rate. At 18 you can do everything; at 58
  you must choose.
- **A run starts at age 18.** You become a parent at a narrator-driven moment somewhere between
  18 and 40 (influenced by stats, history, genealogy). Everyone has a child by 40.
- **Handoff:** when the child turns 18 you take over as them, whatever your age (36 to 58).
- **Run ends when the lineage dies out.** Roguelike meta-progression: permanent unlocks help the
  next run get further.

## The two phases of a life

**Pre-baby (18 → baby arrives): investment.** This is the only time you can *raise* your maxima:
work out, cook properly, read, sleep well, "work on yourself as a human." Every year spent here
makes you a better-equipped parent (higher maxima, better mini-game baselines, maybe a positive
trait) but costs stamina you will never get back, because stamina decays every year regardless.
These years are precious: an 18-year-old parent is thrown straight into parenting with whatever
their own parents left them.

**Parenting (baby → kid turns 18): maintenance under load.** Maxima can only be held or lost.
Your job is to keep two sets of bars up with a shrinking number of seconds per year. Being older
means more efficient (higher maxima, better baselines) but more tired (fewer seconds).

The narrator-driven arrival of the baby can cut the investment phase short. The player never
fully controls when, only influences it, so "how long do I build before it happens?" is a
live tension rather than a menu choice.

Design rule: anything that raises a maximum exists only in the pre-baby phase. Anything in
the parenting phase, at best, preserves one.

## Resources (same three icons for everyone)

Each resource has a **current** value and a **maximum**. Maxima are where the long-term damage lives.

| Icon | Resource | Drains | Refills via | Max shrinks when |
|---|---|---|---|---|
| ⚡ | Stamina | 1/sec during a round | Sleep (round end) | Age; bad decisions; poor mini-game performance speed up decay |
| ❤ | Hunger / health | Per second | Eating. Junk food fills fast but lowers max (you get hungry sooner) | Junk food; hitting 0 is lethal |
| 🧠 | Sanity | Per second under load | Quiet time: read, shower, sit. | For every second at 0, max drops by 1 |

Reigns rule: too low **or sometimes too high** on a bar can hurt (e.g. sanity maxed = complacent).

**Baby** has the same three bars with its own maxima. Neglect lowers the baby's maxima for life.
Those reduced maxima, plus traits, are what you inherit at the handoff.

## Traits

- Earned by neglect or excellence in specific mini-games over childhood (e.g. skipping the
  glasses mini-game → *Myopic*: vision-based mini-games are blurrier).
- **Permanent for that generation.**
- **Some are trade-offs**: a debuff can carry a hidden upside (*Anxious*: sanity drains faster,
  but tasks appear on the HUD earlier). This is where "builds" come from.
- Visible on a family-tree screen with portraits that change (glasses appear, posture changes).

## Failure

- **Parent dies before the kid is 18** (hunger/health hits 0 against a shrunken max).
- **Kid is non-viable at 18** (enough neglect that they can't function; narrator has a field day).

## Space

- Top-down house. You walk between stations; travel time is the Overcooked tension.
- Stations host mini-games. The baby's stations and your stations compete for the same seconds.

## Mini-games

Two sizes, both inside the 60-second round:

- **Micro (≈5s)**: WarioWare inputs. Mash, tap in time, drag to spot, hold steady.
- **Short skill (15–30s)**: trace a shape, rhythm sequence, steady-hand, sort/stack.

Performance maps to an outcome (cleanliness, fed amount, sanity gained) and, over time, to traits.
Parent condition changes the **rules** of a mini-game, not just scoring: low sanity = shaky cursor,
*Myopic* = blur, low stamina = slower inputs.

Mini-game list, traits table and narrator lines live in `src/data/` as JSON so designers and
writers own them.

## Narrator

An AI observer. Comments on choices in real time, in an observation capacity:
"Is taking a shower right now the *most* important thing you could be doing?" (baby crying).
Lines are data (`src/data/narrator.json`) keyed by situation; writers own the file.

## Week-1 slice (end of week 1)

Prove the moment-to-moment: **one 60-second round, a house, three mini-games, three bars, the
narrator.** No baby yet.

- Walkable house with 3 stations (fridge, shower, bookshelf), each a mini-game. At least one
  station must *raise* a maximum (e.g. cooking properly raises hunger max) so the investment
  phase is felt in the slice.
- Three bars with current/max; junk-vs-real food lowers hunger max; sanity at 0 erodes its max.
- Round ends at stamina 0 → results screen → next year (stamina max slightly lower).
- Narrator fires 10–15 lines on triggers (idle, ignored bar, bad choice, round end).
- Flat Mini-Metro-style palette: shapes, strong colour, motion. No pixel art.

## Open questions

- Working title.
- Does the baby appear on the same map (crib station) or in its own room?
- How many mini-games for launch (first guess: 12 micro + 6 short).
- Which meta-unlocks (house upgrades? starting traits? narrator personalities?).
- Partner: present as an NPC/task source, or off-screen?
