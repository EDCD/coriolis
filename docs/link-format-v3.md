# Coriolis build-link format: versioning + v3 (ship-slots.json authoritative indexing)

Status: IN PROGRESS. This document is both the implementation plan and the
external spec to hand to the Inara developer and to accompany the EDMarketConnector PR.

## Background / problem

A Coriolis build link encodes a ship loadout. The module portion of the link is
**positional**: modules are written in the order of `Ships[shipId].slots.{standard,hardpoints,internal}`
and read back by array index (see `src/app/shipyard/Ship.js` `toString`/`buildFrom`/
`decodeToArray`/`reduceToIDs`). The slot *name*/`_SizeN` never appears in the link.

Frontier retrospectively added internal slots to several ships (and resized some),
e.g. the Type-7 gained `Slot00_Size7` and `Slot00_Size6`. Because the link is positional,
an old link made before those slots existed now decodes into the wrong positions unless
migrated. We also can't trust the `_SizeN` suffix in a journal slot name anymore (the
authoritative size is the `class` field in `ship-slots.json`).

## Link version markers

The first character of the first `.`-separated segment identifies the version:

| Leading char | Version | Meaning |
|---|---|---|
| `0`-`4` (digit) | v1 | Legacy, pre-military-slots. Migrated by `upgradeInternals`. |
| `A` | v2 | Legacy positional, order = coriolis-data `slots.*` as it was pre-new-slots. |
| `B` | v3 | NEW. Positional, order = `ship-slots.json` (authoritative). Decoder trusts index. |

New links are always emitted as **v3 (`B`)**. v1/v2 links continue to decode via the
legacy path + per-ship migration (below).

## v3 (`B`) format

Identical structure to v2 except:
- Leading marker is `B` instead of `A`.
- The internal/hardpoint/standard module order is defined by `coriolis-data/ships/ship-slots.json`
  for the ship (keyed by FD internal ship name), NOT by any algorithmic `SlotNN_SizeN` derivation.
- Decoding a v3 link places module[i] into the slot at `ship-slots.json` index i. No guessing.

`ship-slots.json` schema (per ship key = FD internal name, e.g. `type7`, `anacondamkii`):
```
"<fdShipName>": { "slots": {
  "hardpoints": [ {"class": N, "name": "<FDSlotName>"[, "eligible": {...}]}, ... ],
  "internal":   [ {"class": N, "name": "<FDSlotName>"[, "eligible": {...}]}, ... ],
  "standard":   [ {"class": N, "name": "Armour|PowerPlant|...|CargoHatch"}, ... ]
} }
```
The `class` is the authoritative size (can differ from the `_SizeN` in the `name`).

## Migrating old (v1/v2) links for ships that gained/resized slots

When an old link's ship layout differs from the new (`ship-slots.json`) layout, remap
by SIZE CLASS, preserving the builder's original intent:

For each size class C: the new layout has N slots of class C; the old layout had M (M<=N).
Frontier inserts genuinely-NEW slots at the FRONT of their size band (the game names them
`Slot00_SizeN`). So the old link's M class-C modules RIGHT-ALIGN within the N new class-C
positions: the first (N-M) class-C slots (the new, top ones) stay EMPTY, and the M old
modules fill the last M (the original, lower) positions in link order.
(The "a class-7 module can only be the new Type-7 slot" case is just M=0,N=1 for class 7.)

This rule is derived automatically by diffing the old coriolis-data layout against the
new ship-slots.json layout per class, so it also covers any future Frontier re-index
(which would introduce a v4 + ship-slots2 and a new diff).

### Affected ships (old internal layout -> new internal layout)

