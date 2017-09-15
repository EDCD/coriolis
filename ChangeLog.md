#2.3.7
  * Fixed Travis test issues
  * Bumped NodeJS version to provide better compatability and support
  * Added updated German Translation
  * Fixed issues with Safari
  * Use coriolis-data 2.3.7
    * Fixed Orca mass-lock

#2.3.6
  * Update miner role to provide better defaults
  * Fix issue where torpedo special effects were not showing
  * Fix typo causing long range blueprint to not modify shot speed in some circumstances
  * Fix for Spanish translation of Chaff Launcher (thanks to DamonFstr)
  * Update for Russian translation (thanks to LeeNTien)
  * Use coriolis-data 2.3.6:
    * Add shotspeed modifier to cannon/multi-cannon/fragment cannon

#2.3.5
  * Ensure that hidden blueprint effects are applied when a blueprint is selected
  * Handle display when summary values show thrusters disabled but current mass keeps them enabled
  * Added updated German translations (thanks to @sweisgerber-dev)
  * Power state (enabled and priority) now follows modules when they are swapped or copied
  * Grey out modules that are powered off to provide a clearer visual indication
  * Use coriolis-data 2.3.5:
    * Fix list of available blueprints for Point Defence
    * Fix integrity values for class 6 power plants
    * Add shot speed for long range weapon
    * Fix components for dirty drive grade 3
    * Update values for Cytoscrambler

#2.3.4
  * Fix crash when removing the special effect from a module
  * Ensure comparisons with saved stock ships work correctly
  * Add 'Racer' role
  * Tidy up shipyard page; remove units from data columns and re-order for legibility
  * Allow basic drag/drop functionality in Edge/Internet Explorer 11 browser
  * Provide separate special effects for dumbfire and seeker missiles
  * Include special effect modifiers in blueprint tooltip
  * Use coriolis-data 2.3.4:
    * Add missing Long Range blueprint to multi-cannon
    * Fix values for thermal load of focused weapon grade 4
    * Fix internal module information for power plant blueprints
    * Add 'FSD Interrupt' special to dumbfire missile racks; this module now has `specials_S` and `specials_D` keys for specials to differentiate

#2.3.3
  * Remove unused blueprint when hitting reset
  * Add 'purchase module' external link to EDDB for refit items
  * Use coriolis-data 2.3.3:
    * Add Felicity Farseer to list of engineers that supply sensor and detailed surface scanner modifications

#2.3.2
  * Use scan range for DSS rather than scan time
  * Fix companion API import of Dolphin
  * Use coriolis-data 2.3.2:
    * Separate scan time and scan range
    * Add Frontier IDs for new items in 2.3
    * Update ownership of module blueprints for sensors and scanners
    * Update railgun penetration

