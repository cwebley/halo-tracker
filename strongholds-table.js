const config = require('./config');

const strongholdsTableBaseRow = {
	shCaptures: 0,
	shDefense: 0,
	shSecures: 0,
	shAssists: 0,
	lockdowns: 0,
	captureSprees: 0,
	totalControls: 0
};

module.exports.getStrongholdsTable = function (allMatchData) {
	let usersOverall = {
		entities: {
			all: Object.assign({
				name: 'All'
			}, strongholdsTableBaseRow)
		},
		result: ['all']
	};

	allMatchData.forEach((m, i) => {
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			if (!usersOverall.entities[friendlyTag]) {
				usersOverall.entities[friendlyTag] = Object.assign({
					name: friendlyTag
				}, strongholdsTableBaseRow);
				usersOverall.result.push(friendlyTag);
			}

			Object.keys(strongholdsTableBaseRow).forEach(key => {
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
	}, strongholdsTableBaseRow);

	usersOverall.result.forEach(user => {
		// add up all the random teammate stats so we can average them
		if (user !== 'all' && config.isRandomTeammate(user, true)) {
			Object.keys(strongholdsTableBaseRow).forEach(key => {
				randomTeammateStats[key] += usersOverall.entities[user][key];
			});
		}
	});
	// our final data structure has 'all', followed by the non random teammates...
	usersOverall.result = usersOverall.result.filter(user => user === 'all' || !config.isRandomTeammate(user, true))
	// ...plus the average stats for all of the random teammates
	usersOverall.result.push('Random Teammate');
	usersOverall.entities['Random Teammate'] = randomTeammateStats;

	// finally total control is not something that can be aggregated for the all row
	usersOverall.entities.all.totalControls = 'N/A';

	return usersOverall.result.map(u => usersOverall.entities[u]);
}
