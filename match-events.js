const axios = require('axios');

const aggregateMatchEventStats = (matchEvents) => {
	// dig through the matchEvents to get some other stats
	matchEvents.forEach((event, i) => {
		if (event.EventName === 'WeaponDrop') {
			switch (event.WeaponStockId) {
				case ROCKET_LAUNCHER_WEAPON_ID:
				case SNIPER_RIFLE_WEAPON_ID:
				case PLASMA_CASTER_WEAPON_ID:
				case SHOTGUN_WEAPON_ID:
				case SCATTERSHOT_WEAPON_ID:
				case FUEL_ROD_WEAPON_ID:
				case SAW_WEAPON_ID:
				case SWORD_WEAPON_ID:
				case RAILGUN_WEAPON_ID:
					// check future events to see who picked up the weapon
					for (let j = i + 1; j < matchEvents.length; j++) {
						const futureEvent = matchEvents[j];
						if (futureEvent.EventName === 'WeaponPickup' && futureEvent.WeaponStockId === event.WeaponStockId) {
							// if the team that picked up the weapon is different than the team that dropped the weapon, its a turnover
							if (teammateIndex[event.Player.Gamertag] !== teammateIndex[futureEvent.Player.Gamertag]) {
								aggregatedData.users[getRecordedUsername(event.Player.Gamertag, teammateIndex[event.Player.Gamertag])].turnovers++
							}
							break;
						}
					}
					break;

			}
		}
	});
};
