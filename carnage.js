const request = require('request');
const moment = require('moment');
const config = require('./config');
const limiter = config.limiter;

module.exports.getCarnageReportData = function (partialUrl, friendlyTeamId, cb) {
	limiter.removeTokens(1, (err, remainingTokens) => {
		request({
			method: 'GET',
			uri: config.BASE_STATS_URL + partialUrl,
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

			let users = {};
			let teams = {
				friendly: {
					// dictionary of teammate gamertag -> true so for easy determination of what team a player was on during event processing
					ids: {}
				},
				enemy: {
					// dictionary of enemy gamertag -> true
					ids: {}
				}
			};

			let mostKills = {
				name: '',
				value: null
			};
			let mostAssists = {
				name: '',
				value: null
			};
			let leastDeaths = {
				name: '',
				value: null
			};
			body.PlayerStats.forEach(p => {
				users[p.Player.Gamertag] = processPlayerStats(p, friendlyTeamId);
				// check if the user has most-most-least
				if (mostKills.value === null || p.TotalKills > mostKills.value) {
					mostKills.name = p.Player.Gamertag;
					mostKills.value = p.TotalKills;
				}
				if (mostAssists.value === null || p.TotalAssists > mostAssists.value) {
					mostAssists.name = p.Player.Gamertag;
					mostAssists.value = p.TotalAssists;
				}
				if (leastDeaths.value === null || p.TotalDeaths < leastDeaths.value) {
					leastDeaths.name = p.Player.Gamertag;
					leastDeaths.value = p.TotalDeaths;
				}

				if (p.TeamId === friendlyTeamId) {
					teams.friendly.ids[p.Player.Gamertag] = true;
					return;
				}
				if (p.TeamId !== friendlyTeamId) {
					teams.enemy.ids[p.Player.Gamertag] = true;
				}
			});

			if (mostKills.name && mostKills.name === mostAssists.name === leastDeaths.name) {
				users[mostKills.name].mostMostLeasts = 1;
			}

			body.TeamStats.forEach(t => {
				if (t.TeamId === friendlyTeamId) {
					teams.friendly.win = t.Rank === 1;
					teams.friendly.score = t.Score;
					return;
				}
				teams.enemy.win = t.Rank === 1;
				teams.enemy.score = t.Score;
			});

			cb(null, {
				users,
				teams,
				gametype: config.get('gametype', body.GameBaseVariantId),
				map: config.get('map', body.MapId)
			});
		});
	});
};

