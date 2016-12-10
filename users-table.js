const config = require('./config');

const usersAggregateStatsRow = {
	kills: 0,
	deaths: 0,
	assists: 0,
	shotsFired: 0,
	shotsHit: 0,
	headshots: 0,
	dmgDealt: 0,
	dmgPerDeath: 0,
	medalCount: 0,
	perfectKills: 0,
	distractions: 0,
	pWeaponPickups: 0,
	pWeaponKills: 0,
	turnovers: 0,
	medalCount: 0,
	splinterDeaths: 0,
};

const usersNonAggregateStats = {
	startingCsr: 0,
	endingCsr: 0,
	totalStartingCsr: 0, // this key will be removed, used for getting the average csr for random teammates
	totalEndingCsr: 0, // this key will be removed, used for getting the average csr for random teammates
	gamesPlayed: 0
};

module.exports.getUsersTable = function (allMatchData) {
	let usersOverall = {
		entities: {
			all: Object.assign({
				name: 'All'
			}, usersAggregateStatsRow, usersNonAggregateStats)
		},
		result: ['all']
	};

	const matchCount = allMatchData.length;
	allMatchData.forEach((m, i) => {
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			if (!usersOverall.entities[friendlyTag]) {
				usersOverall.entities[friendlyTag] = Object.assign({
					name: friendlyTag
				}, usersAggregateStatsRow, usersNonAggregateStats);
				usersOverall.result.push(friendlyTag);
			}

			// this game is the last game of the session
			if (i === 0) {
				// get end of session csr for the people we care about
				if (!config.isRandomTeammate(friendlyTag, true)) {
					usersOverall.entities[friendlyTag].endingCsr = m.users[friendlyTag].currentCsr.Csr;
					// for the 'all' user, add up everyone's csr for an average calculated below. we'll need to add the randoms' average csr
					usersOverall.entities.all.totalEndingCsr += m.users[friendlyTag].currentCsr.Csr;
				}
			}

			// this is the first game of the session
			if (i === matchCount - 1) {
				// get start of session csr
				if (!config.isRandomTeammate(friendlyTag, true)) {
					usersOverall.entities[friendlyTag].startingCsr = m.users[friendlyTag].previousCsr.Csr;
					// for the 'all' user, add up everyone's csr for an average calculated below. we'll need to add the randoms' average csr
					usersOverall.entities.all.totalStartingCsr += m.users[friendlyTag].previousCsr.Csr;
				}
			}

			// for the Random Teammates we need to get the previous and currentCsr of every game and find an average change
			usersOverall.entities[friendlyTag].totalStartingCsr += m.users[friendlyTag].previousCsr.Csr;
			usersOverall.entities[friendlyTag].totalEndingCsr += m.users[friendlyTag].currentCsr.Csr;

			// add to the total team data
			Object.keys(usersAggregateStatsRow).forEach(key => {
				usersOverall.entities.all[key] += m.users[friendlyTag][key];
				usersOverall.entities[friendlyTag][key] += m.users[friendlyTag][key];
			});
			usersOverall.entities[friendlyTag].gamesPlayed++;
		});
	});
	// now we do whatever we need to do after we have aggregated all games
	const numberOfRandoms = usersOverall.result.reduce((randomCount, currentUser) => {
		if (currentUser === 'all' || !config.isRandomTeammate(currentUser, true)) {
			return randomCount;
		}
		return randomCount + 1;
	}, 0);

	// average csr for users in the session
	usersOverall.entities.all.startingCsr = Math.floor(usersOverall.entities.all.totalStartingCsr / (usersOverall.result.length - 1 - numberOfRandoms)) //divide by number of users in results minus the 'all' user and the randoms;
	usersOverall.entities.all.endingCsr = Math.floor(usersOverall.entities.all.totalEndingCsr / (usersOverall.result.length - 1 - numberOfRandoms));

	const randomTeammateStats = Object.assign({
		name: 'Random Teammate'
	}, usersAggregateStatsRow, usersNonAggregateStats);

	usersOverall.result.forEach(user => {
		// calculate dmgPerDeath now that we have all the damage deaths
		usersOverall.entities[user].dmgPerDeath = Math.floor(usersOverall.entities[user].dmgDealt / usersOverall.entities[user].deaths);

		// add up all the random teammate stats so we can average them
		if (user !== 'all' && config.isRandomTeammate(user, true)) {
			// calculate average starting and ending CSRs for random teammates
			usersOverall.entities[user].startingCsr = Math.floor(usersOverall.entities[user].totalStartingCsr / usersOverall.entities[user].gamesPlayed);
			usersOverall.entities[user].endingCsr = Math.floor(usersOverall.entities[user].totalEndingCsr / usersOverall.entities[user].gamesPlayed);

			Object.keys(usersOverall.entities[user]).forEach(key => {
				if (key === 'name' || key === 'dmgPerDeath' || key === 'rifleAccuracy' || key === 'arAccuracy') {
					return;
				}
				randomTeammateStats[key] += usersOverall.entities[user][key];
			});
		}

		// remove these keys since they're a little redundant and this table is already ginormous
		delete usersOverall.entities[user].rifleHits;
		delete usersOverall.entities[user].magnumHits;
		delete usersOverall.entities[user].arHits;
		delete usersOverall.entities[user].totalStartingCsr;
		delete usersOverall.entities[user].totalEndingCsr;
		delete usersOverall.entities[user].gamesPlayed;
	});

	// dmgPerDeath and accuracy stats cant be aggregated. need to be calculated here.
	randomTeammateStats.dmgPerDeath = Math.floor(randomTeammateStats.dmgDealt / randomTeammateStats.deaths);

	delete randomTeammateStats.rifleHits;
	delete randomTeammateStats.magnumHits;
	delete randomTeammateStats.arHits;
	delete randomTeammateStats.totalStartingCsr;
	delete randomTeammateStats.totalEndingCsr;
	delete randomTeammateStats.gamesPlayed;

	// finally, the startingCsr and endingCsrs for the random teammate need to be divided by number of random teammates
	randomTeammateStats.startingCsr = Math.floor(randomTeammateStats.startingCsr / numberOfRandoms);
	randomTeammateStats.endingCsr = Math.floor(randomTeammateStats.endingCsr / numberOfRandoms);

	// TODO and if there is more than one random teammate, divide by that number so the random stats are comparable

	// our final data structure has 'all', followed by the non random teammates...
	usersOverall.result = usersOverall.result.filter(user => user === 'all' || !config.isRandomTeammate(user, true))
	// ...plus the average stats for all of the random teammates
	usersOverall.result.push('Random Teammate');
	usersOverall.entities['Random Teammate'] = randomTeammateStats;
	return usersOverall.result.map(u => usersOverall.entities[u]);
}
