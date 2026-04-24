## Sending CMDR Data to CMDR-Coriolis (Third Party Apps)

CMDR-Coriolis works in a similar way to Inara in this respect, any existing third party client that inspects the game journals (EDMC, EDD, EDDI, etc.) and sends data to Inara, is perfectly capable of sending data to CMDR-Coriolis. We encourage the developers of third party tools to offer the ability for CMDR's to add their CMDR-Coriolis API Key to their tool and then send that CMDR's data to CMDR-Coriolis for them.

All third party tools need to do, is provide the ability for CMDR's to opt in to sending data to CMDR-Coriolis and capture the API Key for them, then start sending the data on journal events.

### API Endpoint

All data is sent as a `POST` request to:

```
https://cmdr.coriolis.io/api/sync/
```

### Authentication

Every request must include the CMDR's API key. The key is a 16-character token that the user copies from their CMDR-Coriolis dashboard. Send it via the `X-Api-Key` header (preferred) or as a `Bearer` token in the `Authorization` header:

```
X-Api-Key: <api_key>
```

or

```
Authorization: Bearer <api_key>
```

`X-Api-Key` is recommended because some server configurations (e.g. Apache mod_wsgi) strip the `Authorization` header by default.

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

### Response

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