function processPlayerStats (p, friendlyTeamId) {
	const dmgDealt = Math.floor(p.TotalWeaponDamage + p.TotalMeleeDamage + p.TotalGroundPoundDamage + p.TotalGrenadeDamage + p.TotalPowerWeaponDamage);
	let formattedStats = {
		name: p.Player.Gamertag,
		friendlyTeam: p.TeamId === friendlyTeamId,
		previousCsr: p.PreviousCsr,
		currentCsr: p.CurrentCsr,
		kills: p.TotalKills,
		deaths: p.TotalDeaths,
		assists: p.TotalAssists,
		shotsFired: p.TotalShotsFired,
		shotsHit: p.TotalShotsLanded,
		headshots: p.TotalHeadshots,
		totalGrenadeKills: p.TotalGrenadeKills,
		dmgDealt,
		dmgPerDeath: Math.floor(dmgDealt / p.TotalDeaths),
		rifleDmg: 0,
		rifleHits: 0,
		rifleShots: 0,
		rifleHeadshots: 0,
		rifleKills: 0,
		pWeaponKills: 0,
		pWeaponDmg: 0,
		medalCount: 0,
		perfectKills: 0,
		distractions: 0,
		reversals: 0,
		shAssists: 0,
		shCaptures: 0,
		shDefense: 0,
		shSecures: 0,
		lockdowns: 0,
		captureSprees: 0,
		totalControls: 0,
		flagPulls: 0,
		flagReturns: 0,
		flagCaptures: 0,
		flagKills: 0,
		flagCarrierKills: 0,
		carrierProtects: 0,
		flagsDropped: 0,
		flagsPickedUp: 0,
		flagTime: 0,
		goalLineStands: 0,
		flagJousts: 0,
		gameSavers: 0,
		clutchKills: 0,
		doubleKills: 0,
		tripleKills: 0,
		overkillsAndBeyond: 0,
		mostMostLeasts: 0,

		// these will manually incremented during the events processing
		pWeaponPickups: 0,
		turnovers: 0,
		environmentalDeaths: 0,
		environmentalKills: 0,
		hydraDeaths: 0,
		hydraKills: 0,
		splinterDeaths: 0,
		splinterKills: 0,
		firstBlood: 0,
		unassistedKills: 0,
		friendlyKills: 0,
		barrelDestroys: 0,
		spartanChargeKills: 0,
		spartanChargeDeaths: 0,
		groundPoundKills: 0,
		groundPoundDeaths: 0,
		meleeDeaths: 0,
		meleeKills: 0,
		assassinationDeaths: 0,
		assassinationKills: 0,
		beatDownKills: 0,
		// beatDownDeaths: 0, // unfortunately there doesn't seem to be a great way to determine you got beat down from behind
		totalAssistantsInDeath: 0, // used to calculate average assistants per death
		forcedTurnovers: 0,
		bigGameKills: 0,
		powerWeaponDeaths: 0,
		perfectDeaths: 0,
		reversalDeaths: 0,
		noScopeDeaths: 0,
		autoKills: 0,
		autoDeaths: 0,
		stickyDeaths: 0,
	};

	p.WeaponStats.forEach(w => {
		if (config.isRifle(w.WeaponId.StockId)) {
			formattedStats.rifleShots += w.TotalShotsFired;
			formattedStats.rifleHits += w.TotalShotsLanded;
			formattedStats.rifleDmg += Math.floor(w.TotalDamageDealt);
			formattedStats.rifleKills += w.TotalKills;
			formattedStats.rifleHeadshots += w.TotalHeadshots;
			return;
		}
		if (config.isPowerWeapon(w.WeaponId.StockId)) {
			formattedStats.pWeaponDmg += Math.floor(w.TotalDamageDealt);
			formattedStats.pWeaponKills += w.TotalKills;
			return;
		}

		switch (config.get('weapon', w.WeaponId.StockId)) {
			case 'Flagnum':
				formattedStats.flagTime = moment.duration(w.TotalPossessionTime).seconds();
				break;
			case 'Hydra Launcher':
				formattedStats.hydraKills = w.TotalKills;
				break;
			case 'Magnum':
				formattedStats.magnumShots = w.TotalShotsFired || 0;
				formattedStats.magnumHits = w.TotalShotsLanded || 0;
				formattedStats.magnumDmg = Math.floor(w.TotalDamageDealt) || 0;
				formattedStats.magnumKills = w.TotalKills || 0;
				formattedStats.magnumHeadshots = w.TotalHeadshots || 0;
				break;
			case 'Assault Rifle':
				formattedStats.arShots = w.TotalShotsFired || 0;
				formattedStats.arHits = w.TotalShotsLanded || 0;
				formattedStats.arDmg = Math.floor(w.TotalDamageDealt) || 0;
				formattedStats.arKills = w.TotalKills || 0;
				formattedStats.arHeadshots = w.TotalHeadshots || 0;
				break;
		}
	});

	p.MedalAwards.forEach(m => {
		formattedStats.medalCount += m.Count;
		if (config.isPerfectMedal(m.MedalId)) {
			formattedStats.perfectKills += m.Count;
			return;
		}
		switch (config.get('medal', m.MedalId)) {
			case 'Distraction':
				formattedStats.distractions += m.Count;
				break;
			case 'Reversal':
				formattedStats.reversals += m.Count;
				break;
			case 'Stronghold Secured':
				formattedStats.shSecures += m.Count;
				break;
			case 'Stronghold Captured':
				formattedStats.shCaptures += m.Count;
				break;
			case 'Stronghold Defense':
				formattedStats.shDefense += m.Count;
				break;
			case 'Capture Assist':
				formattedStats.shAssists += m.Count;
				break;
			case 'Lockdown':
				formattedStats.lockdowns += m.Count;
				break;
			case 'Capture Spree':
				formattedStats.captureSprees += m.Count;
				break;
			case 'Total Control':
				formattedStats.totalControls += m.Count;
				break;
			case 'Flag Joust':
				formattedStats.flagJousts += m.Count;
				break;
			case 'Carrier Protected':
				formattedStats.carrierProtects += m.Count;
				break;
			case 'Stopped Short': // 'Goal Line Stand' seems to be a duplicate of this medal
				formattedStats.goalLineStands += m.Count;
				break;
			case 'Stopped Short': // 'Goal Line Stand' seems to be a duplicate of this medal
				formattedStats.goalLineStands += m.Count;
				break;
			case 'Clutch Kill':
				formattedStats.gameSavers += m.Count;
				break;
			case 'Game Saver':
				formattedStats.clutchKills += m.Count;
				break;
			case 'Beat Down':
				formattedStats.beatDownKills += m.Count;
				break;
			case 'Double Kill':
				formattedStats.doubleKills += m.Count;
				break;
			case 'Triple Kill':
				formattedStats.tripleKills += m.Count;
				break;
			case 'Overkill':
			case 'Killtacular':
			case 'Killtrocity':
			case 'Killamanjaro':
			case 'Killtastrophe':
			case 'Killpocalypse':
			case 'Killionaire':
				formattedStats.overkillsAndBeyond += m.Count;
				break;
		}
	});

	p.Impulses.forEach(i => {
		// unfortunately impulse names returned by the api have VeRy_Inc0ns1st3nts_formatting...
		switch (config.get('impulse', i.Id)) {
			case 'Flag Pulls':
				formattedStats.flagPulls += i.Count;
				break;
			case 'impulse_flag_returned':
				formattedStats.flagReturns += i.Count;
				break;
			case 'FlagCapturedImpulse':
				formattedStats.flagCaptures += i.Count;
				break;
			case 'Flag Kill':
				formattedStats.flagKills += i.Count;
				break;
			case 'Flag Carrier Kill Impulse':
				formattedStats.flagCarrierKills += i.Count;
				break;
			case 'Flag Dropped':
				formattedStats.flagsDropped += i.Count;
				break;
			case 'Flag Pickup':
				formattedStats.flagsPickedUp += i.Count;
				break;
		}
	});

	return formattedStats;
}