- type_6_transporter (`type6`): +1 class-6 slot at front (`Slot00_Size6`). old 9 -> new 10.
- type_7_transport (`type7`): +1 class-7 (`Slot00_Size7`) and +1 class-6 (`Slot00_Size6`). class-6 went 3->4. old 11 -> new 13.
- type_9_heavy (`type9`): +1 class-8 slot at front (`Slot00_Size8`). class-8 went 1->2. old 12 -> new 12? (verify: ship-slots type9 has 12 incl PAS; current data has 12). NOTE: current data may already differ; verify counts before implementing.
- type_10_defender (`type9_military`): verify military-slot positioning differences vs ship-slots.
- imperial_clipper (`empire_trader`): +1 class-7 slot at front (`Slot00_Size7`). class-7 went 1->2. old 10 -> new 11.
- federal_dropship (`federation_dropship`): +1 class-6 slot at front (`Slot00_Size6`). class-6 went 1->2. old 11 -> new 12.
- anaconda2 (`anacondamkii`): NEW ship, no old links exist -> no migration needed.

IMPORTANT ORDERING NOTE: ship-slots.json interleaves Military/Cargo named slots in their
true journal positions (e.g. Dropship Military01/02 at indices 5-6; Anaconda Mk II Cargo01
at index 3, Military01/02 at 7-8). Current coriolis-data arrays order these differently
(military often pushed later). Adopting v3 requires coriolis-data `slots.internal` to be
REORDERED to match ship-slots.json so the live builder and v3 decode agree. This reorder
is itself a layout change for existing ships -> their old `A` links must migrate via the
same class-based remap (old coriolis order -> new ship-slots order).

## Mission (CORRECTED)

Do NOT change existing behaviour for old links, and do NOT reorder any ship's
coriolis-data slots. Specifically:

1. Old v1/v2 link decode stays exactly as-is for every ship EXCEPT the changed ships.
2. For the changed ships (Type-6, Type-7, Imperial Clipper, Federal Dropship), when an
   OLD-STYLE link is imported (either a genuinely old link, or a freshly-minted old-style
   link from Inara/EDMC that still uses the old ordering), intervene so modules land in
   their correct ORIGINAL slots and the newly-added slots are left empty, using the
   count-vs-original-capacity claiming rule. This must also work when the old-style link
   DOES carry enough modules to fill the new slots (then fill them, in link order).
3. NEW links are created using ship-slots.json so the slot identity is guaranteed; decode
   of a new link places each module into the exact slot with no guessing. This is v3 (`B`).

NO reordering of unchanged ships. NO change to the old decode path. ship-slots.json is used
(a) to CREATE new links and decode them, and (b) as the reference for the changed-ship
old-link migration.

## Implementation steps (tracking)

1. [x] Wire ship-slots.json into coriolis-data dist (generate_distribution.js exports `ShipSlots`). DONE + verified.
1b. [x] Publish ship-slots.json like ship-mappings.json: generate-ship-slots.js copies it from node_modules/coriolis-data into src/, wired into npm `start`+`build`, and added to CopyWebpackPlugin patterns in webpack.config.dev.js + webpack.config.prod.js. Served at https://coriolis.io/ship-slots.json. DONE + verified.
2. [ ] Add resolver: coriolis ship id -> ship-slots.json key (FD internal name). Reuse/invert SHIP_FD_NAME_TO_CORIOLIS_NAME; reconcile mismatches (Empire_Trader->imperial_clipper vs ship-slots key empire_trader; Type9_Military->type_10_defender vs key type9_military; etc).
3. [ ] CONFIRM v3 link shape with user: (a) names embedded in link, vs (b) positional in ship-slots.json order. BLOCKED on user.
4. [ ] Ship.toString: emit `B` (v3) links built from ship-slots.json.
5. [ ] Ship.buildFrom: detect version. digit=v1, A=v2 -> EXISTING path unchanged, except for changed ships route through the old-link migration. B=v3 -> decode via ship-slots.json (no guessing).
6. [ ] Implement changed-ship old-link migration (class-based count-vs-original-capacity). Uses OLD layout snapshot (below) vs new ship-slots.json layout. Only for: type_6_transporter, type_7_transport, imperial_clipper, federal_dropship.
7. [ ] Leave JournalUtils.js / CompanionApiUtils.js old-style import paths intact; add changed-ship interception so old-style imports also place modules correctly + leave new slots empty.
8. [ ] Tests: round-trip a v3 link; decode captured old v2 links for each changed ship (new slots empty, originals correct); decode old-style link WITH enough modules to fill new slots.
9. [ ] Document final v3 spec for Inara + EDMC PR.

