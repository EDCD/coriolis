# Coriolis Alpha — Old-Link Compatibility Test Plan

## Goal
Verify that build links created on the **live** site (which does **not** have our changes) still open correctly on the **alpha** site (which does), for every ship we modified. The critical behaviour: an old link is *positional* against the ship's old slot layout; on alpha, ships whose internal layout changed must **migrate** old links so each module lands in its original slot and genuinely-new slots come up **empty**.

## How the test works (read first)
1. On **live** (`https://coriolis.io/`), build the ship exactly as described below.
2. Copy the **short build link** (the `?code=...` outfit URL — the normal "export > link"/address-bar URL, **not** a detailed JSON export).
3. Paste that same URL into the **alpha** site, swapping only the domain (keep the `/outfit/<ship>?code=...` part identical).
4. Compare the two builds slot-by-slot against the **Expected on alpha** column.

> A live link starts with a digit or `A` (v1/v2). Alpha re-saves it as `B` (v3). That's expected — the point is that the *decoded build* is correct, not that the string matches.

## Two things every ship must pass
- **No module lands in the wrong slot** (nothing shifted up/down).
- **No module silently dropped** (count of fitted modules identical live vs alpha).

To make shifts obvious, use **distinct, identifiable modules in each slot** (different classes/ratings/groups) rather than filling everything with identical cargo racks. A rack in the wrong slot looks the same as a rack in the right slot; a Fuel Scoop vs a Shield Gen vs an SCB does not.

---

## GROUP A — Layout changed → migration path (the real risk)
These four ships gained/re-sized internal slots. **This is where a bug would show.** Fill **every** old internal slot with a *different* module so any mis-placement is visible, then confirm on alpha that each module is in the predicted slot and the new slot(s) are empty.

Legend: slots listed top-to-bottom as they appear in the outfitting internal list. "c6" = class-6 size. On alpha, a **[NEW]** marks a **genuinely new, must-be-empty** slot.

### A1. Type-6 Transporter (`type_6_transporter`)
Change: **+1 new Size-6 slot at the top.** Old = 9 internals, alpha = 10.

Build on LIVE (old 9-slot layout, top->bottom), using distinct modules:

| Old slot | Fit this (distinct) |
|---|---|
| c5 | Cargo Rack 5E |
| c5 | Shield Generator 5A |
| c4 | Fuel Scoop 4A |
| c4 | Cargo Rack 4E |
| c3 | Hull Reinforcement 3D |
| c2 | Shield Cell Bank 2A |
| c2 | Cargo Rack 2E |
| c1 | Detailed Surface Scanner |
| c1 (PAS) | Planetary Approach Suite (default) |

Expected on ALPHA (10-slot layout):

| Alpha slot | Must contain |
|---|---|
| c6 [NEW] | **EMPTY** (new slot) |
| c5 | Cargo Rack 5E |
| c5 | Shield Generator 5A |
| c4 | Fuel Scoop 4A |
| c4 | Cargo Rack 4E |
| c3 | Hull Reinforcement 3D |
| c2 | Shield Cell Bank 2A |
| c2 | Cargo Rack 2E |
| c1 | Detailed Surface Scanner |
| c1 (PAS) | Planetary Approach Suite |

### A2. Type-7 Transporter (`type_7_transport`)
Change: **+2 new slots — a Size-7 at the very top AND a 4th Size-6.** Old = 11 internals, alpha = 13. (The Size-7 and the extra Size-6 are the new ones.)

Build on LIVE (old 11-slot layout, top->bottom):

| Old slot | Fit this |
|---|---|
| c6 | Cargo Rack 6E |
| c6 | Shield Generator 6A |
| c6 | Fuel Scoop 6A |
| c5 | Cargo Rack 5E |
| c5 | Hull Reinforcement 5D |
| c5 | Shield Cell Bank 5A |
| c3 | Fuel Scoop 3A |
| c3 | Cargo Rack 3E |
| c2 | Detailed Surface Scanner |
| c1 | Cargo Rack 1E |
| c1 (PAS) | Planetary Approach Suite |

Expected on ALPHA (13-slot layout):

