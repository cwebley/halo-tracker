const config = require('./config');

const weaponsTableBaseRow = {
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
	rifleHits: 0,
	rifleShots: 0,
	rifleAccuracy: 0,
	rifleDmg: 0,
	rifleHeadshots: 0,
	rifleKills: 0,
	totalGrenadeKills: 0,
	hydraKills: 0,
	autoKills: 0,
	autoDeaths: 0,
};

module.exports.getWeaponsTable = function (allMatchData) {
	let usersOverall = {
		entities: {
			all: Object.assign({
				name: 'All'
			}, weaponsTableBaseRow)
		},
		result: ['all']
	};

	allMatchData.forEach((m, i) => {
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			if (!usersOverall.entities[friendlyTag]) {
				usersOverall.entities[friendlyTag] = Object.assign({
					name: friendlyTag
				}, weaponsTableBaseRow);
				usersOverall.result.push(friendlyTag);
			}

			Object.keys(weaponsTableBaseRow).forEach(key => {
				usersOverall.entities.all[key] += m.users[friendlyTag][key];
				usersOverall.entities[friendlyTag][key] += m.users[friendlyTag][key];
			});
		});
	});

	// now we do whatever we need to do after we have aggregated all games
	const numberOfRandoms = usersOverall.result.reduce((randomCount, currentUser) => {
		if (currentUser === 'all' || !config.isRandomTeammate(currentUser, true)) {
			return randomCount;
		}
		return randomCount + 1;
	}, 0);

	const randomTeammateStats = Object.assign({
		name: 'Random Teammate'
	}, weaponsTableBaseRow);

	usersOverall.result.forEach(user => {
		usersOverall.entities[user].rifleAccuracy = Math.floor(100 * usersOverall.entities[user].rifleHits / usersOverall.entities[user].rifleShots);
		usersOverall.entities[user].magnumAccuracy = Math.floor(100 * usersOverall.entities[user].magnumHits / usersOverall.entities[user].magnumShots);
		usersOverall.entities[user].arAccuracy = Math.floor(100 * usersOverall.entities[user].arHits / usersOverall.entities[user].arShots);

		// add up all the random teammate stats so we can average them
		if (user !== 'all' && config.isRandomTeammate(user, true)) {
			Object.keys(weaponsTableBaseRow).forEach(key => {
				randomTeammateStats[key] += usersOverall.entities[user][key];
			});
		}
	});
	// our final data structure has 'all', followed by the non random teammates...
	usersOverall.result = usersOverall.result.filter(user => user === 'all' || !config.isRandomTeammate(user, true))
	// ...plus the average stats for all of the random teammates
	usersOverall.result.push('Random Teammate');
	usersOverall.entities['Random Teammate'] = randomTeammateStats;
	return usersOverall.result.map(u => usersOverall.entities[u]);
}