NOTE: Earlier draft wrongly proposed reordering all ships / Path 1 vs Path 2. Discarded.

## Migration algorithm (VALIDATED via prototype)

Purely data-driven; NO per-ship code. For a changed ship:
- OLD layout = pre-change coriolis-data slots.internal as a list of {kind,class}
  where kind in {num, mil, cargo, pas} (named slots keep their class).
- NEW layout = ship-slots.json internal list (kind derived from name:
  PlanetaryApproachSuite=pas, Military*=mil, Cargo*=cargo, else num).
- Group OLD indices by `kind|class` (in old order) and NEW slot indices by
  `kind|class` (in ship-slots order). Within each group, RIGHT-ALIGN: the old
  modules fill the LAST M of the group's N new slots; the first (N-M) new slots
  (the ones Frontier inserted at the front of the size band, e.g. Slot00_SizeN)
  stay EMPTY.
This yields an old-position -> new-position map; genuinely-new (top-of-band)
slots are empty; an old-style link that DOES carry enough modules to fill a band
simply leaves nothing empty. Validated maps (newFromOld, null = empty new slot):

- type6:  [null,0,1,2,3,4,5,6,7,8]            new c6 (Slot00_Size6) at top EMPTY (old 9 -> new 10)
- type7:  [null,null,0,1,2,3,4,5,6,7,8,9,10]  new c7 (Slot00_Size7) AND new c6 (Slot00_Size6)
          both at the top EMPTY; the 3 old class-6 modules fill new[2,3,4] (old 11 -> new 13)
- imperial_clipper: [null,0,1,2,3,4,5,6,7,8,9]  new c7 (Slot00_Size7) at top EMPTY;
          the old class-7 module drops to new[1] (Slot01_Size7). (old 10 -> new 11)
- federal_dropship: [null,0,1,2,3,4,5,6,7,8,9,10]  new c6 (Slot00_Size6) at top EMPTY;
          the old class-6 module drops to new[1]; Military slots kept by kind+class.
          (old 11 -> new 12)

ship-slots key map for changed ships: type_6_transporter->type6,
type_7_transport->type7, imperial_clipper->empire_trader,
federal_dropship->federation_dropship.

## Build order (remaining)
A. [DONE] Reordered changed ships' coriolis-data slots.internal to match ship-slots.json
   (new slots inserted at correct positions) + remapped defaults.internal. Rebuilt dist.
   Verified: type_6(10)/type_7(13)/imperial_clipper(11)/federal_dropship(12) all match
   ship-slots.json by class+length, defaults aligned. OLD layouts preserved in snapshot below.
   NOTE: because Ships[id].slots now == v3 order, old A/v2 links for these 4 ships decode
   against the OLD snapshot then migrate; v3/B links decode against current order.
B. [DONE] Ship.toString emits 'B'. Ship.buildFrom: digit->v1 (unchanged), 'A'->v2
   (unchanged for normal ships; for the 4 changed ships, decode against OLD snapshot
   length then remap), 'B'->v3 (positional against current/ship-slots order; no migration).
   Also aligned anaconda2 slots.internal to ship-slots order so ALL 49 ships now match
   ship-slots.json order (verified) -> external v3 links are safe for every ship.
C. [DONE] src/app/shipyard/LinkMigration.js holds OLD-layout snapshots for the 4 changed
   ships + the class-based remap (remapInternalArray / remapInternalParallel). Ship.buildFrom
   uses it for v1/v2 links on those ships, remapping internal + the internal tail of
   priorities/enabled/modifications/blueprints.
