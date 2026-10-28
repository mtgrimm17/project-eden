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

- **One human ≈ 10 minutes of play.** 0–5 minutes pre-kid, then 18 years (~10 min) of parenting.
- **One round = one year.** The round ends (you sleep) when stamina hits 0.
- **Stamina is seconds per round.** Max stamina is ~40 at 18 and decays with age (~20 at 58);
  decisions and mini-game performance change the decay rate. At 18 you can do everything; at 58
  you must choose. Two or three 10–15s mini-games fit in a young year; one in an old one.
- Open: at this scale, 0–5 min pre-kid means the baby arrives by about age 26, not 40. Either
  accept that, or make a round represent more than one year pre-kid (`yearsPerRound`).
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

## Core loop (v0.0.6): Overcooked with two hands

Mini-games are gone. The 6 seconds of fun is Overcooked's: walk, carry, use stations, route
yourself under time pressure, except you have **two hands and a baby**.

**Verbs.** Each hand: *grab*, *drop*, *throw*. There is no "use": using something is dropping it
in the right place. Appliances work on their own (drop a cold bottle in the microwave, come back
for a warm one; dishes wash in the sink). Hand-to-hand combos just happen: baby in one hand plus
a warm bottle in the other feeds over a few seconds *while you keep walking*; baby plus clean
diaper changes.

**Controls.** Mouse left button = left hand, right button = right hand. Press grabs (instant).
With something in hand, release in place drops it (into the container you're next to, or the
floor); move the cursor then release throws it to where the cursor is. No timing threshold: the
release is the action. Keyboard fallback: Q/J grab-drop, E/L throw facing. Gamepad: LB/RB with
right-stick aim. Literal juggling of objects is the game.

**The baby is a thing in a hand.** Carrying it: soothes, keeps it out of trouble, halves your
hands (two-handed items like dishes need both hands), slows you, and every second carried is
recorded: too much carrying stunts physical development, and the kid you play next moves slower.

**Attention and the three childhoods** (`balance.json` → `baby.phases`, every number tweakable).
The kid has a need for attention that rises from 0 to 1 while it isn't held, shown as its colour
going green → yellow → red. Picking it up resets it to 0; walking past it pats it down a little
(once every few seconds). At red, what happens depends on the phase:

| Years | Phase | Moves | When red |
|---|---|---|---|
| 1 | baby | no; stays where you leave it | cries until picked up |
| 2–3 | toddler | slowly, wandering, dropping toys | heads for the nearest hazard (microwave, dishwasher, bin, stairs) and cries on arrival |
| 4–6 | kid | fast | climbs and jumps off something climbable (cries), or tips the bin: trash everywhere (cries) |

Crying spawns a soothe ticket and costs score per second until the kid is picked up. So the
persistent game under the chores is *paying attention*: a pat on the way past is cheap, a pickup
is a full reset but fills a hand, and ignoring the colour is what causes the disasters.

**Mess.** Three kinds, each with a home: toys → toy box, clothes → hamper, trash → bin. Anything
on the floor costs score per second. Throwing clears mess from range, at the risk of hitting the
baby (crying + a soothe demand) or a hazard (penalty; later: fire).

**Demands** arrive as tickets with timers: feed (fridge → microwave → baby), change (shelf →
baby → bin), soothe (carry), dishes (table → sink → cupboard). Expired baby tickets make the baby
cry, which costs score every second until the need is met.

**Years are 30 seconds and roll over in place.** No results screen; a pane slides in on the right
with the year's stars, the numbers the kid will inherit, and anything new that just unlocked.

**The ramp is the kid growing up.** Everything has a `fromYear` in `house.json` / `balance.json`:

| Year | New |
|---|---|
| 1 | fridge → microwave → feed; empty bottle → dishwasher; soothe by carrying |
| 2 | diapers, bin, change |
| 2 | toddler phase: roams, hazards matter |
| 3 | toy box, stairs |
| 4 | kid phase: fast, climbs/tips |
| 4 | dishes on the table → dishwasher → cupboard, counter |
| 5 | clothes → hamper, trash → bin |

Reorder by editing the numbers. Year 1 must be compelling on its own with just the bottle loop.

Performance maps to an outcome (cleanliness, fed amount, sanity gained) and, over time, to traits.
Parent condition changes the **rules** of a mini-game, not just scoring: low sanity = shaky cursor,
*Myopic* = blur, low stamina = slower inputs.

Mini-game list, traits table and narrator lines live in `src/data/` as JSON so designers and
writers own them.

## Narrator (parked)

An AI observer in the GLaDOS register. **Removed from the slice**: text at the bottom of the
screen doesn't land; it only works as voice. `src/narrator/Narrator.js` and
`src/data/narrator.json` stay in the repo, unwired, for when there's audio narration.

## Week-1 slice (end of week 1)

Prove the 6 seconds: **one room, two hands, the baby, four demand chains, throwing, herding,
mess, continuous 90-second years.** No bars, no generations, no pre-baby phase yet; those
return once the loop is fun on its own.

- Flat Mini-Metro-style palette: shapes, strong colour, motion. No pixel art. Crisp text (DPR).
- Exit: someone plays three years without being told the controls twice, and wants a fourth.

## Open questions

- Working title.
- Does the baby appear on the same map (crib station) or in its own room?
- How many mini-games for launch (first guess: 12 micro + 6 short).
- Which meta-unlocks (house upgrades? starting traits? narrator personalities?).
- Partner: present as an NPC/task source, or off-screen?