| Alpha slot | Must contain |
|---|---|
| c7 [NEW] | **EMPTY** (new) |
| c6 [NEW] | **EMPTY** (new) |
| c6 | Cargo Rack 6E |
| c6 | Shield Generator 6A |
| c6 | Fuel Scoop 6A |
| c5 | Cargo Rack 5E |
| c5 | Hull Reinforcement 5D |
| c5 | Shield Cell Bank 5A |
| c3 | Fuel Scoop 3A |
| c3 | Cargo Rack 3E |
| c2 | Detailed Surface Scanner |
| c1 | Cargo Rack 1E |
| c1 (PAS) | Planetary Approach Suite |

> Watch this one closely: **both** new slots sit at the **top** — the new c7 then the new c6, both empty. The three c6 modules must come **after** the empty c6 (positions 3-5), NOT at the top of the c6 band. (Frontier inserts new slots at the front of each size band as Slot00_SizeN.)

### A3. Imperial Clipper (`imperial_clipper`)
Change: **+1 new Size-7 slot** (as the *second* internal). Old = 10 internals, alpha = 11. Also note a **core** change: the Fuel Tank core slot went Size-4 -> Size-5 (that's a standard/core slot, not internal — verify its size on alpha but it won't shift internals).

Build on LIVE (old 10-slot layout, top->bottom):

| Old slot | Fit this |
|---|---|
| c7 | Cargo Rack 7E |
| c6 | Shield Generator 6A |
| c4 | Fuel Scoop 4A |
| c4 | Cargo Rack 4E |
| c3 | Hull Reinforcement 3D |
| c3 | Cargo Rack 3E |
| c2 | Shield Cell Bank 2A |
| c2 | Cargo Rack 2E |
| c1 | Detailed Surface Scanner |
| c1 (PAS) | Planetary Approach Suite |

Expected on ALPHA (11-slot layout):

| Alpha slot | Must contain |
|---|---|
| c7 [NEW] | **EMPTY** (new slot) |
| c7 | Cargo Rack 7E |
| c6 | Shield Generator 6A |
| c4 | Fuel Scoop 4A |
| c4 | Cargo Rack 4E |
| c3 | Hull Reinforcement 3D |
| c3 | Cargo Rack 3E |
| c2 | Shield Cell Bank 2A |
| c2 | Cargo Rack 2E |
| c1 | Detailed Surface Scanner |
| c1 (PAS) | Planetary Approach Suite |

> Key check: the **new** c7 is at the **top** (slot 1) and must be empty; your existing c7 Cargo Rack drops to slot 2. The game's new slot is `Slot00_Size7` (front of the band), so it leads. The c6 Shield Gen follows in slot 3.

### A4. Federal Dropship (`federal_dropship`)
Change: **+1 new Size-6 slot** (as the *second* internal). Old = 11 internals, alpha = 12. Note two **Military** slots (c4) in the middle — fit those too.

Build on LIVE (old 11-slot layout, top->bottom):

| Old slot | Fit this |
|---|---|
| c6 | Cargo Rack 6E |
| c5 | Shield Generator 5A |
| c5 | Cargo Rack 5E |
| c4 | Fuel Scoop 4A |
| c4 (Military) | Hull Reinforcement 4D |
| c4 (Military) | Module Reinforcement 4D |
| c3 | Cargo Rack 3E |
| c3 | Shield Cell Bank 3A |
| c2 | Cargo Rack 2E |
| c1 | Detailed Surface Scanner |
| c1 (PAS) | Planetary Approach Suite |

Expected on ALPHA (12-slot layout):

| Alpha slot | Must contain |
|---|---|
| c6 [NEW] | **EMPTY** (new slot) |
| c6 | Cargo Rack 6E |
| c5 | Shield Generator 5A |
| c5 | Cargo Rack 5E |
| c4 | Fuel Scoop 4A |
| c4 (Military) | Hull Reinforcement 4D |
| c4 (Military) | Module Reinforcement 4D |
| c3 | Cargo Rack 3E |
| c3 | Shield Cell Bank 3A |
| c2 | Cargo Rack 2E |
| c1 | Detailed Surface Scanner |
| c1 (PAS) | Planetary Approach Suite |

> Key checks: (1) the **new** c6 is at the **top** (slot 1) and must be empty; your Cargo Rack 6E drops to slot 2 (`Slot00_Size6` leads the band). (2) the two **Military** slots must still hold the HRP + Module Reinforcement — a mis-map could drop a Military module into a normal slot or lose it entirely.

