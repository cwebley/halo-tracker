const program = require('commander');
const request = require('request');
require('console.table');

var axios = require('axios');
var Bottleneck = require('bottleneck');

var limiter = new Bottleneck(1, 1200); // limit api requests to 10 in 10 seconds
const API_KEY = '0e57e715-1226-4845-90c5-5b871dd18ae4';
const getMatchesUrl = gamertag => `https://www.haloapi.com/stats/h5/players/${gamertag}/matches`;

const HALO_CE_PERFECT_MEDAL_ID = 3992195104;
const CARBINE_PERFECT_MEDAL_ID = 3098362934;
const LIGHT_RIFLE_PERFECT_MEDAL_ID = 2279899989;
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

const MAGNUM_WEAPON_ID: 4096745987;
const AR_WEAPON_ID: 313138863;

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
	console.log("GCRA: ", url)
	return axios.get(url, {
		headers: {
			'Ocp-Apim-Subscription-Key': 'c4778a4ab06e40c39136923ae01c4245'
		}
	});
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
		}).map(match => {
		return limiter.schedule(getCarnageReportArena, 'https://www.haloapi.com/stats/' + match.Links.StatsMatchDetails.Path)
	})).then(carnageResponseArray => {
		carnageResponseArray.forEach(carnageResponse => {
			carnageResponse.data.PlayerStats.forEach(playerStats => {
				if (!aggregatedData.users[playerStats.Player.Gamertag]) {
					aggregatedData.users[playerStats.Player.Gamertag] = {
						name: playerStats.Player.Gamertag,
						kills: 0,
						deaths: 0,
						assists: 0,
						damageDealt: 0,
						magnumDamage: 0,
						magnumHits: 0,
						magnumShots: 0,
						magnumAccuracy: 0,
						arDamage: 0,
						arHits: 0,
						arShots: 0,
						arAccuracy: 0,
						pWeaponKills: 0,
						pWeaponDamage: 0,
						pWeaponPickups: 0,
						perfectKills: 0,
						medals: 0,
						flagPulls: 0,
						flagsCapped: 0,
						flagsReturned: 0,
						flagsPickedUp: 0,
						flagnumKills: 0,
						flagCarrierKills: 0,
						flagsDropped: 0,
						sHCaptures: 0,
						sHAssists: 0,
						sHSecured: 0,
						sHDefense: 0,
					};
					aggregatedData.result.push(playerStats.Player.Gamertag);
				}

				const magnumStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === MAGNUM_WEAPON_ID)[0] || {};
				const arStats = playerStats.WeaponStats.filter(weapon => weapon.WeaponId.StockId === AR_WEAPON_ID)[0] || {};
				const allMedals = playerStats.MedalAwards;
				const allImpulses = playerStats.Impulses;

				// loop through all medals awarded to the player and count the ones we care about
				allMedals.forEach(m => {
					aggregatedData.users[playerStats.Player.Gamertag].medals += m.Count;

					switch (m.MedalId) {
						case HALO_CE_PERFECT_MEDAL_ID:
						case CARBINE_PERFECT_MEDAL_ID:
						case DMR_PERFECT_MEDAL_ID:
						case MAGNUM_PERFECT_MEDAL_ID:
						case BR_PERFECT_MEDAL_ID:
						case LIGHT_RIFLE_PERFECT_MEDAL_ID:
							aggregatedData.users[playerStats.Player.Gamertag].perfectKills += m.Count;
							break;
						case STRONGHOLD_DEFENSE_MEDAL_ID:
							aggregatedData.users[playerStats.Player.Gamertag].sHDefense += m.Count;
							break;
						case STRONGHOLD_CAPTURE_MEDAL_ID:
							aggregatedData.users[playerStats.Player.Gamertag].sHCaptures += m.Count;
							break;
						case STRONGHOLD_SECURED_MEDAL_ID:
							aggregatedData.users[playerStats.Player.Gamertag].sHSecured += m.Count;
							break;
						case STRONGHOLD_CAPTURE_ASSIST_MEDAL_ID:
							aggregatedData.users[playerStats.Player.Gamertag].sHAssists += m.Count;
							break;
					}
				});

				// loop through all impulses for the player and count the ones we care about
				allImpulses.forEach(impulse => {
					switch (impulse.Id) {
						case FLAG_PULL_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagPulls += impulse.Count
							break;
						case FLAG_RETURNED_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagsReturned += impulse.Count
							break;
						case FLAG_CAPPED_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagsCapped += impulse.Count
							break;
						case FLAG_PICK_UP_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagsPickedUp += impulse.Count
							break;
						case FLAG_DROP_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagsDropped += impulse.Count
							break;
						case FLAGNUM_KILLS_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagnumKills += impulse.Count
							break;
						case FLAG_CARRIER_KILL_IMPULSE_ID:
							aggregatedData.users[playerStats.Player.Gamertag].flagCarrierKills += impulse.Count
							break;
					}
				});

				aggregatedData.users[playerStats.Player.Gamertag].kills += playerStats.TotalKills;
				aggregatedData.users[playerStats.Player.Gamertag].deaths += playerStats.TotalDeaths;
				aggregatedData.users[playerStats.Player.Gamertag].assists += playerStats.TotalAssists;
				aggregatedData.users[playerStats.Player.Gamertag].damageDealt += Math.floor(
					// is there really no total damage stat???
					playerStats.TotalWeaponDamage
					+ playerStats.TotalMeleeDamage
					+ playerStats.TotalGroundPoundDamage
					+ playerStats.TotalGrenadeDamage
					+ playerStats.TotalPowerWeaponDamage
				);

				aggregatedData.users[playerStats.Player.Gamertag].magnumDamage += Math.floor(magnumStats.TotalDamageDealt);
				aggregatedData.users[playerStats.Player.Gamertag].magnumHits += magnumStats.TotalShotsLanded;
				aggregatedData.users[playerStats.Player.Gamertag].magnumShots += magnumStats.TotalShotsFired;

				aggregatedData.users[playerStats.Player.Gamertag].arDamage += Math.floor(arStats.TotalDamageDealt);
				aggregatedData.users[playerStats.Player.Gamertag].arHits += arStats.TotalShotsLanded;
				aggregatedData.users[playerStats.Player.Gamertag].arShots += arStats.TotalShotsFired;

				aggregatedData.users[playerStats.Player.Gamertag].pWeaponKills += playerStats.TotalPowerWeaponKills;
				aggregatedData.users[playerStats.Player.Gamertag].pWeaponDamage += Math.floor(playerStats.TotalPowerWeaponDamage);
				aggregatedData.users[playerStats.Player.Gamertag].pWeaponPickups += playerStats.TotalPowerWeaponGrabs;

			});
			aggregatedData.result.forEach(tag => {
				aggregatedData.users[tag].magnumAccuracy = Math.floor(100 * aggregatedData.users[tag].magnumHits / aggregatedData.users[tag].magnumShots);
				aggregatedData.users[tag].arAccuracy = Math.floor(100 * aggregatedData.users[tag].arHits / aggregatedData.users[tag].arShots);
			});
		});
		aggregatedData.result.sort((tagA, tagB) => aggregatedData.users[tagB].kills - aggregatedData.users[tagA].kills);

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
