const program = require('commander');
const request = require('request');
require('console.table');

var axios = require('axios');
var Bottleneck = require('bottleneck');

var limiter = new Bottleneck(1, 1200); // limit api requests to 10 in 10 seconds
const API_KEY = '0e57e715-1226-4845-90c5-5b871dd18ae4';
const getMatchesUrl = gamertag => `https://www.haloapi.com/stats/h5/players/${gamertag}/matches?count=15`;
const getMatchEventsUrl = matchId => `https://www.haloapi.com/stats/h5/matches/${matchId}/events`;

const HALO_CE_PERFECT_MEDAL_ID = 3992195104;
const CARBINE_PERFECT_MEDAL_ID = 3098362934;
const LIGHTRIFLE_PERFECT_MEDAL_ID = 2279899989;
const DMR_PERFECT_MEDAL_ID = 370413844;
const MAGNUM_PERFECT_MEDAL_ID = 3653057799;
const BR_PERFECT_MEDAL_ID = 1080468863;

const FLAG_PULL_IMPULSE_ID = 1039658009;
const FLAG_CAPPED_IMPULSE_ID = 2944278681;
const FLAG_RETURNED_IMPULSE_ID = 1063951891;
const FLAG_PICK_UP_IMPULSE_ID = 4191318012;
const FLAGNUM_KILLS_IMPULSE_ID = 3514632335;
const FLAG_CARRIER_KILL_IMPULSE_ID = 2299858338;
const FLAG_DROP_IMPULSE_ID = 3435524855;

const STRONGHOLD_CAPTURE_ASSIST_MEDAL_ID = 1637841390;
const STRONGHOLD_SECURED_MEDAL_ID = 2916014239;
const STRONGHOLD_CAPTURE_MEDAL_ID = 3565443938;
const STRONGHOLD_DEFENSE_MEDAL_ID = 1351381581;

// loadout weapons to calculate accuracy
const MAGNUM_WEAPON_ID = 4096745987;
const AR_WEAPON_ID = 313138863;

// rifles to calculate rifle accuracy
const LIGHTRIFLE_WEAPON_ID = 2511447508;
const DMR_WEAPON_ID = 523953283;
const BATTLE_RIFLE_WEAPON_ID = 424645655;
const CARBINE_WEAPON_ID = 4108759423;
const H2_BR_WEAPON_ID = 4222743534;

// power weapons to calculate turnovers
const ROCKET_LAUNCHER_WEAPON_ID = 723523180;
const SNIPER_RIFLE_WEAPON_ID = 669296699;
const PLASMA_CASTER_WEAPON_ID = 4054937266;
const FUEL_ROD_WEAPON_ID = 2670072722;
const SAW_WEAPON_ID = 2278207101;
const SCATTERSHOT_WEAPON_ID = 3808094875;
const SHOTGUN_WEAPON_ID = 3484334713;
const SWORD_WEAPON_ID = 2650887244;
const RAILGUN_WEAPON_ID = 3682788176;

program
	.version('1.0.0')
	.parse(process.argv);

const getMatches = (gamertag) => {
	return axios.get(getMatchesUrl(gamertag), {
		headers: {
			'Ocp-Apim-Subscription-Key': 'c4778a4ab06e40c39136923ae01c4245'
		}
	});
};

const getCarnageReportArena = (url) => {
	console.log("GCRA: ", url);
	return axios.get(url, {
		headers: {
			'Ocp-Apim-Subscription-Key': 'c4778a4ab06e40c39136923ae01c4245'
		}
	});
};

const getMatchEvents = (matchId) => {
	console.log("getMatchEvents: ", matchId);
	return axios.get(getMatchEventsUrl(matchId), {
		headers: {
			'Ocp-Apim-Subscription-Key': 'c4778a4ab06e40c39136923ae01c4245'
		}
	});
};

const getCarnageReportAndEvents = (url, matchId, matchInfo) => {
	return axios.all([
		limiter.schedule(getCarnageReportArena, url),
		limiter.schedule(getMatchEvents, matchId)
	])
	// returns an object for easier to follow logic
	.then(axios.spread((carnageResponse, matchEventResponse) => ({
		carnageReport: carnageResponse.data,
		matchEvents: matchEventResponse.data.GameEvents,
		matchInfo
	})));
};

const recordedUsers = [...program.args];
const recordedUserIndex = {};
recordedUsers.forEach(u => {
	recordedUserIndex[u] = true;
});

const getRecordedUsername = (actualName, isTeammate) => {
	if (recordedUserIndex[actualName]) {
		// this is a player that we care about as specified in our command line args
		return actualName;
	}
	if (isTeammate) {
		// hes on our team, so lets track him
		return 'Random Teammate';
	}
	return 'Opponent';
};