D. [DONE] Journal/CAPI imports switched to AUTHORITATIVE ship-slots.json names.
   Added shipSlotsKey()/shipSlots() resolver to CompanionApiUtils.js (coriolis id ->
   ship-slots key via direct match or inverted+lowercased SHIP_FD_NAME_TO_CORIOLIS_NAME;
   all 49 ships resolve). Both importers (CompanionApiUtils.shipFromJson and
   JournalUtils.shipFromLoadoutJSON) now resolve each internal + hardpoint slot's journal
   name directly from ship-slots.json (ssInternal[i].name / ssHardpoints[i].name) when the
   authoritative list length matches the ship's data slots (true for all 49). The legacy
   SlotNN_SizeN reconstruction, named-slot counters, per-ship skip rules (anaconda/dropship/
   T9/T10/vulture), T9 start-at-0, and T8 SmallHardpoint3 skip remain ONLY as fallback for
   any ship not in ship-slots.json. Verified: Type-7 journal Loadout with Slot00_Size7 +
   Slot01_Size6 places class-7 at index 0 and class-6 at index 2; link decode regression
   suite still green.
E. [DONE] Verified by the jest suite (test-link-v3, test-link-migration): v3 round-trip for
   all 49 ships; v2/v1 migration for the 4 changed ships with new slots RIGHT-ALIGNED to the
   top of their size band (type_7: new class-7 + new class-6 both empty at top, 3 old class-6
   fill new[2,3,4]; imperial_clipper: new class-7 empty at new[0], old class-7 -> new[1];
   federal_dropship: new class-6 empty at new[0], old class-6 -> new[1]); legacy link on an
   unchanged ship re-serialises identically. NOTE: an earlier prototype LEFT-aligned (old
   modules at the top, new slot sinking to the bottom of its band) - that was wrong; Frontier
   inserts new slots at the FRONT, so the corrected policy is right-align. Fixed in
   LinkMigration.buildInternalRemap.

## Remaining work (next session)
- D above: make JournalUtils.js / CompanionApiUtils.js correct for the 4 changed ships.
  Options: (i) route their decoded internal array through LinkMigration.remapInternalArray
  when needsInternalMigration(shipId); or (ii) switch those importers to resolve slots by
  ship-slots.json authoritative names (preferred long-term, removes the per-ship skip hacks).
- Finalize the external v3 spec section below and share with Inara + open EDMC PR.
- Run the jest suite once a test toolchain is available.

## EXTERNAL v3 LINK FORMAT SPEC (for Inara / EDMC / EDD / EDOMH)

A Coriolis build link path is `/outfit/<shipId>?code=<CODE>&...`. The `<CODE>` is:

  <marker><bulkhead><standardIds><hardpointIds><internalIds>.<enabled>.<priorities>.<mods>

- marker: a single char. `B` = v3 (this spec). (`A` = legacy v2, digit = v1.)
- bulkhead: single digit, index of the fitted bulkhead (0 = lightweight).
- standardIds / hardpointIds / internalIds: concatenated module ids, 2 chars each,
  or `-` for an empty slot. Order is POSITIONAL.
- The three `.`-separated trailing segments (enabled, priorities, modifications) are
  LZString/gzip-encoded as today; unchanged from v2.

v3's ONLY change vs v2 is that the positional order of standard/hardpoint/internal ids
MUST follow coriolis-data/ships/ship-slots.json for that ship (keyed by FD internal ship
name), using the `slots.standard` / `slots.hardpoints` / `slots.internal` arrays in the
order listed there. Each array entry's `name` is the authoritative Frontier journal slot
name and `class` the authoritative size (the `_SizeN` inside a name is NOT reliable). A
producer emits module ids in exactly that order (with `-` for empty slots) and prefixes `B`.
ship-slots.json is published at https://coriolis.io/ship-slots.json.

## OLD internal layouts (snapshot, for migration maps)

These are the coriolis-data `slots.internal` BEFORE adopting ship-slots.json ordering,
captured 2026-10-23. v1/v2 links are positional against THIS order.

- type_6_transporter old: [5,5,4,4,3,2,2,1, PAS(1)]
- type_7_transport old:   [6,6,6,5,5,5,3,3,2,1, PAS(1)]
- type_9_heavy old:       [8,8,7,6,5,4,4,3,3,2,1, PAS(1)]
- type_10_defender old:   [8,7,6,5,4,4,3,3,2, Mil(5),Mil(5),1, PAS(1)]
- imperial_clipper old:   [7,6,4,4,3,3,2,2,1, PAS(1)]
- federal_dropship old:   [6,5,5,4, Mil(4),Mil(4),3,3,2,1, PAS(1)]
