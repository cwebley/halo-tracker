const config = require('./config');

const usersOverallBaseRow = {
	kills: 0,
	deaths: 0,
	assists: 0,
	dmgDealt: 0,
	dmgPerDeath: 0,
	grenadeKills: 0,
	rifleHits: 0,
	rifleShots: 0,
	rifleAccuracy: 0,
	rifleDmg: 0,
	rifleHeadshots: 0,
	rifleKills: 0,
	magnumShots: 0,
	magnumHits: 0,
	magnumAccuracy: 0,
	magnumDmg: 0,
	magnumHeadshots: 0,
	magnumKills: 0,
	arShots: 0,
	arHits: 0,
	arAccuracy: 0,
	arDmg: 0,
	arKills: 0,
	medalCount: 0,
	perfectKills: 0,
	distractions: 0,
	pWeaponPickups: 0,
	pWeaponKills: 0,
	turnovers: 0,
	medalCount: 0,
	startingCsr: 0,
	endingCsr: 0,
	totalStartingCsr: 0, // this key will be removed, used for getting the average csr for random teammates
	totalEndingCsr: 0 // this key will be removed, used for getting the average csr for random teammates
};

module.exports.getUsersTable = function (allMatchData) {
	let usersOverall = {
		entities: {
			all: Object.assign({
				name: 'All'
			}, usersOverallBaseRow)
		},
		result: ['all']
	};

	const matchCount = allMatchData.length;
	// TODO random teammates logic doesnt work if there is more than 1 random
	allMatchData.forEach((m, i) => {
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			// if there are random teammates on the squad, we don't really care about their tags,
			//  just want them catagorized under the 'Random Teammate' umbrella
			
			const recordedName = config.getRecordedUsername(friendlyTag, m.users[friendlyTag].friendlyTeam);

			if (!usersOverall.entities[recordedName]) {
				usersOverall.entities[recordedName] = Object.assign({
					name: recordedName
				}, usersOverallBaseRow);
				usersOverall.result.push(recordedName);
			}

			// this game is the last game of the session
			if (i === 0) {
				// get end of session csr
				if (recordedName !== 'Random Teammates') {
					usersOverall.entities[recordedName].endingCsr = m.users[friendlyTag].currentCsr.Csr;
					// for the 'all' user, add up everyone's csr for an average calculated below
					usersOverall.entities.all.totalEndingCsr += m.users[friendlyTag].currentCsr.Csr;
				}
			}

			// this is the first game of the session
			if (i === matchCount - 1) {
				// get start of session csr
				if (recordedName !== 'Random Teammates') {
					usersOverall.entities[recordedName].startingCsr = m.users[friendlyTag].previousCsr.Csr;
					// for the 'all' user, add up everyone's csr for an average calculated below
					usersOverall.entities.all.totalStartingCsr += m.users[friendlyTag].previousCsr.Csr;
				}
			}

			// for the Random Teammates we need to get the previous and currentCsr of every game and find an average change
			usersOverall.entities[recordedName].totalStartingCsr += m.users[friendlyTag].previousCsr.Csr;
			usersOverall.entities[recordedName].totalEndingCsr += m.users[friendlyTag].currentCsr.Csr;

			// add to the total team data
			usersOverall.entities.all.kills += m.users[friendlyTag].kills;
			usersOverall.entities.all.deaths += m.users[friendlyTag].deaths;
			usersOverall.entities.all.assists += m.users[friendlyTag].assists;
			usersOverall.entities.all.dmgDealt += m.users[friendlyTag].dmgDealt;
			usersOverall.entities.all.grenadeKills += m.users[friendlyTag].grenadeKills;
			usersOverall.entities.all.rifleShots += m.users[friendlyTag].rifleShots;
			usersOverall.entities.all.rifleHits += m.users[friendlyTag].rifleHits;
			usersOverall.entities.all.rifleHeadshots += m.users[friendlyTag].rifleHeadshots;
			usersOverall.entities.all.rifleDmg += m.users[friendlyTag].rifleDmg;
			usersOverall.entities.all.rifleKills += m.users[friendlyTag].rifleKills;
			usersOverall.entities.all.magnumShots += m.users[friendlyTag].magnumShots;
			usersOverall.entities.all.magnumHeadshots += m.users[friendlyTag].magnumHeadshots;
			usersOverall.entities.all.magnumHits += m.users[friendlyTag].magnumHits;
			usersOverall.entities.all.magnumDmg += m.users[friendlyTag].magnumDmg;
			usersOverall.entities.all.magnumKills += m.users[friendlyTag].magnumKills;
			usersOverall.entities.all.arShots += m.users[friendlyTag].arShots;
			usersOverall.entities.all.arHits += m.users[friendlyTag].arHits;
			usersOverall.entities.all.arDmg += m.users[friendlyTag].arDmg;
			usersOverall.entities.all.arKills += m.users[friendlyTag].arKills;
			usersOverall.entities.all.pWeaponPickups += m.users[friendlyTag].pWeaponPickups;
			usersOverall.entities.all.pWeaponKills += m.users[friendlyTag].pWeaponKills;
			usersOverall.entities.all.turnovers += m.users[friendlyTag].turnovers;
			usersOverall.entities.all.perfectKills += m.users[friendlyTag].perfectKills;
			usersOverall.entities.all.distractions += m.users[friendlyTag].distractions;
			usersOverall.entities.all.medalCount += m.users[friendlyTag].medalCount;

			usersOverall.entities[recordedName].kills += m.users[friendlyTag].kills;
			usersOverall.entities[recordedName].deaths += m.users[friendlyTag].deaths;
			usersOverall.entities[recordedName].assists += m.users[friendlyTag].assists;
			usersOverall.entities[recordedName].dmgDealt += m.users[friendlyTag].dmgDealt;
			usersOverall.entities[recordedName].grenadeKills += m.users[friendlyTag].grenadeKills;
			usersOverall.entities[recordedName].rifleShots += m.users[friendlyTag].rifleShots;
			usersOverall.entities[recordedName].rifleHits += m.users[friendlyTag].rifleHits;
			usersOverall.entities[recordedName].rifleHeadshots += m.users[friendlyTag].rifleHeadshots;
			usersOverall.entities[recordedName].rifleDmg += m.users[friendlyTag].rifleDmg;
			usersOverall.entities[recordedName].rifleKills += m.users[friendlyTag].rifleKills;
			usersOverall.entities[recordedName].magnumShots += m.users[friendlyTag].magnumShots;
			usersOverall.entities[recordedName].magnumHeadshots += m.users[friendlyTag].magnumHeadshots;
			usersOverall.entities[recordedName].magnumHits += m.users[friendlyTag].magnumHits;
			usersOverall.entities[recordedName].magnumDmg += m.users[friendlyTag].magnumDmg;
			usersOverall.entities[recordedName].magnumKills += m.users[friendlyTag].magnumKills;
			usersOverall.entities[recordedName].arShots += m.users[friendlyTag].arShots;
			usersOverall.entities[recordedName].arHits += m.users[friendlyTag].arHits;
			usersOverall.entities[recordedName].arDmg += m.users[friendlyTag].arDmg;
			usersOverall.entities[recordedName].arKills += m.users[friendlyTag].arKills;
			usersOverall.entities[recordedName].pWeaponPickups += m.users[friendlyTag].pWeaponPickups;
			usersOverall.entities[recordedName].pWeaponKills += m.users[friendlyTag].pWeaponKills;
			usersOverall.entities[recordedName].turnovers += m.users[friendlyTag].turnovers;
			usersOverall.entities[recordedName].perfectKills += m.users[friendlyTag].perfectKills;
			usersOverall.entities[recordedName].distractions += m.users[friendlyTag].distractions;
			usersOverall.entities[recordedName].medalCount += m.users[friendlyTag].medalCount;
		});
	});
	// do some stuff after we have aggregated all games
	usersOverall.entities.all.startingCsr = Math.floor(usersOverall.entities.all.totalStartingCsr / usersOverall.result.length);
	usersOverall.entities.all.endingCsr = Math.floor(usersOverall.entities.all.totalEndingCsr / usersOverall.result.length);

	usersOverall.result.forEach(user => {
		if (user === 'Random Teammates') {
			usersOverall.entities[user].startingCsr = Math.floor(users.entities[user].totalStartingCsr / matchCount);
			usersOverall.entities[user].endingCsr = Math.floor(users.entities[user].totalEndingCsr / matchCount);
		}

		usersOverall.entities[user].dmgPerDeath = Math.floor(usersOverall.entities[user].dmgDealt / usersOverall.entities[user].deaths);
		usersOverall.entities[user].rifleAccuracy = Math.floor(100 * usersOverall.entities[user].rifleHits / usersOverall.entities[user].rifleShots);
		usersOverall.entities[user].magnumAccuracy = Math.floor(100 * usersOverall.entities[user].magnumHits / usersOverall.entities[user].magnumShots);


		// remove these keys since they're a little redundant and this table is already ginormous
		delete usersOverall.entities[user].rifleHits;
		delete usersOverall.entities[user].magnumHits;
		delete usersOverall.entities[user].arHits;
		delete usersOverall.entities[user].totalStartingCsr;
		delete usersOverall.entities[user].totalEndingCsr;
	});
	return usersOverall.result.map(u => usersOverall.entities[u]);
}
