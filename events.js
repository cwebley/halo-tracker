const request = require('request');
const moment = require('moment');
const config = require('./config');
const limiter = config.limiter;

module.exports.getEventData = function (matchId, carnageData, cb) {
	limiter.removeTokens(1, (err, remainingTokens) => {
		request({
			method: 'GET',
			uri: config.getMatchEventsUrl(matchId),
			json: true,
			headers: {
				'Ocp-Apim-Subscription-Key': config.API_KEY
			}
		}, function(err, response, body) {
			if (err) {
				cb(err);
				return;
			}

			if (response.statusCode > 399) {
				cb(new Error(response.statusCode + ': ' + body));
				return;
			}

			cb(null, processEventData(body.GameEvents, carnageData));
		});
	});
};

function processEventData (events, carnageData) {
	let firstBloodFound;
	events.forEach((originalEvent, originalEventIndex) => {
		if (originalEvent.EventName === 'Death') {
			if (originalEvent.DeathDisposition === 1) {
				if (!firstBloodFound) {
					firstBloodFound = true;
					carnageData.users[originalEvent.Killer.Gamertag].firstBlood++;
				}
				if (!originalEvent.Assistants.length) {
					carnageData.users[originalEvent.Killer.Gamertag].unassistedKills++;
				}
				if (originalEvent.IsMelee) {
					carnageData.users[originalEvent.Victim.Gamertag].meleeDeaths++;
					carnageData.users[originalEvent.Killer.Gamertag].meleeKills++;
					return;
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Hydra Launcher') {
					// died to a an enemy hydra
					carnageData.users[originalEvent.Victim.Gamertag].hydraDeaths++
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'SPLINTER GRENADE') {
					// died to a an enemy splinter
					carnageData.users[originalEvent.Victim.Gamertag].splinterDeaths++
					// killed an enemy with a splinter
					carnageData.users[originalEvent.Killer.Gamertag].splinterKills++
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Environmental Explosives') {
					// TODO confirm that environmental explosive deaths actually happen...
					// died to a barrel or something
					carnageData.users[originalEvent.Victim.Gamertag].environmentalDeaths++;
					// killed an enemy by shooting a barrel or something
					carnageData.users[originalEvent.Killer.Gamertag].environmentalKills++;
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Spartan') {
					if (originalEvent.IsShoulderBash) {
						carnageData.users[originalEvent.Victim.Gamertag].spartanChargeDeaths++;
						carnageData.users[originalEvent.Killer.Gamertag].spartanChargeKills++;
					} else if (originalEvent.IsGroundPound) {
						carnageData.users[originalEvent.Victim.Gamertag].groundPoundDeaths++;
						carnageData.users[originalEvent.Killer.Gamertag].groundPoundKills++;
					} else if (originalEvent.IsAssassination) {
						carnageData.users[originalEvent.Victim.Gamertag].assassinationDeaths++;
						carnageData.users[originalEvent.Killer.Gamertag].assassinationKills++;
					} else {
						// whatever is left here seems to be only spartan charges with the sword
						carnageData.users[originalEvent.Victim.Gamertag].spartanChargeDeaths++;
						carnageData.users[originalEvent.Killer.Gamertag].spartanChargeKills++;
						// also give the player credit for the power weapon kill
						carnageData.users[originalEvent.Killer.Gamertag].pWeaponKills++;
					}
				}
			}

			// player destroyed a barrel
			if (originalEvent.DeathDisposition === 2 && originalEvent.Killer) {
				carnageData.users[originalEvent.Killer.Gamertag].barrelDestroys++;
			}
			// suicide or betrayal
			if (originalEvent.DeathDisposition === 0) {
				carnageData.users[originalEvent.Killer.Gamertag].friendlyKills++;
			}
			return;
		}
		if (originalEvent.EventName === 'Death' && originalEvent.DeathDisposition === 2) { // Death Disposition? friendly = 0, hostile = 1, neutral = 2

		}

		// if a power weapon was picked up, lets track what happened to see if a turnover came out of it
		if (originalEvent.EventName === 'WeaponPickup' && config.isPowerWeapon(originalEvent.WeaponStockId)) {
			// count the powerWeapon pickup. this INCLUDES WeaponPadPickups
			carnageData.users[originalEvent.Player.Gamertag].pWeaponPickups++

			const pickupTimeInSeconds = moment.duration(originalEvent.TimeSinceStart).seconds();

			// check future events to see when the weapon was dropped
			for (let dropEventIndex = originalEventIndex + 1; dropEventIndex < events.length; dropEventIndex++) {
				const dropEvent = events[dropEventIndex];

				// if the same weapon was dropped by the same player that picked up the weapon...
				if (dropEvent.EventName === 'WeaponDrop' && dropEvent.WeaponStockId === originalEvent.WeaponStockId && dropEvent.Player.Gamertag === originalEvent.Player.Gamertag) {
					const dropTimeInSeconds = moment.duration(dropEvent.TimeSinceStart).seconds();
					// if the weapon was held onto for less than 5 seconds, lets not count it as a turnover
					if (dropTimeInSeconds - pickupTimeInSeconds <= 5) {
						return;
					}

					// the weapon was dropped more than 5 seconds after it was picked up, now lets check if an enemy snagged it later
					for (let enemyPickupIndex = dropEventIndex + 1; enemyPickupIndex < events.length; enemyPickupIndex++) {
						const enemyPickupEvent = events[enemyPickupIndex];

						// if the same weapon that was dropped was picked up by an enemy...
						if (enemyPickupEvent.EventName === 'WeaponPickup' && enemyPickupEvent.WeaponStockId === originalEvent.WeaponStockId) {

							// if the team that picked up the weapon is different than the team that dropped the weapon, its a turnover
							if (carnageData.users[originalEvent.Player.Gamertag].friendlyTeam !== carnageData.users[enemyPickupEvent.Player.Gamertag].friendlyTeam) {
								carnageData.users[originalEvent.Player.Gamertag].turnovers++
							}
							// the weapon was picked up. regardless of turnover status we are done checking future events.
							return;
						}
					}
					// weapon was dropped less than 5 seconds after it was picked up. player didn't really have control
					return;
				}
			}
		}
	});

	return carnageData;
}
