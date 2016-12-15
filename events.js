const request = require('request');
const moment = require('moment');
const distance = require('euclidean-distance');
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
	// keep track of each possible kill-assist pairing as they come up
	let duos = {
		entities: {},
		result: []
	};
	events.forEach((originalEvent, originalEventIndex) => {
		if (originalEvent.EventName === 'Death') {
			// Death Disposition? friendly = 0, hostile = 1, neutral = 2
			if (originalEvent.DeathDisposition === 1) {
				if (!firstBloodFound) {
					firstBloodFound = true;
					carnageData.users[originalEvent.Killer.Gamertag].firstBlood++;
				}
				if (!originalEvent.Assistants.length) {
					carnageData.users[originalEvent.Killer.Gamertag].unassistedKills++;
				} else {
					// total assitants in death
					carnageData.users[originalEvent.Victim.Gamertag].totalAssistantsInDeath += originalEvent.Assistants.length;

					// duo kills
					if (carnageData.users[originalEvent.Killer.Gamertag].friendlyTeam) {
						// keep track of kill-assist pairings for teamates to determine best duo stat
						originalEvent.Assistants.forEach(assistant => {
							// duo name is the combination of the two gamertags, sorted alphabetically
							const duoName = [originalEvent.Killer.Gamertag, assistant.Gamertag].sort().join(' + ');
							if (!duos.entities[duoName]) {
								duos.result.push(duoName);
								duos.entities[duoName] = 0;
							}
							duos.entities[duoName]++;
						});
					}
				}
				if (!originalEvent.Victim) {
					console.log(" NO VICTIM FOR SOME REASON :", originalEvent);
					return;
				}

				// let's find out if the victim got perfected, reversed, or noscoped (medals always follow directly after deaths)
				// and if the Victim was holding a power weapon by checking the next 2 WeaponDrop (always after the medals) for the Victim:
				let dropEventsFound = 0;
				for (let medalOrDropEventIndex = originalEventIndex + 1; medalOrDropEventIndex < events.length; medalOrDropEventIndex++) {
					if (dropEventsFound >= 2 ) {
						break;
					}
					const medalOrDropEvent = events[medalOrDropEventIndex];

					// if we found a medal and it's a Perfect Kill, increment the Victim's perfectDeaths
					if (medalOrDropEvent.EventName === 'Medal' && medalOrDropEvent.Player.Gamertag === originalEvent.Killer.Gamertag) {
						if (config.isPerfectMedal(medalOrDropEvent.MedalId)) {
							// the killer was awarded a perfect kill (already handled in the carnage report)
							// increment the victim's perfectDeaths
							carnageData.users[originalEvent.Victim.Gamertag].perfectDeaths++;
						}
						if (config.get('medal', medalOrDropEvent.MedalId) === 'Reversal') {
							// the killer was awarded a reversal (already handled in the carnage report)
							// increment the victim's reversalDeaths
							carnageData.users[originalEvent.Victim.Gamertag].reversalDeaths++;
						}
						if (config.get('medal', medalOrDropEvent.MedalId) === 'Stuck') {
							// the killer was awarded a stick
							carnageData.users[originalEvent.Victim.Gamertag].stickyDeaths++;
						}
						if (config.get('medal', medalOrDropEvent.MedalId) === 'Snapshot' || config.get('medal', medalOrDropEvent.MedalId) === 'Airborne Snapshot') {
							// the killer was awarded a snapshot
							// increment the victim's noScopeDeaths
							carnageData.users[originalEvent.Victim.Gamertag].noScopeDeaths++;
						}
					}

					// if we found a WeaponDrop, and the guy that is dropping the weapon is the same guy that died in the originalEvent...
					if (medalOrDropEvent.EventName === 'WeaponDrop' && medalOrDropEvent.Player.Gamertag === originalEvent.Victim.Gamertag) {
						dropEventsFound++;
						if (config.isPowerWeapon(medalOrDropEvent.WeaponStockId)) {
							// ...AND the weapon dropped was powerweapon, credit the killer with a big game kill
							carnageData.users[originalEvent.Killer.Gamertag].bigGameKills++;
						}
					}
				}


				// find out how far away the killer was from the victim
				const killerLocation = originalEvent.KillerWorldLocation;
				const victimLocation = originalEvent.VictimWorldLocation;

				const killDistance = Math.round(100 * distance([killerLocation.x, killerLocation.y, killerLocation.z], [victimLocation.x, victimLocation.y, victimLocation.z])) / 100;
				carnageData.users[originalEvent.Killer.Gamertag].totalKillDistance += killDistance;


				if (originalEvent.IsMelee) {
					carnageData.users[originalEvent.Victim.Gamertag].meleeDeaths++;
					carnageData.users[originalEvent.Killer.Gamertag].meleeKills++;
					// return here so the melee doesnt ALSO count as a kill for that weapon
					return;
				}
				if (config.isPowerWeapon(originalEvent.KillerWeaponStockId)) {
					// died to a an enemy power weapon
					carnageData.users[originalEvent.Victim.Gamertag].powerWeaponDeaths++
				}
				if (config.isAuto(originalEvent.KillerWeaponStockId)) {
					carnageData.users[originalEvent.Killer.Gamertag].autoKills++
					// died to a an enemy auto
					carnageData.users[originalEvent.Victim.Gamertag].autoDeaths++
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Hydra Launcher') {
					// died to a an enemy hydra
					carnageData.users[originalEvent.Victim.Gamertag].hydraDeaths++
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Magnum') {

					// died to a an enemy magnum
					carnageData.users[originalEvent.Killer.Gamertag].longestMagnumKill = Math.max(carnageData.users[originalEvent.Killer.Gamertag].longestMagnumKill, killDistance);
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Assault Rifle') {
					// died to a an enemy AR
					carnageData.users[originalEvent.Killer.Gamertag].longestArKill = Math.max(carnageData.users[originalEvent.Killer.Gamertag].longestArKill, killDistance);
				}
				if (config.isRifle(originalEvent.KillerWeaponStockId)) {
					// died to a an enemy rifle
					carnageData.users[originalEvent.Killer.Gamertag].longestRifleKill = Math.max(carnageData.users[originalEvent.Killer.Gamertag].longestRifleKill, killDistance);
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'SPLINTER GRENADE') {
					// died to a an enemy splinter
					carnageData.users[originalEvent.Victim.Gamertag].splinterDeaths++
					// killed an enemy with a splinter
					carnageData.users[originalEvent.Killer.Gamertag].splinterKills++
				}
				if (config.get('weapon', originalEvent.KillerWeaponStockId) === 'Environmental Explosives') {
					// died to a barrel or something. there isn't always a victim which is strange but whatever.
					if (originalEvent.Victim) {
						carnageData.users[originalEvent.Victim.Gamertag].environmentalDeaths++;
					}
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

								// finally, if the drop was caused by a death, and the killer was an enemy, credit the killer with a forced TO
								for (let deathEventIndex = originalEventIndex + 1; deathEventIndex < dropEventIndex; deathEventIndex++) {
									const deathEvent = events[deathEventIndex];
									if (deathEvent.EventName === 'Death' && deathEvent.DeathDisposition === 1 && deathEvent.Victim.Gamertag === originalEvent.Player.Gamertag) {
										carnageData.users[deathEvent.Killer.Gamertag].forcedTurnovers++;
									}
								}
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
	carnageData.duos = duos;
	return carnageData;
}
