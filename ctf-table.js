const config = require('./config');

const ctfTableBaseRow = {
	flagPulls: 0,
	flagReturns: 0,
	flagCaptures: 0,
	flagKills: 0,
	flagCarrierKills: 0,
	carrierProtects: 0,
	flagsDropped: 0,
	flagsPickedUp: 0,
	goalLineStands: 0,
	flagJousts: 0
};

module.exports.getCtfTable = function (allMatchData) {
	let usersOverall = {
		entities: {
			all: Object.assign({
				name: 'All'
			}, ctfTableBaseRow)
		},
		result: ['all']
	};

	allMatchData.forEach((m, i) => {
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			if (!usersOverall.entities[friendlyTag]) {
				usersOverall.entities[friendlyTag] = Object.assign({
					name: friendlyTag
				}, ctfTableBaseRow);
				usersOverall.result.push(friendlyTag);
			}

			Object.keys(ctfTableBaseRow).forEach(key => {
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
	}, ctfTableBaseRow);

	usersOverall.result.forEach(user => {
		// add up all the random teammate stats so we can average them
		if (user !== 'all' && config.isRandomTeammate(user, true)) {
			Object.keys(ctfTableBaseRow).forEach(key => {
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