getMatches(program.args[0]).then(matchesResponse => {
	let aggregatedData = {
		users: {},
		result: []
	};

	// TODO a better way... filter out non arena games (1 arena, 2 campaign, 3 custom, 4 warzone)
	let endOfSession = 0;

	axios.all(
		matchesResponse.data.Results.filter((match, i) => {
			// find the first non arena game and make sure nothing after it is returned
			if (match.Id.GameMode !== 1) {
				endOfSession = i;
			}
			if (endOfSession) {
				return false;
			}
			return true;
		}).map(match => getCarnageReportAndEvents('https://www.haloapi.com/stats/' + match.Links.StatsMatchDetails.Path, match.Id.MatchId, {teamId: match.Players[0].TeamId})) // we're just passing the teamId down for ease of use later
	).then(matchDataResponseArray => {
		matchDataResponseArray.forEach(matchData => {
			// need to track who are teammates and who are for later when we go through event data
			let teammateIndex = {};

			matchData.carnageReport.PlayerStats.forEach(playerStats => {
				if (playerStats.TeamId === matchData.matchInfo.teamId) {
					teammateIndex[playerStats.Player.Gamertag] = true;
				}

				const currentUser = getRecordedUsername(playerStats.Player.Gamertag, matchData.matchInfo.teamId === playerStats.TeamId);

				if (!aggregatedData.users[currentUser]) {
					aggregatedData.users[currentUser] = {
						name: currentUser,
						kills: 0,
						deaths: 0,
						assists: 0,
						damageDealt: 0,
						damagePerDeath: 0,
						grenadeKills: 0,
						magnumDamage: 0,
						magnumHits: 0,
						magnumShots: 0,
						magnumAccuracy: 0,
						arDamage: 0,
						arHits: 0,
						arShots: 0,
						arAccuracy: 0,
						rifleHits: 0,
						rifleShots: 0,
						rifleAccuracy: 0,
						pWeaponKills: 0,
						pWeaponDamage: 0,
						pWeaponPickups: 0,
						perfectKills: 0,
						medals: 0,
						flagPulls: 0,
						flagsCapped: 0,
						flagsReturned: 0,
						flagnumKills: 0,
						flagCarrierKills: 0,
						sHCaptures: 0,
						sHAssists: 0,
						sHSecured: 0,
						sHDefense: 0,
						turnovers: 0
					};
					aggregatedData.result.push(currentUser);
				}

				// gather up the rifle data
				playerStats.WeaponStats.forEach(w => {
					switch (w.WeaponId.StockId) {
						case BATTLE_RIFLE_WEAPON_ID:
						case CARBINE_WEAPON_ID:
						case LIGHTRIFLE_WEAPON_ID:
						case DMR_WEAPON_ID:
						case H2_BR_WEAPON_ID:
							aggregatedData.users[currentUser].rifleHits += w.TotalShotsLanded;
							aggregatedData.users[currentUser].rifleShots += w.TotalShotsFired;
							break;
					}
				});

				const magnumStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === MAGNUM_WEAPON_ID)[0] || {};
				const arStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === AR_WEAPON_ID)[0] || {};

				const h2BRStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === H2_BR_WEAPON_ID)[0] || {};
				const bRStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === BATTLE_RIFLE_WEAPON_ID)[0] || {};
				const carbineStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === CARBINE_WEAPON_ID)[0] || {};
				const lightRifleStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === LIGHTRIFLE_WEAPON_ID)[0] || {};
				const dMRStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === DMR_WEAPON_ID)[0] || {};

				const allMedals = playerStats.MedalAwards;
				const allImpulses = playerStats.Impulses;

				// loop through all medals awarded to the player and count the ones we care about
				allMedals.forEach(m => {
					aggregatedData.users[currentUser].medals += m.Count;

					switch (m.MedalId) {
						case HALO_CE_PERFECT_MEDAL_ID:
						case CARBINE_PERFECT_MEDAL_ID:
						case DMR_PERFECT_MEDAL_ID:
						case MAGNUM_PERFECT_MEDAL_ID:
						case BR_PERFECT_MEDAL_ID:
						case LIGHTRIFLE_PERFECT_MEDAL_ID:
							aggregatedData.users[currentUser].perfectKills += m.Count;
							break;
						case STRONGHOLD_DEFENSE_MEDAL_ID:
							aggregatedData.users[currentUser].sHDefense += m.Count;
							break;
						case STRONGHOLD_CAPTURE_MEDAL_ID:
							aggregatedData.users[currentUser].sHCaptures += m.Count;
							break;
						case STRONGHOLD_SECURED_MEDAL_ID:
							aggregatedData.users[currentUser].sHSecured += m.Count;
							break;
						case STRONGHOLD_CAPTURE_ASSIST_MEDAL_ID:
							aggregatedData.users[currentUser].sHAssists += m.Count;
							break;
					}
				});

				// loop through all impulses for the player and count the ones we care about
				allImpulses.forEach(impulse => {
					switch (impulse.Id) {
						case FLAG_PULL_IMPULSE_ID:
							aggregatedData.users[currentUser].flagPulls += impulse.Count
							break;
						case FLAG_RETURNED_IMPULSE_ID:
							aggregatedData.users[currentUser].flagsReturned += impulse.Count
							break;
						case FLAG_CAPPED_IMPULSE_ID:
							aggregatedData.users[currentUser].flagsCapped += impulse.Count
							break;
						case FLAGNUM_KILLS_IMPULSE_ID:
							aggregatedData.users[currentUser].flagnumKills += impulse.Count
							break;
						case FLAG_CARRIER_KILL_IMPULSE_ID:
							aggregatedData.users[currentUser].flagCarrierKills += impulse.Count
							break;
					}
				});

				aggregatedData.users[currentUser].kills += playerStats.TotalKills;
				aggregatedData.users[currentUser].deaths += playerStats.TotalDeaths;
				aggregatedData.users[currentUser].assists += playerStats.TotalAssists;

				aggregatedData.users[currentUser].grenadeKills += playerStats.TotalGrenadeKills;

				aggregatedData.users[currentUser].damageDealt += Math.floor(
					// is there really no total damage stat???
					playerStats.TotalWeaponDamage
					+ playerStats.TotalMeleeDamage
					+ playerStats.TotalGroundPoundDamage
					+ playerStats.TotalGrenadeDamage
					+ playerStats.TotalPowerWeaponDamage
				);

				aggregatedData.users[currentUser].magnumDamage += Math.floor(magnumStats.TotalDamageDealt);
				aggregatedData.users[currentUser].magnumHits += magnumStats.TotalShotsLanded;
				aggregatedData.users[currentUser].magnumShots += magnumStats.TotalShotsFired;

				aggregatedData.users[currentUser].arDamage += Math.floor(arStats.TotalDamageDealt);
				aggregatedData.users[currentUser].arHits += arStats.TotalShotsLanded;
				aggregatedData.users[currentUser].arShots += arStats.TotalShotsFired;

				aggregatedData.users[currentUser].pWeaponKills += playerStats.TotalPowerWeaponKills;
				aggregatedData.users[currentUser].pWeaponDamage += Math.floor(playerStats.TotalPowerWeaponDamage);
				aggregatedData.users[currentUser].pWeaponPickups += playerStats.TotalPowerWeaponGrabs;

			});

			// TODO unnessary to do this right here? think it happens every match
			aggregatedData.result.forEach(tag => {
				aggregatedData.users[tag].magnumAccuracy = Math.floor(100 * aggregatedData.users[tag].magnumHits / aggregatedData.users[tag].magnumShots);
				aggregatedData.users[tag].arAccuracy = Math.floor(100 * aggregatedData.users[tag].arHits / aggregatedData.users[tag].arShots);
				aggregatedData.users[tag].rifleAccuracy = Math.floor(100 * aggregatedData.users[tag].rifleHits / aggregatedData.users[tag].rifleShots);
				aggregatedData.users[tag].damagePerDeath = Math.floor(aggregatedData.users[tag].damageDealt / aggregatedData.users[tag].deaths);
			});

			// dig through the matchEvents to get some other stats
			matchData.matchEvents.forEach((event, i) => {
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
							for (let j = i + 1; j < matchData.matchEvents.length; j++) {
								const futureEvent = matchData.matchEvents[j];
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
		});
		aggregatedData.result.sort((tagA, tagB) => {
			if (recordedUserIndex[tagA] && recordedUserIndex[tagB]) {
				return aggregatedData.users[tagB].kills - aggregatedData.users[tagA].kills
			}
			if (recordedUserIndex[tagB] && !recordedUserIndex[tagA]) {
				return 1;
			}
			if (!recordedUserIndex[tagB] && recordedUserIndex[tagA]) {
				return -1;
			}
		});

		// only keep the top 10;
		aggregatedData.result = aggregatedData.result.slice(0, 10);
		console.table(aggregatedData.result.map((tag) => aggregatedData.users[tag]));
		process.exit(0);
	}).catch(err => {
		console.warn('Error fetching carnage reports: ', err);
		process.exit(1);
	});
}).catch(err => {
	console.warn('Error fetching matches: ', err);
	process.exit(1);
});