#2.3.0
  * Make scan time visible on scanners where available
  * Update power distributor able-to-boost calculation to take fractional MJ values in to account
  * Revert to floating header due to issues on iOS
  * Fix issue where new module added to a slot did not reset its enabled status
  * Show integrity value for relevant modules
  * Reset old modification values when a new roll is applied
  * Fix issue with miner role where refinery would not be present in ships with class 5 slots but no class 4
  * Ensure that boost value is set correctly when modifications to power distributor enable/disable boost
  * Ensure that hull reinforcement modifications take the inherent resistance in to account when calculating modification percentages
  * Add tooltip for blueprints providing details of the features they alter, the components required for the blueprint and the engineer(s) who cam craft them
  * Use opponent's saved pips if available
  * Ignore rounds per shot for EPS and HPS calculations; it's already factored in to the numbers
  * Ensure that clip size modification imports result in whole numbers
  * Rework of separate offence/defence/movement sections to a unified interface
  * Use cargo hatch information on import if available
  * Additional information of power distributor pips, boost, cargo and fuel loads added to build
  * Additional information of opponent and engagement range added to build
  * Reworking of offence, defence and movement information in to separate tabs as part of the outfitting screen:
    * Power and costs section provides the existing 'Power' and 'Costs' sections
    * Profiles section provides a number of graphs that show how various components of the build (top speed, sustained DPS against opponent's shields and armour etc) are affected by mass, range, etc.
    * Offence section provides details of your build's damage distribution and per-weapon effectiveness. It also gives summary information for how long it will take for your build to wear down your opponent's shields and armour
    * Defence section provides details of your build's defences against your selected opponent. It provides details of the effectiveness of your resistances of both shields and armour, and effective strength of each as a result. It also provides key metrics around shield longevity and recovery times, as well as module protection
  * Fix power band marker to show safe power limit at 40% rather than 50%
  * Restyle blueprint list to improve consistency with similar menus
  * Use coriolis-data 2.3.0:
    * Add Dolphin
    * Add turreted mining lasers
    * Add long range / wide angle / fast scan scanner blueprints
    * Fix EDDB IDs for class 5 and 7 fighter hangars for correct shopping list
    * Fix cost for rocket-propelled FSD disruptor
    * Add module names for blueprints
    * Fix erroneous value for grade 5 kinetic shield booster
    * Add missing integrity values for some modules
    * Update module reinforcement package integrity
    * Update specs of Beluga as per 2.3
    * Update specs of Asp Scout as per 2.3
    * Update specs of Diamondback Explorer as per 2.3
    * Add ED ID for Rocket Propelled FSD Disruptor
    * Fix ED name for target lock breaker special
    * Update scan range and angle information for sensors
    * Tidy up shield cell bank information to allow for accurate calculations with modifications
    * Update mine launcher stats
    * Add appropriate engineers to per-module blueprint information

#2.2.19
  * Power management panel now displays modules in descending order of power usage by default
  * Shot speed can no longer be modified directly.  Its value is derived from the range modifier for Long Range and Focused modifications
  * Ensure that jump range chart updates when fuel slider is changed
  * Add 'Engine profile' and 'FSD profile' charts.  These show how your maximum speed/jump range will alter as you alter the mass of your build
  * Use coriolis-data 2.2.19:
    * Remove shot speed modification - it is directly tied to range
    * Fix incorrect minimal mass for 3C bi-weave shield generator

#2.2.18
  * Change methodology for calculating explorer role; can result in lighter builds
  * Tidy up layout for module selection and lay everything out in a consistent best-to-worst for both class and grade
  * Make integrity for module reinforcement packages visible
  * Clean up breakpoints for modules in available modules list; stops 7- or 8- module long lines
  * Add damager/range graphs to damage dealt
  * Reorder panels
  * Use coriolis-data 2.2.18:
    * Correct lower efficiency value to be better, not worse

#2.2.17
  * Use in-game terminology for shield generator optmul and optmass items
  * Add crew to shipyard and outfitting page information
  * Use coriolis-data 2.2.17:
    * Add mass as potential SCB modification
    * Fix mining laser statistics
    * Remove non-existent grade 4 and 5 wake scanner modifications
    * Add number of crew for each ship

#2.2.16
  * Fix 'Extreme' blueprint roll where some incorrect ranges were chosen
  * Use coriolis-data 2.2.16:
    * Fix incorrect thermal load modifiers for dirty drives
    * Provide explicit information about if values are higher numeric value == better or not

#2.2.15
  * Ensure that standard slots are repainted when any component changes
  * Reload page if Safari throws a security error
  * Handle import of ships with incorrectly-sized slots
  * Add 'Extreme' blueprint roll: best beneficial and worst detrimental outcome (in place of 'Average' roll)
  * Display information about Microsoft browser issues when an import fails
  * Add 'purchase this build' icon link to EDDB
  * Add 'miner' and 'shielded miner' ship roles
  * Use coriolis-data 2.2.15:
    * Fix location of initial cargo rack for Vulture
    * Fix broken regeneration rate for 6B shield generators
    * Tidy up breach damage values

#2.2.14
  * Ensure that jitter is shown correctly when the result of a special effect
  * Use restyled blueprint information
  * Use the ship name (if available) rather than the ship model for the window title
  * Use coriolis-data 2.2.14:
    * Alter blueprint structure to combine components and features
    * Make hidden value of modifications its own attribute
    * Fix incorrect ED ID for class 6 passenger cabins

#2.2.13
  * Add 'time to drain' summary value.  This is the time to drain the WEP capacitor if firing all enabled weapons
  * Do not include utility slot DPS/EPS/HPS in summary information
  * Ensure that auto loader special shows in the tooltip
  * Ensure that ship mass is recalculated when appropriate
  * Use coriolis-data 2.2.13:
    * Add plasma slug special effect for plasma accelerator
    * Tweak hull costs of ships

#2.2.12
  * Tidy up old references to coriolis.io
  * Add ability to add and remove special effects to weapon modifications
  * Add weapon engineering information to Damage Dealt section
  * Change shortcut for link from ctrl-l to ctrl-o to avoid clash with location bar
  * Only show one of power generation or draw in tooltips, according to module
  * Use coriolis-data 2.2.12:
    * Add special effects for each blueprint
    * Add IDs for most Powerplay modules

#2.2.11
  * Add help system and initial help file
  * Make absolute damage visible
  * Add 'average' roll for blueprints
  * Update spacing for movement summary to make it more readable
  * Provide damage dealt statistics for both shields and hull
  * Damage dealt panel only shows enabled weapons
  * Add engagement range to damage received panel
  * Handle burst rate of fire as an absolute number rather than a perentage modification
  * Ensure that clip values are always rounded up
  * Ensure that focused weapon mod uses range modifier to increase falloff as well
  * Use coriolis-data 2.2.11:
    * Remove non-existent chaff launcher capacity blueprint grades
    * Fix incorrect values for charge enhanced power distributor
    * Remove incorrect AFMU blueprints
    * Correct fragment cannon Double Shot blueprint information
    * Correct Focused weapon blueprint information

#2.2.10
  * Fix detailed export of module reinforcement packages
  * Use damagedist for exact breakdown of weapons that have more than one type of damage
  * Use new-style modification validity data
  * Provide ability to select engineering blueprint and roll sample values for them
  * Use coriolis-data 2.2.10:
    * Fix incorrect base shield values for Cutter and Corvette
    * Update weapons to have %-based damage distributions
    * Remove power draw for detailed surface scanner - although shown in outfitting it is not part of active power
    * Fix incorrect names for lightweight and kinetic armour
    * Add engineering blueprints

#2.2.9
  * Use SSL-enabled server for shortlinks
  * Add falloff for weapons
  * Use falloff when calculating weapon effectiveness in damage dealt
  * Add engagement range slider to 'Damage Dealt' section to allow user to see change in weapon effectiveness with range
  * Use better DPE calculation methodology
  * Add total DPS and effectiveness information to 'Damage Dealt' section
  * Use coriolis-data 2.2.9:
    * Add falloff metric for weapons
    * Add falloff from range modification

#2.2.8
  * Fix issue where filling all internals with cargo racks would include restricted slots
  * Use coriolis-data 2.2.8:
    * Set military slot of Viper Mk IV to class 3; was incorrectly set as class 2
    * Update base regeneration rate of prismatic shield generators to values in 2.2.03
    * Update specials with information in 2.2.03

#2.2.7
  * Fix resistance diminishing return calculations
  * Do not allow -100% to be entered as a modification value

#2.2.6
  * Add pitch/roll/yaw information
  * Use combination of pitch, roll and yaw to provide a more useful agility metric
  * Add movement summary to outfitting page
  * Add standard internal class sizes to shipyard page
  * Fix issue when importing Viper Mk IV
  * Ensure ordering of all types of modules (standard, internal, utilities) is consistent
  * Add rebuilds per bay information for fighter hangars
  * Add ability to show military compartments
  * Show module reinforcement package results in defence summary
  * Use separate speed/rotation/acceleration multipliers for thrusters if available
  * Obey restricted slot rules when adding all for internal slots
  * Version URLs to handle changes to ship specifications over time
  * Do not include disabled shield boosters in calculations
  * Add 'Damage dealt' section
  * Add 'Damage received' section
  * Add 'Piercing' information to hardpoints
  * Add 'Hardness' information to ship summary
  * Add module copy functionality - drag module whilst holding 'alt' to copy
  * Add base resistances to defence summary tooltip
  * Update shield recovery/regeneration calculations
  * Pin menu to top of page
  * Switch to custom shortlink method to avoid google length limitations
  * Ensure that information is not lost on narrow screens
  * Do not lose ship selector selection on narrow screens
  * Reinstate jump range graph
  * Use coriolis-data 2.2.6:
    * Update weapons with changed values for 2.2.03
    * Add individual pitch/roll/yaw statistics for each ship
    * Remove old and meaningless agility stat
    * Use sane order for multi-module JSON - coriolis can re-order as it sees fit when displaying modules
    * Fix cost of fighter hangars
    * Update Powerplay weapons with current statistics
    * Add separate min/opt/max multipliers for enhanced thrusters for speed, acceleration and rotation
    * Add module reinforcement packages
    * Add military compartments
    * Fix missing damage value for 2B dumbfires
    * Update shield recharge rates
    * Reduce hull mass of Viper to 50T
    * Fix incorrect optimal mass value for 8A thrusters
    * Add power draw for detailed surface scanner

#2.2.5
  * Calculate rate of fire for multi-burst weapons
  * Add note to disable ghostery in error situation
  * Use coriolis-data 2.2.5:
    * Fix incorrect ID for emissive munitions special
    * Fix rate of fire for burst lasers
    * Add fragment cannon modifications
    * Fix internal name of dazzle shell

#2.2.4
  * Add shortlink for outfitting page
  * Use coriolis-data 2.2.4:
    * Fix incorrect ID for class 5 luxury passenger cabin
    * Add damage type modifier
    * Change modifications from simple strings to objects, to allow more data-driven behaviour
    * Add special effects
  * Modification tooltip now shows special effect

#2.2.3
  * Fix hull boost calculation - now shows correct % modifier and total armour
  * Fix import of DiamondBack - can now be imported
  * Fix import of Beluga - can now be imported
  * Use coriolis-data 2.2.3:
    * Fix mismatch between class 5 and class 7 fighter hangars - now shows correct module
    * Add details for concordant sequence special effect - now shows correct damage
    * Fix details for thermal shock special effect - now shows correct damage
    * Add engineer blueprints
  * Modification tooltip now shows name and grade of modifications for imported builds
  * Retain import URL unless user changes the build - allows future updates of Coriolis to take advantage of additional build information

#2.2.2
  * Update DPS/HPS/EPS in real-time as modifiers change
  * Use coriolis-data 2.2.2:
    * Add distributor draw modifier to shield generators
    * Remove modifiers for sensors
    * Add initial loadout passenger cabins for Beluga
    * Add initial loadout passenger cabins for Orca
    * Update costs and initial loadouts for Keelback and Type-7
    * Add resistances for hull reinforcement packages
    * Added modifier actions to create modifications from raw data
  * Show modification icon for modified modules
  * Take modifications in to account when deciding whether to issue a warning on a standard module
  * Fix hardpoint comparison DPS number when selecting an alternate module
  * Ensure that retrofit tab only shows changed modules
  * Fix import and export of ships with modifications, bump schema version to 4
  * Enable boost display even if power distributor is disabled
  * Calculate breakdown of ship offensive and defensive stats
  * Add 'Offence summary' and 'Defence summary' components
  * Add ability to import from companion API output through import feature
  * Add ability to import from companion API output through URL
