# Coriolis CMDR API Documentation

Coriolis CMDR provides two APIs for third-party tools to send commander data. Both use the same API key (found on the user's dashboard at cmdr.coriolis.io) and the same authentication mechanism.

- **EDMC Plugin API** — For tools like EDMC that pre-process journal events into a structured schema. The client does the transformation.
- **Journal API** — For tools like EDD and EDDI that want to send raw journal entries as-is. The server does the transformation.

Both APIs can be used simultaneously by users, depending on their preference of tooling. Data from either API updates the same commander profile, ships, materials, and stored modules.

A sample app using the Journal API, written in Python, [can be seen here](https://github.com/Brighter-Applications/cmdr-coriolis-client)

---

## Authentication (both APIs)

Every request must include the CMDR's API key via the `X-Api-Key` header (preferred) or as a `Bearer` token in the `Authorization` header:

```
X-Api-Key: <api_key>
```

or

```
Authorization: Bearer <api_key>
```

`X-Api-Key` is recommended because some server configurations (e.g. Apache mod_wsgi) strip the `Authorization` header by default.

### User-Agent

All requests **must** include a custom `User-Agent` header identifying your application. Requests using default library user agents (e.g. `python-requests/2.31.0` or `Python-urllib/3.11`) will be rejected with a `403 Forbidden` response.

```
User-Agent: MyApp/1.0
```

### Full request example (curl)

```bash
curl -X POST https://cmdr.coriolis.io/api/journal/ \
  -H "X-Api-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -H "User-Agent: MyApp/1.0" \
  -d '{"cmdr": "CMDR Name", "entry": {"timestamp": "2026-05-01T16:47:37Z", "event": "Commander", "Name": "CMDR Name"}}'
```

### Full request example (Python)

```python
import requests
import json

API_KEY = "YOUR_API_KEY_HERE"
CMDR_NAME = "CMDR Name"

entry = {
    "timestamp": "2026-05-01T16:47:37Z",
    "event": "Commander",
    "Name": "CMDR Name"
}

response = requests.post(
    "https://cmdr.coriolis.io/api/journal/",
    headers={
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
        "User-Agent": "MyApp/1.0",
    },
    data=json.dumps({"cmdr": CMDR_NAME, "entry": entry}),
    timeout=15,
)

print(response.status_code, response.json())
# 200 {"ok": true, "processed": 1}
```

---

## Response Format (both APIs)

A successful request returns:

```json
{ "ok": true }
```

Errors return an appropriate HTTP status code with:

```json
{ "error": "Description of the problem." }
```

| Status | Meaning |
|--------|---------|
| 200    | Success |
| 400    | Malformed JSON or missing required fields |
| 401    | Invalid or missing API key |
| 500    | Server error |

---

# Journal API

**For tools that want to send raw journal entries without transformation.**

The Journal API accepts journal lines exactly as they appear in the game's journal files. The server handles all the transformation into the internal data model. This is the recommended API for tools like EDD and EDDI.

### Endpoint

```
POST https://cmdr.coriolis.io/api/journal/
```

### Request Format

All requests use `Content-Type: application/json`.

Send a single entry:

```json
{
  "cmdr": "CMDR Name",
  "entry": {
    "timestamp": "2026-05-01T16:47:37Z",
    "event": "Commander",
    "FID": "F11115555",
    "Name": "CMDR Name"
  }
}
```

Or send a batch of entries:

```json
{
  "cmdr": "HollowPointPC",
  "entries": [
    { "timestamp": "2026-05-01T16:47:37Z", "event": "Commander", "Name": "CMDR Name" },
    { "timestamp": "2026-05-01T16:47:37Z", "event": "Materials", "Raw": [...], "Manufactured": [...], "Encoded": [...] },
    { "timestamp": "2026-05-01T16:47:49Z", "event": "Loadout", "Ship": "python", "ShipID": 7, ... }
  ]
}
```

The `cmdr` field is required for attribution. The `entries` array can contain any number of journal events — unrecognised events are silently ignored.

### Tracked Events

The Journal API processes the following events:

| Event | What it does |
|-------|-------------|
| `Commander` | Creates/updates the commander profile (name) |
| `LoadGame` | Creates/updates the commander profile (name, credits) |
| `Loadout` | Creates/updates the current ship with full module loadout |
| `ShipyardSwap` | Marks the new ship as current |
| `StoredShips` | Updates the list of owned ships and their locations |
| `StoredModules` | Replaces the stored modules inventory |
| `Materials` | Replaces the full material inventory |
| `MaterialCollected` | Increments the count of a single collected material |
| `MaterialTrade` | Decrements the paid material and increments the received material |
| `EngineerCraft` | Updates engineering on the current ship's module |
| `Statistics` | Captures the Merc Coin balance from `Bank_Account.MercCoins_Current` |

All other events are silently ignored — you can safely send every journal line without filtering (but please don't, think of the bandwidth and server load).

> **Note on currencies.** Coriolis tracks two commander finances for the build shopping list: **credits** and **Merc Coin** (an operations currency earned from operations/missions, used to purchase and pre-engineer some modules — it is *not* a material). On the Journal API these are sourced from raw journal events:
> - **Credits** come from the `LoadGame` event's `Credits` field.
> - **Merc Coin** comes from the `Statistics` event's `Bank_Account.MercCoins_Current` field.
>
> `Statistics` fires infrequently (typically at session start and when finances change), so send it whenever the game emits it to keep the Merc Coin balance current.

### Response

```json
{
  "ok": true,
  "processed": 3
}
```

The `processed` count tells you how many of the submitted entries were actually handled (i.e. matched a tracked event). If any individual entries fail, they are reported in an `errors` array but don't prevent other entries from being processed. You should use this to determine whether you're sending the data the wrong way, or if you're sending events we don't want and adjust your service appropriately.

### Example: Sending a full session startup

When the game starts, the journal emits several events in quick succession. You can batch them all into a single request, which saves on I/O locally and bandwidth:

```json
{
  "cmdr": "CMDR Name",
  "entries": [
    { "timestamp":"2026-05-01T16:47:37Z", "event":"Commander", "FID":"F2692420", "Name":"HollowPointPC" },
    { "timestamp":"2026-05-01T16:47:37Z", "event":"Materials", "Raw":[ { "Name":"iron", "Count":158 } ], "Manufactured":[ { "Name":"salvagedalloys", "Name_Localised":"Salvaged Alloys", "Count":66 } ], "Encoded":[ { "Name":"bulkscandata", "Name_Localised":"Anomalous Bulk Scan Data", "Count":294 } ] },
    { "timestamp":"2026-05-01T16:47:37Z", "event":"LoadGame", "Commander":"HollowPointPC", "Ship":"Python", "ShipID":7, "Credits":1398401651 },
    { "timestamp":"2026-05-01T16:47:49Z", "event":"Loadout", "Ship":"python", "ShipID":7, "ShipName":"JOLENE", "ShipIdent":"GH-17P", "HullValue":56978179, "ModulesValue":39856450, "Rebuy":4841731, "Modules":[ { "Slot":"PowerPlant", "Item":"int_powerplant_size7_class5", "On":true, "Priority":1 } ] }
  ]
}
```

### Example: Sending an EngineerCraft event

```json
{
  "cmdr": "CMDR Name",
  "entry": {
    "timestamp":"2026-05-01T20:32:53Z",
    "event":"EngineerCraft",
    "Slot":"FrameShiftDrive",
    "Module":"int_hyperdrive_overcharge_size5_class5",
    "Engineer":"Elvira Martuuk",
    "BlueprintName":"FSD_LongRange",
    "Level":1,
    "Quality":1.0,
    "Modifiers":[
      { "Label":"Mass", "Value":22.0, "OriginalValue":20.0, "LessIsGood":1 },
      { "Label":"FSDOptimalMass", "Value":1351.25, "OriginalValue":1175.0, "LessIsGood":0 }
    ]
  }
}
```

### Example: Sending a Statistics event (Merc Coin balance)

Send the raw `Statistics` event exactly as it appears in the journal. The server reads the Merc Coin balance from `Bank_Account.MercCoins_Current` (other sections of the event are ignored). Credits are captured separately from `LoadGame`.

```json
{
  "cmdr": "CMDR Name",
  "entry": {
    "timestamp":"2026-05-01T16:47:37Z",
    "event":"Statistics",
    "Bank_Account":{
      "Current_Wealth":1495236280,
      "Spendable_Credits":1398401651,
      "MercCoins_Current":100
    }
  }
}
```

---

# EDMC Plugin API

**For tools like EDMC that pre-process journal events into a structured schema.**

This API expects the client to transform journal events into a specific payload format before sending. It provides more granular control over what data is sent and when.

### Endpoint

```
POST https://cmdr.coriolis.io/api/sync/
```

### Request Format

All requests use `Content-Type: application/json`. Every payload must include at minimum:

```json
{
  "event": "<JournalEventName>",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name"
}
```

The `event` field determines which additional data fields are expected.

### Tracked Events

#### Ship Events

Events: `Loadout`, `ShipyardNew`, `ShipyardBuy`, `ShipyardSell`, `SellShipOnRebuy`, `ShipyardSwap`, `ShipyardTransfer`, `SetUserShipName`, `StartUp`

Include a `ship` object containing the full loadout:

```json
{
  "event": "Loadout",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name",
  "ship": {
    "shipType": "python",
    "shipID": 7,
    "shipName": "My Python",
    "shipIdent": "GH-17P",
    "hullValue": 56978179,
    "modulesValue": 39856450,
    "rebuy": 4841731,
    "modules": [
      {
        "slot": "PowerPlant",
        "item": "int_powerplant_size7_class5",
        "on": true,
        "priority": 1,
        "health": 1.0,
        "value": 51289112,
        "engineering": {
          "blueprintName": "PowerPlant_Boosted",
          "level": 3,
          "quality": 1.0,
          "experimentalEffect": "special_powerplant_toughened",
          "modifiers": [
            {
              "label": "PowerCapacity",
              "value": 32.4,
              "originalValue": 30.0,
              "lessIsGood": 0
            }
          ]
        }
      }
    ]
  }
}
```

For `ShipyardSell` / `SellShipOnRebuy`, also include:
```json
{
  "soldShipType": "cobramkiii",
  "soldShipID": 3
}
```

For `ShipyardBuy`, also include:
```json
{
  "storeShipID": 7,
  "sellShipID": null,
  "newShipType": "python"
}
```

For `ShipyardSwap`, also include:
```json
{
  "storeShipID": 7,
  "storeShipType": "python"
}
```

#### Module Events

Events: `ModuleBuy`, `ModuleSell`, `ModuleStore`, `ModuleRetrieve`, `ModuleSwap`, `MassModuleStore`

Include the raw journal entry fields (minus `event` and `timestamp`) in `journalEntry`, plus the current `ship` loadout:

```json
{
  "event": "ModuleBuy",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name",
  "journalEntry": {
    "Slot": "Slot03_Size5",
    "BuyItem": "int_shieldgenerator_size5_class5",
    "BuyPrice": 5103953
  },
  "ship": { }
}
```

#### Engineering Events

Events: `EngineerCraft`

Same structure as module events — include `journalEntry` and the updated `ship` loadout:

```json
{
  "event": "EngineerCraft",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name",
  "journalEntry": {
    "Engineer": "Felicity Farseer",
    "BlueprintName": "FSD_LongRange",
    "Level": 5
  },
  "ship": { }
}
```

#### Material Events

Events: `Materials`, `MaterialCollected`, `MaterialDiscarded`, `MaterialTrade`, `Synthesis`, `ScientificResearch`, `TechnologyBroker`, `StartUp`

Include the full material inventory as a flat array. Material names should be the FDev journal names (lower-case):

```json
{
  "event": "Materials",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name",
  "materials": [
    { "category": "raw", "name": "iron", "count": 300 },
    { "category": "raw", "name": "nickel", "count": 241 },
    { "category": "manufactured", "name": "salvagedalloys", "count": 150 },
    { "category": "encoded", "name": "legacyfirmware", "count": 263 }
  ]
}
```

You may also send `MaterialsUpdated` as the event name if you detect material changes outside of the standard material events.

#### Stored Module Events

Events: `StoredModules`

Include the full list of stored modules:

```json
{
  "event": "StoredModules",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name",
  "storedModules": [
    {
      "storageSlot": 1,
      "name": "int_shieldgenerator_size5_class5",
      "nameLocalised": "Shield Generator",
      "buyPrice": 5103953,
      "hot": false,
      "starSystem": "Sol",
      "marketID": 128016896,
      "engineerModification": "ShieldGenerator_Reinforced",
      "engineerLevel": 3,
      "engineerQuality": 0.85
    }
  ]
}
```

#### Statistics / Finances Events

Events: `Statistics`

Include a `statistics` object with the commander's finances. Coriolis uses these for the build shopping list to show the credits and Merc Coin a build requires versus what the commander owns.

- `credits` — the commander's spendable credit balance (from EDMC's tracked `state['Credits']`).
- `mercCoins` — the Merc Coin balance, taken from the `Statistics` journal event's `Bank_Account.MercCoins_Current`. Merc Coin is an operations currency (earned from operations/missions), **not** a material — do not send it in the materials array.
- `currentWealth` — optional, the commander's total wealth (`Bank_Account.Current_Wealth`).

```json
{
  "event": "Statistics",
  "timestamp": "2026-03-10T12:34:56Z",
  "commander": "CMDR Name",
  "statistics": {
    "credits": 1398401651,
    "currentWealth": 1495236280,
    "mercCoins": 100
  }
}
```

The `Statistics` journal event fires infrequently (typically at session start and when finances change). Send it whenever the game emits it so the Merc Coin and credit balances stay current.