---

## GROUP B — Added a utility (hardpoint) slot
### B1. Asp Scout (`asp_scout`)
Change: **+1 utility mount** (2 -> 3) **and** a stock-speed bump (base speed, affects displayed top speed only). Internal layout **unchanged**.

Build on LIVE: fill **both** existing utility slots with **distinct** utilities (e.g. Shield Booster 0A in util-1, Heat Sink Launcher in util-2) and put something in each hardpoint (2x Medium, 2x Small) so you can see nothing shifts.

Expected on ALPHA:
- Both utilities stay exactly where they were (util-1 Shield Booster, util-2 Heat Sink).
- A **third, empty** utility slot appears.
- Hardpoints unchanged.
- Stock hull (no modules) displayed **top speed ~= 282**, boost ~= 362 (will differ from live's ~223 — that's the intended rebalance, not a link bug). Build an empty-hull Asp Scout on each site to eyeball this.

---

## GROUP C — Stats-only changes (no slot movement)
For these, the link should decode **identically** — same modules, same slots. The only differences are the rebalanced **numbers** (shield/armour/mass/speed/flight-model), which are data changes, not link behaviour. For each: build any loadout on live, open on alpha, confirm **every module is in the same slot**, then note the stat deltas match what we changed.

| Ship | What to eyeball changed on alpha | Expected |
|---|---|---|
| **Sidewinder** (`sidewinder`) | Base shield; pitch/roll/yaw | Shield 40->55 base; rotation 43.21/110.54/17.08 |
| **Eagle** (`eagle`) | Base shield | 60->80 base |
| **Viper Mk IV** (`viper_mk_iv`) | Base shield; pitch/roll/yaw | Shield 150->160; rotation 33.20/90.54/13.08; speed ~unchanged |
| **Federal Dropship** (also Group A) | Hull mass; stock top speed | Mass 580->500; displayed top speed ~204 (was ~183) |
| **Imperial Clipper** (also Group A) | Hull mass; base shield; fuel-tank core size | Mass 400->350; shield 180->200; Fuel Tank core now Size-5 |
| **Type-6** (also Group A) | Base shield | 90->125 |
| **Type-7** (also Group A) | Hull mass; heat capacity | Mass 350->300; heat 226->232 |
| **Mandalay** (`mandalay`) | Hull mass; max jump range | Mass 230->190; max jump range up accordingly |
| **Caspian Explorer** (`explorer_nx`) | Hull mass; max jump range | Mass 950->825; max jump range up |

> Group C ships have **no layout change**, so a correct link opens pixel-identical in terms of slots. If any module moves slot on these, that's a regression (shouldn't happen — they don't use the migration path).

---

## GROUP D — New ship (no live equivalent)
### D1. Anaconda Mk II (`anaconda2`)
Does **not exist on live**, so there's no old link to migrate. Instead:
- On **alpha**, build it, copy its link, open in a **new alpha tab** -> must round-trip identically (self-consistency).
- Confirm stock defaults match the in-game screenshot loadout (shield ~= 268.7, armour ~= 1341, cargo 208) and that the Military/Cargo named slots and ablative bulkheads are present.

---

## Also worth a spot-check: an UNCHANGED ship
Pick one ship we did **not** touch (e.g. **Python** or **Anaconda Mk I**), build it on live, open on alpha. Everything must be identical — slots and stats. This confirms the v1/v2->v3 link upgrade itself didn't regress the common path.

---

## Results checklist (per ship)
- [ ] Link from live opens on alpha without error
- [ ] Every fitted module present (same count)
- [ ] Every module in the **predicted** slot
- [ ] New slots (Group A [NEW]) are **empty**
- [ ] Named slots (Military/Cargo/PAS) intact (Group A)
- [ ] Stat deltas match the intended rebalance (Group C)
- [ ] Re-exporting on alpha and re-opening round-trips cleanly

## If something fails
Capture: the **ship**, the **exact live `?code=` link**, and **which slot** is wrong (expected vs actual). The migration logic lives in `src/app/shipyard/LinkMigration.js` (`OLD_INTERNAL_LAYOUTS` + the remap); a wrong result almost always means an entry in `OLD_INTERNAL_LAYOUTS` doesn't match what live actually produced, or a new slot's kind/class doesn't match its intended old slot.
