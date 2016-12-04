const request = require('request');
const config = require('./config');
const limiter = config.limiter;

module.exports.getCarnageReportData = function (partialUrl, friendlyTeamId, cb) {
	limiter.removeTokens(1, (err, remainingTokens) => {
		console.log("CARNAGE LIMITER ERR: ", err);
		console.log("REMAINING: ", remainingTokens);
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

			body.PlayerStats.forEach(p => {
				users[p.Player.Gamertag] = processPlayerStats(p, friendlyTeamId);
				if (p.TeamId === friendlyTeamId) {
					teams.friendly.ids[p.Player.Gamertag] = true;
					return;
				}
				if (p.TeamId !== friendlyTeamId) {
					teams.enemy.ids[p.Player.Gamertag] = true;
				}
			});

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
		grenadeKills: p.TotalGrenadeKills,
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
		sHAssists: 0,
		sHCaptures: 0,
		sHDefense: 0,
		sHSecures: 0,
		flagPulls: 0,
		flagReturns: 0,
		flagCaptures: 0,
		flagKills: 0,
		flagCarrierKills: 0,
		// these will manually incremented during the events processing
		pWeaponPickups: 0,
		turnovers: 0
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
			case 'Magnum':
				formattedStats.magnumShots = w.TotalShotsFired;
				formattedStats.magnumHits = w.TotalShotsLanded;
				formattedStats.magnumDmg = Math.floor(w.TotalDamageDealt);
				formattedStats.magnumKills = w.TotalKills;
				formattedStats.magnumHeadshots = w.TotalHeadshots;
				break;
			case 'Assault Rifle':
				formattedStats.arShots = w.TotalShotsFired;
				formattedStats.arHits = w.TotalShotsLanded;
				formattedStats.arDmg = Math.floor(w.TotalDamageDealt);
				formattedStats.arKills = w.TotalKills;
				formattedStats.arHeadshots = w.TotalHeadshots;
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
			case 'Stronghold Secured':
				formattedStats.sHSecures += m.Count;
				break;
			case 'Stronghold Captured':
				formattedStats.sHCaptures += m.Count;
				break;
			case 'Stronghold Defense':
				formattedStats.shDefense += m.Count;
				break;
			case 'Capture Assist':
				formattedStats.sHAssists += m.Count;
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
		}
	});

	return formattedStats;
}
