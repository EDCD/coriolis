export const formats = {
  decimal: ',',
  thousands: '.',
  grouping: [3],
  currency: ['', ' €'],
  dateTime: '%A, der %e. %B %Y, %X',
  date: '%d.%m.%Y',
  time: '%H:%M:%S',
  periods: ['AM', 'PM'], // unused
  days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  shortMonths: ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
};

export const terms = {
  PHRASE_ALT_ALL: 'Alt + Klick um alle Plätze zu füllen',
  PHRASE_BACKUP_DESC: 'Export aller Coriolis-Daten, um sie zu sichern oder um sie zu einem anderen Browser/Gerät zu übertragen.',
  PHRASE_CONFIRMATION: 'Sind Sie sicher?',
  PHRASE_EXPORT_DESC: 'Ein detaillierter JSON-Export Ihrer Konfiguration für die Verwendung in anderen Websites und Tools',
  PHRASE_FASTEST_RANGE: 'aufeinanderfolgende maximale Reichweite/Sprünge',
  PHRASE_IMPORT: 'JSON hier einfügen oder importieren',
  PHRASE_LADEN: 'Schiffsmasse + Treibstoff + Fracht',
  PHRASE_NO_BUILDS: 'Keine Konfigurationen zum Vergleich ausgewählt!',
  PHRASE_NO_RETROCH: 'Keine Umrüständerungen',
  PHRASE_SELECT_BUILDS: 'Ausstattung zum Vergleich auswählen',
  PHRASE_SG_RECHARGE: 'Zeit von 50% bis 100% der Ladung bei vollem SYS Kondensator',
  PHRASE_SG_RECOVER: 'Erneuerung (zu 50%) nach Zusammenbruch bei vollem SYS Kondensator',
  PHRASE_UNLADEN: 'Schiffsmasse ohne Treibstoff und Fracht',
  PHRASE_UPDATE_RDY: 'Update verfügbar! Klicken zum Aktualisieren', 
  PHRASE_ENGAGEMENT_RANGE: 'Die Distanz zwischen deinem Schiff und seinem Ziel',
  PHRASE_SELECT_BLUEPRINT: 'Klicken um eine Bauplan auszuwählen',
  PHRASE_BLUEPRINT_WORST: 'Schlechteste Primärwerte für diesen Bauplan',
  PHRASE_BLUEPRINT_RANDOM: 'Zufällige Auswahl an Primärwerten für diesen Bauplan (Schlechteste <> Beste)',
  PHRASE_BLUEPRINT_BEST: 'Beste Primärwerte für diesen Bauplan',
  PHRASE_BLUEPRINT_EXTREME: 'Beste Positive Werte und schlechteste Negative Werte für diesen Bauplan',
  PHRASE_BLUEPRINT_RESET: 'Entferne alle Modifikationen und experimentelle Effekte',
  PHRASE_SELECT_SPECIAL: 'Klicken um einen experimentellen Effekt auszuwählen',
  PHRASE_NO_SPECIAL: 'Keine Experimentellen Effekte',
  PHRASE_SHOPPING_LIST: 'Stationen die diese Schiffskonfiguration verkaufen',
  PHRASE_REFIT_SHOPPING_LIST: 'Stationen die die benötigten Module verkaufen',
  PHRASE_TOTAL_EFFECTIVE_SHIELD: 'Gesamtschaden der von jeder Schadensart absorbiert werden kann (Bei Nutzung aller Schildzellen)',
  PHRASE_TIME_TO_LOSE_SHIELDS: 'Schilde werden halten für',
  PHRASE_TIME_TO_RECOVER_SHIELDS: 'Schilde werden sich erholen in',
  PHRASE_TIME_TO_RECHARGE_SHIELDS: 'Schilde werden sich wieder aufgeladen haben in',
  PHRASE_SHIELD_SOURCES: 'Aufschlüsselung der Schildenergiezusammensetzung',
  PHRASE_EFFECTIVE_SHIELD: 'Effektive Schildstärke gegen die Unterschiedlichen Schadensarten',
  PHRASE_ARMOUR_SOURCES: 'Aufschlüsselung der Hüllenpanzerungszusammensetzung',
  PHRASE_EFFECTIVE_ARMOUR: 'Effektive Hüllenpanzerungsstärke gegen die unterschiedlichen Schadensarten',
  PHRASE_DAMAGE_TAKEN: '% des rohen Schadens der unterschiedlichen Schadensarten',
  PHRASE_TIME_TO_LOSE_ARMOUR: 'Hüllenpanzerung wird halten für',
  PHRASE_MODULE_PROTECTION_EXTERNAL: 'Modulpanzerung der Waffenaufhängung',
  PHRASE_MODULE_PROTECTION_INTERNAL: 'Modulpanzerung für alle anderen Module',
  PHRASE_SHIELD_DAMAGE: 'Aufschlüsselung des kontinuierlichen SPS gegen Schilde',
  PHRASE_ARMOUR_DAMAGE: 'Aufschlüsselung des kontinuierlichen SPS gegen Hüllenpanzerung',

  PHRASE_TIME_TO_REMOVE_SHIELDS: 'Schilde werden zusammenbrechen in',
  TT_TIME_TO_REMOVE_SHIELDS: 'Mit andauerndem Beschuss durch alle Waffen',
  PHRASE_TIME_TO_REMOVE_ARMOUR: 'Hüllenpanzerung wird brechen in',
  TT_TIME_TO_REMOVE_ARMOUR: 'Mit andauerndem Beschuss durch alle Waffen',
  PHRASE_TIME_TO_DRAIN_WEP: 'Leert WAF Energie in',
  TT_TIME_TO_DRAIN_WEP: 'Dauer um WAF Energie aufzubrauchen wenn alle Waffen gefeuert werden',
  TT_TIME_TO_LOSE_SHIELDS: 'Gegen andauernden Beschuss durch alle Waffen des Gegners',
  TT_TIME_TO_LOSE_ARMOUR: 'Gegen andauernden Beschuss durch alle Waffen des Gegners',
  TT_MODULE_ARMOUR: 'ModulPanzerung für den Schutz interner Subsysteme (Module)',
  TT_MODULE_PROTECTION_EXTERNAL: 'Prozensatz des Schadens der von den Waffenaufhängungen zu den Modulverstärkungen umgeleitet wird',
  TT_MODULE_PROTECTION_INTERNAL: 'Prozensatz des Schadens der von den Subsystem (außer Waffen) zu den Modulverstärkungen umgeleitet wird',

  TT_EFFECTIVE_SDPS_SHIELDS: 'Effektiver SPS solange die Waffenenergie nicht aufgebraucht wurde',
  TT_EFFECTIVENESS_SHIELDS: 'Effektivität im Vergleich zu einem Ziel ohne Widerstände mit 0 PIPS in SYS bei 0m',
  TT_EFFECTIVE_SDPS_ARMOUR: 'Effektiver kontinuierlicher Schaden solange der WAF Kondensator nicht aufgebraucht wurde',
  TT_EFFECTIVENESS_ARMOUR: 'Effektivität im Vergleich zu einem Ziel ohne Widerstände bei 0m',

  PHRASE_EFFECTIVE_SDPS_SHIELDS: 'Effektiver kontinuierlicher SPS gegen Schilde',
  PHRASE_EFFECTIVE_SDPS_ARMOUR: 'Effektiver kontinuierlicher SPS gegen Hüllenpanzerung',

  TT_SUMMARY_SPEED: 'Mit vollem Tank und 4 PIPS in WAF',
  TT_SUMMARY_SPEED_NONFUNCTIONAL: 'Schubdüsen deaktiviert oder maximale Masse überschritten',
  TT_SUMMARY_BOOST: 'Mit vollem Tank und 4 PIPS in ANT',
  TT_SUMMARY_BOOST_NONFUNCTIONAL: 'Energieverteiler kann nicht genügend Energie für den Boost liefern',
  TT_SUMMARY_SHIELDS: 'Rohe Schildstärke, inklusive Schildverstärker',
  TT_SUMMARY_SHIELDS_NONFUNCTIONAL: 'Keine Schildgenerator oder Schilde deaktiviert',
  TT_SUMMARY_INTEGRITY: 'Schiffsintegrität, einschließlich Hüllenpanzerung und Rumpfhüllenverstärkung',
  TT_SUMMARY_HULL_MASS: 'Hüllenmasse, bevor jegliche Module installiert wurde',
  TT_SUMMARY_UNLADEN_MASS: 'Hüllenmasse ohne Ladung und Treibstoff',
  TT_SUMMARY_LADEN_MASS: 'Hüllenmasse, einschließlich Treibstoff und Ladung',
  TT_SUMMARY_DPS: 'Schaden pro Sekunde wenn alle Waffen feuern',
  TT_SUMMARY_EPS: 'WAF Kondensator Verbrauch pro Sekunde wenn alle Waffen feuern',
  TT_SUMMARY_TTD: 'Zeit um den WAF Kondensator aufzubrauchen wenn alle Waffen feuern und 4 PIPS auf dem WAF Kondesator',
  TT_SUMMARY_MAX_SINGLE_JUMP: 'Weitest mögliche Sprungreichweite ohne Ladung und nur genügend Treibstoff für den Sprung selbst',
  TT_SUMMARY_UNLADEN_SINGLE_JUMP: 'Weitest mögliche Sprungreichweite ohne Ladung und einem vollen Tank',
  TT_SUMMARY_LADEN_SINGLE_JUMP: 'Weitest mögliche Sprungreichweite mit voller Ladung und einem vollen Tank',
  TT_SUMMARY_UNLADEN_TOTAL_JUMP: 'Weitest mögliche Sprungreichweite ohne Ladung, einem vollen Tank und der weitest möglichen Sprungreichweite bei jedem Sprung',
  TT_SUMMARY_LADEN_TOTAL_JUMP: 'Weitest mögliche Sprungreichweite mit maximaler Ladung, einem vollen Tank und der weitest möglichen Sprungreichweite bei jedem Sprung',

  HELP_MODIFICATIONS_MENU: 'Klicke auf eine Zahl um einen neuen Wert einzutragen oder bewege den Regler',

  // Other languages fallback to these  values
  // Only Translate to other languages if the name is different in-game
  am: 'Automatische Feldwartung',
  bh: 'Hüllenpanzerung',
  bl: 'Strahlenlaser',
  bsg: 'Bizellengenerator',
  c: 'Kanone',
  cc: 'Sammeldrohnensteuerung',
  ch: 'Düppelwerfer',
  cr: 'Laderaum',
  cs: 'Ladungssensor',
  dc: 'Landecomputer',
  ec: 'Elektronische Gegenmaßnahme',
  fc: ' Fragmentkanone',
  fh: 'Jägerhangar',
  fi: 'Frameshift Unterbrecher',
  fs: 'Treibstoffsammler',
  fsd: 'Frameshiftantrieb',
  ft: 'Treibstofftank',
  fx: 'Treibstoffdrohnencontroller',
  hb: 'Ladelukenbrecherdrohnencontroller',
  hr: 'Rumpfhüllenverstärkung',
  hs: 'Kühlkörperwerfer',
  kw: 'Tötungsbefehlscanner',
  ls: 'Lebenserhaltung',
  mc: 'Mehrzweckgeschütz ',
  ml: 'Erzabbaulaser',
  mr: 'Raketengestell',
  mrp: 'Modulverstärkung',
  nl: 'Minenwerfer',
  pa: 'Plasmabeschleuniger',
  pas: 'Planetare Annäherungseinheit',
  pc: 'Erzsuchersteuerung',
  pce: 'Touristen Passagierkabine',
  pci: 'Business Klasse Passagierkabine',
  pcm: 'Erste Klasse Passagierkabine',
  pcq: 'Luxus Passagierkabine',
  pd: 'Energieverteiler',
  pl: 'Pulslaser',
  po: 'Punktverteidigung',
  pp: 'Kraftwerk',
  psg: 'Prismatischer Schildgenerator',
  pv: 'Planetarer Fahrzeughangar',
  rf: 'Raffinerie',
  rg: 'Schienenkanone',
  s: 'Sensoren',
  sb: 'Schildverstärker',
  sc: 'Himmelskörperscanner',
  scb: 'Schildzellenbatterie',
  sg: 'Schildgenerator',
  ss: 'Oberflächensensor',
  t: 'Schubdüsen',
  tp: 'Torpedopylone',
  ul: 'Salvenlaser',
  ws: 'Frameshiftwolkenscanner',
  hrd: 'Hüllenhärte',

  // Items on the outfitting page
  // Notification of restricted slot
  emptyrestricted: 'leer (eingeschränkt)',
  'damage dealt to': 'Schaden gegen',
  'damage received from': 'Schaden durch',
  'against shields': 'Gegen Schilde',
  'against hull': 'Gegen Hülle',
  'total effective shield': 'Effektiver Schild (kombiniert)',

  // 'ammo' was overloaded for outfitting page and modul info, so changed to ammunition for outfitting page
  ammunition: 'Munition',

  // Unit for seconds
  secs: 's',

  rebuildsperbay: 'Jäger pro Stellpaltz',

  // Blueprint rolls
  worst: 'Schlecht',
  average: 'Durchschnitt',
  random: 'Zufall',
  best: 'Sehr gut',
  extreme: 'Extrem',
  reset: 'Zurücksetzen',

  // Weapon, offence, defence and movement
  dpe: 'Damage per MJ of energy',
  dps: 'Schaden pro Sekunde',
  sdps: 'Kontinuierlicher Schaden pro Sekunde',
  dpssdps: 'Schaden pro Sekunde (kontinuierlicher Schaden pro Sekunde)',
  eps: 'Energie pro Sekunde',
  epsseps: 'Energie pro Sekunde (kontinuierliche Energie pro Sekunde)',
  hps: 'Hitze pro Sekunde',
  hpsshps: 'Hitze pro Sekunde (kontinuierliche Hitze pro Sekunde)',
  'damage by': 'Schaden von',
  'damage from': 'Schaden von',
  'shield cells': 'Schildbatterien',
  'recovery': 'Erholung',
  'recharge': 'Auflaung',
  'engine pips': 'Schubpriorität',
  '4b': '4 PIPS und Boost',
  'speed': 'Tempo',
  'pitch': 'Kippen',
  'roll': 'Rollen',
  'yaw': 'Gieren',
  'internal protection': 'Interner Schutz',
  'external protection': 'Externer Schutz',
  'engagement range': 'Gefechtsreichweite',
  'total': 'Insg.',

  // Modifications
  ammo: 'Maximale Munition',
  boot: 'Startzeit',
  brokenregen: 'Regenrationsrate (Gebrochene Schilde)',
  burst: 'Salve',
  burstrof: 'Salven Feuerrate',
  clip: 'Munnitionsmagazin',
  damage: 'Schaden',
  distdraw: 'Energieverteilerverbrauch',
  duration: 'Dauer',
  eff: 'Effizienz',
  engcap: 'Antriebskapazität',
  engrate: 'Antrieb Ladungsrate',
  explres: 'Explosionswiderstand',
  facinglimit: 'Facing limit',
  hullboost: 'Hüllenboost',
  hullreinforcement: 'Hüllenverstärkung',
  integrity: 'Integrität',
  jitter: 'Schwankungsbreite',
  kinres: 'Kinetischer Widerstand',
  maxfuel: 'Maximaler Treibstoff pro Sprung',
  mass: 'Masse',
  optmass: 'Optimale Masse',
  optmul: 'Optimalmultiplikator',
  pgen: 'Energiegewinnung',
  piercing: 'Durchdringung',
  power: 'Energieverbrauch',
  protection: 'Schutz',
  range: 'Reichweite',
  ranget: 'Reichweite/s', // Range in time (for FSD interdictor)
  regen: 'Wiederaufladungsrate',
  reload: 'Wiederaufladung',
  rof: 'Feuerrate',
  angle: 'Abtastwinkel',
  scanrate: 'Abtastrate',
  scantime: 'Abtastzeit',
  shield: 'Schild',
  shieldboost: 'Schildverstärkung',
  shieldreinforcement: 'Schildverstärkung',
  shotspeed: 'Schussgeschwidndigkeit',
  spinup: 'Aufwärmphase',
  syscap: 'Systemkapazität',
  sysrate: 'System Ladungsrate',
  thermload: 'Thermische Last',
  thermres: 'Thermischer Widerstand',
  wepcap: 'Waffenkapazität',
  weprate: 'Waffen Ladungsrate',

  // Shield generators use a different terminology
  minmass_sg: 'Minimale Hüllenmasse',
  optmass_sg: 'Optimale Hüllenmasse',
  maxmass_sg: 'Maximum Hüllenmasse',
  minmul_sg: 'Minimale Stärke',
  optmul_sg: 'Optimale Stärke',
  maxmul_sg: 'Maximale Stärke',
  minmass_psg: 'Minimale Hüllenmasse',
  optmass_psg: 'Optimale Hüllenmasse',
  maxmass_psg: 'Maximum Hüllenmasse',
  minmul_psg: 'Minimale Stärke',
  optmul_psg: 'Optimale Stärke',
  maxmul_psg: 'Maximale Stärke',
  minmass_bsg: 'Minimale Hüllenmasse',
  optmass_bsg: 'Optimale Hüllenmasse',
  maxmass_bsg: 'Maximum Hüllenmasse',
  minmul_bsg: 'Minimale Stärke',
  optmul_bsg: 'Optimale Stärke',
  maxmul_bsg: 'Maximale Stärke',

  range_s: 'Typische Emissionsreichweite',

  // Damage types
  absolute: 'Insgesamt',
  explosive: 'Explosiv',
  kinetic: 'Kinetisch',
  thermal: 'Thermisch',

  // Shield sources
  generator: 'Generator',
  boosters: 'Verstärker',
  cells: 'Batterien',

  // Armour sources
  bulkheads: 'Hüllenpanzerung',
  reinforcement: 'Hüllenverstärkung',  
    
  // Optional module groups (only these, that are not in the list with the short terms)
  'hangars': 'Hangars',
  'limpet controllers': 'Drohnensteuerung',
  'passenger cabins': 'Passagierkabinen',
  'structural reinforcement': 'Strukturverstärkungen',
  
  // Hardpoint module groups
  'lasers': 'Laser',
  'projectiles': 'Projektilwaffen',
  'ordnance': 'Artillerie',
  
  // Armour modules
  'Lightweight Alloy': 'leichte Legierung',
  'Reinforced Alloy': 'verstärkte Legierung',
  'Military Grade Composite': 'Militär-Komposit',
  'Mirrored Surface Composite': 'Gespiegelte-Oberfläche-Komposit',
  'Reactive Surface Composite': 'Reaktive-Oberfläche-Komposit',
  
  // Scanner modules
  'scanners': 'Scanner',
  'Basic Discovery Scanner': 'Aufklärungsscanner (einf.)',
  'Advanced Discovery Scanner': 'Aufklärungsscanner (fortgeschr.)',
  'Detailed Surface Scanner': 'Detail-Oberflächenscanner',
  'Intermedia Discovery Scanner': 'Intermedia Discovery Scanner',
  
  // Docking modules
  'Standard Docking Computer': 'Standard-Landecomputer',
  
  // Point defence modules
  'Point Defence': 'Punktverteidigung',
  
  // Chaff launcher modules
  'Chaff Launcher': 'Düppel-Werfer',
  
  // Heat sink launcher modules
  'Heat Sink Launcher': 'Kühlkörperwerfer',
  
  // Panel headings and subheadings
  'power and costs': 'Energie und Kosten',
  'costs': 'Kosten',
  'retrofit costs': 'Umrüstkosten',
  'reload costs': 'Nachladekosten',
  'profiles': 'Profile',
  'engine profile': 'Antriebsprofil',
  'fsd profile': 'Frameshit Antriebsprofil',
  'movement profile': 'Bewegungsprofil',
  'damage to opponent\'s shields': 'Gegnerischer Schildschaden',
  'damage to opponent\'s hull': 'Gegnerischer Hüllenschaden',
  'offence': 'Offensiv',
  'defence': 'Defensiv',
  'shield metrics': 'Schildwerte',
  'raw shield strength': 'Pure Schildstärke',
  'shield sources': 'Schildzusammensetzung',
  'damage taken': 'Erhaltener Schaden',
  'effective shield': 'Effektiver Schildwert',
  'armour metrics': 'Panzerungswerte',
  'raw armour strength': 'Pure Panzerungsstärke',
  'armour sources': 'Panzerungszusammensetzung',
  'raw module armour': 'Pure Modulpanzerung',
  'effective armour': 'Effektive Panzerung',
  'offence metrics': 'Offensivwerte',
  'defence metrics': 'Defensivwerte',
  
  // internal module panel header
  'Maximize Jump Range': 'Sprungreichweite maximieren',
  'roles': 'Rollen',
  'Multi-purpose': 'Allrounder',
  'Combat': 'Kampf',
  'Trader': 'Handel',
  'Shielded Trader': 'Handel (mit Schild)',
  'Explorer': 'Entdecker',
  'Planetary Explorer': 'Planetenentdecker',
  'Miner': 'Erzabbau',
  'Shielded Miner': 'Erzabbau (mit Schild)',
  'Racer': 'Geschwindigkeit',
  
  // Misc items
  'fuel carried': 'geladener Treibstoff',
  'cargo carried': 'geladene Fracht',
  'ship control': 'Energieverteilung',
  'opponent': 'Gegner',
  'opponent\'s shields': 'Gegnerische Schilde',
  'opponent\'s armour': 'Gegenerische Panzerung',
  'shield damage sources': 'Schadensquellen (Schild)',
  'armour damage sources': 'Schadensquellen (Panzerung)',
  'never': 'Niemals',
  'stock': 'Standard',
  'boost': 'Boost',
  'ship': 'Schiff',
  'laden': 'Beladen',
  'unladen': 'Leer',
  'jump range': 'Sprungreichweite',
  'total laden': 'gesamt beladen',
  'total unladen': 'gesamt leer',
  'cargo': 'Fracht',
  'hull': 'Hülle',
  'Enter Name': 'Name eingeben',
  'fuel': 'Tank',
  
  // Items on the ship list page
  // Ship list
  'manufacturer': 'Hersteller',
  'cost': 'Preis',
  'size': 'Größe',
  'small': 'Klein',
  'medium': 'Mittel',
  'large': 'Groß',
  'agility': 'MNV',
  'base': 'Basis',
  'armour': 'Panzerung',
  'shields': 'Schilde',
  'jump': 'Sprung',
  'core module classes': 'Basismodulklassen',
  'Power Plant': 'Kraftwerk',
  th: 'Schubdüsen',
  fsd: 'Frameshiftantrieb',
  ls: 'Lebenserhaltung',
  pd: 'Energieverteiler',
  s: 'Sensoren',
  'hardpoints': 'Aufhängungen',
  'internal compartments': 'Optionale Modulklassen',
  
  // Menu items
  'ships': 'Schiffe',
  'builds': 'eigene builds',
  'compare': 'Vergleiche',
  'compare all': 'Alle vergleichen',
  'create new': 'Neu anlegen',
  'none created': 'Keine angelegt',
  'insurance': 'Versicherung',
  'discount': 'Nachlass',
  'settings': 'Einstellungen',
  'module resistances': 'Modulwiderstände',
  'comparisons': 'Vergleiche',
  'backup': 'Sichern',
  'detailed export': 'Detaillierter Export',
  'import': 'Importieren',
  'delete all': 'Alles löschen',
  'about': 'Über',
 
  
  // Items on the outfitting page
  'core internal': 'Intern (basis)',
  'optional internal': 'Intern (optional)',
  'utility mounts': 'Werkzeug-Steckplätze',
  'empty': 'leer',
  'empty all': 'Alles leeren',

  // Help text
  HELP_TEXT: `
<h1>Einführung</h1>
Coriolis ist ein Schiffskonfigurator für Elite:Dangerous. Diese Hilfedatei versorgt dich mit allen Informationen die du benötigst um Coriolis zu benutzen.

<h1>Importiere dein Schiff nach Coriolis</h1>
Often, you will want to start with your existing ship in Coriolis and see how particular changes might affect it, for example upgrading your FSD.  There are a number of tools that can be used to import your ship without you having to create it manually.  This has the added benefit of copying over any engineering modifications that have taken place as well. </p>

<h2>Importiere dein Schiff von EDDI</h2>
To import your ship from EDDI first ensure that your connection to the Frontier servers&apos; companion API is working.  To do this check the &apos;Companion App&apos; tab where you should see "Your connection to the companion app is operational".  If not then follow the instructions in the companion app tab in EDDI to connect to the Frontier servers.</p>

Once you have a working companion API connection go to the &apos;Shipyard&apos; tab.  At the right-hand side of each ship is an &apos;Export to Coriolis&apos; button that will open your default web browser in Coriolis with the ship&apos;s build. </p>

Note that Internet Explorer and Edge might not import correctly, due to their internal restrictions on URL length.  If you find that this is the case then please change your default browser to Chrome. </p>

Also, the imported information does not provide any data on the power priority or enabled status of your cargo hatch.  Coriolis sets this item to have a power priority of "5" and to be disabled by default.  You can change this after import in the Power Management section. </p>

<h2>Importiere dein Schiff von EDMC</h2>
To import your ship from EDMC once your connection to the Frontier servers&apos; companion API is working go to &apos;Settings -&gt;Configuration&apos; and set the &apos;Preferred Shipyard&apos; to &apos;Coriolis&apos;.  Once this is set up clicking on your ship in the main window will open your default web browser in Coriolis with the ship&apos;s build.</p>

Note that Internet Explorer and Edge might not import correctly, due to their internal restrictions on URL length.  If you find that this is the case then please change your default browser to Chrome. </p>

<h1>Understanding And Using The Outfitting Panels</h1>
The outfitting page is where you will spend most of your time, and contains the information for your ship.  Information on each of the panels is provided below. </p>

<h2>Schlüsselwerte</h2>
Along the top of the screen are some of the key values for your build.  This is a handy reference for the values, but more information is provided for the values in the further panels. </p>

Here, along with most places in Coriolis, acronyms will have tooltips explaining what they mean.  Hover over the acronym to obtain more detail, or look in the glossary at the end of this help.</p>

All values are the highest possible, assuming that you an optimal setup for that particular value (maximum pips in ENG for speed, minimum fuel for jump range, etc.).  This means that these values will not be affected by changes to pip settings.  Details of the specific setup for each value are listed in the associated tootip.</p>

<h2>Module</h2>
The next set of panels laid out horizontally across the screen contain the modules you have put in your build.  From left to right these are the core modules, the internal modules, the hardpoints and the utility mounts.  These represent the available slots in your ship and cannot be altered.  Each slot has a class, or size, and in general any module up to a given size can fit in a given slot (exceptions being bulkheads, life support and sensors in core modules and restricted internal slots, which can only take a subset of module depending on their restrictions). </p>

To add a module to a slot left-click on the slot and select the required module.  Only the modules capable of fitting in the selected slot will be shown. </p>

To remove a module from a slot right-click on the module. </p>

To move a module from one slot to another drag it.  If you instead want to copy the module drag it whilst holding down the &apos;Alt&apos; key. </p>

Clicking on the headings for each set of modules gives you the ability to either select an overall role for your ship (when clicking the core internal header) or a specific module with which you want to fill all applicable slots (when clicking the other headers). </p>

<h2>Schiffskontrolle</h2>
The ship controls allow you to set your pips, boost, and amount of fuel and cargo that your build carries.  The changes made here will effect the information supplied in the subsequent panels, giving you a clearer view of what effect different changing these items will have. </p>

Ship control settings are saved as part of a build. </p>

<h2>Gegner</h2>
The opponet selection allows you to choose your opponent.  The opponent can be either a stock build of a ship or one of your own saved builds.  You can also set the engagement range between you and your opponent.  Your selection here will effect the information supplied in the subsequent panels, specifically the Offence and Defence panels. </p>

Opponent settings are saved as part of a build. </p>

<h2>Energieverbrauch und Kosten Untermenü</h2>
<h3>Energie</h3>
The power management panel provides information about power usage and priorities.  It allows you to enable and disable individual modules, as well as set power priorities for each module.  Disabled modules will not be included in the build&apos;s statistics, with the exception of Shield Cell Banks as they are usually disabled when not in use and only enabled when required. </p>

<h3>Kosten</h3>
The costs panel provides information about the costs for each of your modules, and the total cost and insurance for your build.  By default Coriolis uses the standard costs, however discounts for your ship, modules and insurance can be altered in the &apos;Settings&apos; at the top-right of the page.</p>

The retrofit costs provides information about the costs of changing the base build for your ship, or your saved build, to the current build.</p>

The reload costs provides information about the costs of reloading your current build.</p>

<h2>Profile</h2>
Profiles provide graphs that show the general performance of modules in your build

<h3>Antriebsprofil</h3>
The engine profile panel provides information about the capabilities of your current thrusters.  The graph shows you how the maximum speed alters with the overall mass of your build. The vertical dashed line on the graph shows your current mass.  Your engine profile can be altered by obtaining different thrusters or engineering your existing thrusters, and you can increase your maximum speed by adding pips to the ENG capacitor as well as reducing the amount of fuel and cargo you are carrying as well as reducing the overall weight of the build.  You can also temporarily increase your speed by hitting the boost button. </p>

<h3>FSA Profil</h3>
The FSD profile panel provides information about the capabilities of your current frame shift drive.  The graph shows you how the maximum jump range alters with the overall mass of your build.  The vertical dashed line on the graph shows your current maximum single jump range. Your FSD profile can be altered by obtaining a different FSD or engineering your existing FSD, and you can increase your maximum jump range by reducing the amount of fuel and cargo you are carrying as well as reducing the overall weight of the build, </p>

<h3>Bewegungsprofil</h3>
The movement profile panel provides information about the capabilities of your current thrusters with your current overall mass and ENG pips settings.  The diagram shows your ability to move and rotate in the different axes:

<dl>
<dt>Geschwindigkeit</dt><dd>The fastest the ship can move, in metres per second</dd>
<dt>Kippen</dt><dd>The fastest the ship can raise or lower its nose, in degrees per second</dd>
<dt>Rollen</dt><dd>The fastest the ship can roll its body, in degrees per second</dd>
<dt>Gieren</dt><dd>The fastest the ship can turn its nose left or right, in degrees per second</dd>
</dl>

Your movement profile can be altered by obtaining different thrusters or engineering your existing thrusters, and you can increase your movement values by adding pips to the ENG capacitor as well as reducing the amount of fuel and cargo you are carrying as well as reducing the overall weight of the build.  You can also temporarily increase your movement profile by hitting the boost button. </p>

<h3>Schadensprofil</h3>
The damage profile provides two graphs showing how the the build&apos;s damage to the opponent&apos;s shields and hull change with engagement range. The vertical dashed line on the graph shows your current engagement range.  This combines information about the build&apos;s weapons with the opponent&apos;s shields and hull to provide an accurate picture of sustained damage that can be inflicted on the opponent. </p>

<h2>Offensive</h2>
<h3>Zusammenfassung</h3>
The offence summary provides per-weapon information about sustained damage per second inflicted to shields and hull, along with a measure of effectiveness of that weapon.  The effectiveness value has a tooltip that provides a breakdown of the effectiveness, and can include reductions or increases due to range, resistance, and either power distributor (for shields) or hardness (for hull).  The final effectiveness value is calculated by multiplying these percentages together. </p>

<h3>Offensivwerte</h3>
The offence metrics panel provides information about your offence. </p>

Time to drain is a measure of how quickly your WEP capacitor will drain when firing all weapons.  It is affected by the number of pips you have in your WEP capacitor, with more pips resulting in a higher WEP recharge rate and hence a longer time to drain. </p>

The next value is the time it will take you to remove your opponent&apos;s shields.  This assumes that you have 100% time on target and that your engagement range stays constant.  Note that if your time to remove shields is longer than your time to drain this assumes that you continue firing throughout, inflicting lower damage due to the reduced energy in your WEP capacitor. </p>

The next value is the time it will take you to remove your opponent&apos;s armour.  This follows the same logic as the time to remove shields. </p>

<h3>Schadensquellen (Schilde)</h3>
The shield damage sources provides information about the sources of damage to your opponent by damage type.  For each applicable type of damage (absolute explosive, kinetic, thermal) a sustained damage per second value is provided. </p>

<h3>Schadensquelle (Hülle)</h3>
The hull damage sources provides information about the sources of damage to your opponent by damage type.  For each applicable type of damage (absolute explosive, kinetic, thermal) a sustained damage per second value is provided. </p>

<h2>Defensive</h2>
<h3>Schildwerte</h3>
The shield metrics provides information about your shield defence. </p>

Raw shield strength is the sum of the shield from your generator, boosters and shield cell banks. A tooltip provides a breakdown of these values. </p>

The time the shields will hold for is the time it will take your opponent&apos; to remove your shields.  This assumes that they have 100% time on target and that the engagement range stays constant. It also assumes that you fire all of your shield cell banks prior to your shields being lost. </p>

The time the shields will recover in is the time it will take your shields to go from collapsed (0%) to recovered (50%). This is affected by the number of pips you have in your SYS capacitor.  </p>

The time the shields will recharge in is the time it will take your shields to go from recovered (50%) to full (100%). This is affected by the number of pips you have in your SYS capacitor.  </p>

</h3>Schildstärke (Zusammensetzung)</h3>
This chart provides information about the sources of your shields.  For each applicable source of shields (generator, boosters, shield cell banks) a value is provided. </p>

</h3>Schadensauswirkung</h3>
This graph shows how the initial damage from the weapons of each type are reduced before their damage is applied to the shields.  For each type of damage (absolute, explosive, kinetic, thermal) a percentage of the initial damage is provided.  A tooltip provides a breakdown of these values. </p>

</h3>Effektiver Schildwert</h3>
This graph shows the effective shield for each damage type, found by dividing the raw shield value by the damage taken for that type. </p>

<h3>Panzerungswerte</h3>
The armour metrics provides information about your armour defence. </p>

Raw armour strength is the sum of the armour from your bulkheads and hull reinforcement packages. A tooltip provides a breakdown of these values. </p>

The time the armour will hold for is the time it will take your opponent&apos; to take your armour to 0.  This assumes that they have 100% time on target, the engagement range stays constant, and that all damage is dealt to the armour rather than modules. </p>

Raw module armour is the sum of the protection from your module reinforcement packages. </p>

Protection for hardpoints is the amount of protection that your module reinforcement packages provide to hardpoints.  This percentage of damage to the hardpoints will be diverted to the module reinforcement packages. </p>

Protection for all other modules is the amount of protection that your module reinforcement packages provide to everything other than hardpoints.  This percentage of damage to the modules will be diverted to the module reinforcement packages. </p>

</h3>Hüllenpanzerung (Zusammensetzung)</h3>
This chart provides information about the sources of your armour.  For each applicable source of shields (bulkheads, hull reinforcement packages) a value is provided. </p>

</h3>Schadensauswirkung</h3>
This graph shows how the initial damage from the weapons of each type are reduced before their damage is applied to the armour.  For each type of damage (absolute, explosive, kinetic, thermal) a percentage of the initial damage is provided.  A tooltip provides a breakdown of these values. </p>

</h3>Effektive Hüllenpanzerung</h3>
This graph shows the effective armour for each damage type, found by dividing the raw armour value by the damage taken for that type. </p>

<h1>Tastaturkommandos</h1>
<dl>
<dt>Ctrl-b</dt><dd>Boost an-/auschalten</dd>
<dt>Ctrl-e</dt><dd>open Export Dialog (ausschließlich Ausstattungsseite)</dd>
<dt>Ctrl-h</dt><dd>Öffne den Hilfedialog</dd>
<dt>Ctrl-i</dt><dd>Öffne den Importdialog</dd>
<dt>Ctrl-o</dt><dd>Öffne den Kurzlinkdialog</dd>
<dt>Ctrl-left-arrow</dt><dd>Erhöhe den SYS Kondensator</dd>
<dt>Ctrl-up-arrow</dt><dd>Erhöhe den ANT Kondensator</dd>
<dt>Ctrl-right-arrow</dt><dd>Erhöhe den WAF Kondensator</dd>
<dt>Ctrl-down-arrow</dt><dd>Setze den Energieverteiler zurück</dd>
<dt>Esc</dt><dd>Schließe jeden offenen Dialog</dd>
</dl>
<h1>Glossar</h1>
<dl>
<dt>Absoluter Schaden</dt><dd>A type of damage, without any protection.  Absolute damage is always dealt at 100% regardless of if the damage is to shields, hull or modules, and irrespective of resistances</dd>
<dt>SPS</dt><dd>Schaden pro Sekunde; the amount of damage that a weapon or a ship can deal per second to a target under optimum conditions</dd>
<dt>EPS</dt><dd>Energie pro Sekunde; the amount of energy that a weapon or a ship drains from the weapons capacitor per second when firing</dd>
<dt>HPS</dt><dd>Hitze pro Sekunde; the amount of heat that a weapon or a ship generates per second when firing</dd>
<dt>Effektivität</dt><dd>A comparison of the maximum DPS of a given weapon to the actual DPS of the given weapon in a specific situation.  DPS can be reduced by range to the target, the target&apos;s hull and shield resistances, and the target&apos;s hardness</dd>
<dt>Explosiver Schaden</dt><dd>A type of damage, protected against by explosive resistance</dd>
<dt>Hüllenhärte</dt><dd>The inherent resistance to damage of a ship&apos;s hull.  Hardness is defined on a per-ship basis and there is currently nothing that can be done to change it.  Hardness of a ship&apos;s hull is compared to the piercing of weapons: if piercing is higher than hardness the weapon does 100% damage, otherwise it does a fraction of its damage calculated as piercing/hardness</dd>
<dt>Schadensabfall</dt><dd>The distance at which a weapons starts to do less damage than its stated DPS</dd>
<dt>Kinetischer Schaden</dt><dd>A type of damage, protected against by kinetic resistance</dd>
<dt>KSPS</dt><dd>Kontinuierlicher Schaden pro Sekunde; the amount of damage that a weapon or a ship can deal per second to a target, taking in to account ammunition reload</dd>
<dt>KEPS</dt><dd>Kontinuierliche Energie pro Sekunde; the amount of energy that a weapon or a ship drains from the weapons capacitor per second when firing, taking in to account ammunition reload</dd>
<dt>KHPS</dt><dd>Kontinuierliche Hitze pro Sekunde; the amount of heat that a weapon or a ship generates per second when firing, taking in to account ammunition reload</dd>
<dt>Thermischer Schaden</dt><dd>A type of damage, protected against by thermal resistance</dd>
</dl>

  `,
};
