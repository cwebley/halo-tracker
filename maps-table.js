const mapsBaseRow = {
	wins: 0,
	losses: 0,
	streak: 0,
	bestStreak: 0,
	worstStreak: 0,
	winningTurnovers: 0,
	losingTurnovers: 0,
	turnoversPGOnWin: null,
	turnoversPGOnLoss: null,
	bestAvgCsrWin: null,
	bestTeamBeatenTags: null,
	worstAvgCsrLoss: null
};

module.exports.getMapsTable = function (allMatchData) {
	let mapStats = {
		entities: {
			all: Object.assign({
				name: 'All',
			}, mapsBaseRow)
		},
		result: ['all']
	};

	allMatchData.forEach(m => {
		if (!mapStats.entities[m.gametype]) {
			mapStats.entities[m.gametype] = Object.assign({
				name: m.gametype
			}, mapsBaseRow);
			mapStats.result.push(m.gametype);
		}
		if (!mapStats.entities[m.map]) {
			mapStats.entities[m.map] = Object.assign({
				name: m.map
			}, mapsBaseRow);
			mapStats.result.push(m.map);
		}

		// total up all the turnovers for the friendly team (initial value of 0)
		const teamTurnovers = Object.keys(m.teams.friendly.ids).reduce((prev, cur) => prev + m.users[cur].turnovers, 0);
		const enemyIds = Object.keys(m.teams.enemy.ids);
		let enemiesWithValidCSR = 0;
		const totalEnemyCsr = enemyIds.reduce((prev, cur) => {
			// if it's a brand new player or new season, csr can be null
			if (!m.users[cur].previousCsr) {
				return prev;
			}
			enemiesWithValidCSR++;
			return prev + m.users[cur].previousCsr.Csr;
		}, 0);
		const enemyAvgCsr = Math.floor(totalEnemyCsr / enemiesWithValidCSR);

		mapStats.result.forEach(mapOrGametype => {
			if (mapOrGametype !== 'all' && mapOrGametype !== m.gametype && mapOrGametype !== m.map) {
				return;
			}
			if (m.teams.friendly.win) {
				if (!mapStats.entities[mapOrGametype].bestAvgCsrWin) {
					mapStats.entities[mapOrGametype].bestAvgCsrWin = 0;
				}

				mapStats.entities[mapOrGametype].wins++;
				mapStats.entities[mapOrGametype].winningTurnovers += teamTurnovers;
				mapStats.entities[mapOrGametype].streak = mapStats.entities[mapOrGametype].streak > 0 ? mapStats.entities[mapOrGametype].streak + 1 : 1;
				if (mapStats.entities[mapOrGametype].streak > mapStats.entities[mapOrGametype].bestStreak) {
					mapStats.entities[mapOrGametype].bestStreak = mapStats.entities[mapOrGametype].streak;
				}

				if (enemyAvgCsr > mapStats.entities[mapOrGametype].bestAvgCsrWin) {
					mapStats.entities[mapOrGametype].bestAvgCsrWin = enemyAvgCsr;
					mapStats.entities[mapOrGametype].bestTeamBeatenTags = enemyIds.join(', ');
				}
			} else {
				mapStats.entities[mapOrGametype].losses++
				mapStats.entities[mapOrGametype].streak = mapStats.entities[mapOrGametype].streak < 0 ? mapStats.entities[mapOrGametype].streak - 1 : -1;
				if (mapStats.entities[mapOrGametype].streak < mapStats.entities[mapOrGametype].worstStreak) {
					mapStats.entities[mapOrGametype].worstStreak = mapStats.entities[mapOrGametype].streak;
				}
				mapStats.entities[mapOrGametype].losingTurnovers += teamTurnovers
				if (!mapStats.entities[mapOrGametype].worstAvgCsrLoss || enemyAvgCsr < mapStats.entities[mapOrGametype].worstAvgCsrLoss) {
					mapStats.entities[mapOrGametype].worstAvgCsrLoss = enemyAvgCsr;
				}
			}
		});
	});
	// go through each map removing the turnovers keys calculating the per game version
	mapStats.result.forEach(map => {
		if (mapStats.entities[map].wins) {
			mapStats.entities[map].turnoversPGOnWin = Math.floor(mapStats.entities[map].winningTurnovers / mapStats.entities[map].wins);
		}
		if (mapStats.entities[map].losses) {
			mapStats.entities[map].turnoversPGOnLoss = Math.floor(mapStats.entities[map].losingTurnovers / mapStats.entities[map].losses);
		}
		delete mapStats.entities[map].winningTurnovers;
		delete mapStats.entities[map].losingTurnovers;
		delete mapStats.entities[map].streak;
	});
	// sort by games played
	mapStats.result.sort((a, b) => {
		if (mapStats.entities[a].wins + mapStats.entities[a].losses > mapStats.entities[b].wins + mapStats.entities[b].losses) {
			return -1;
		}
		if (mapStats.entities[a].wins + mapStats.entities[a].losses < mapStats.entities[b].wins + mapStats.entities[b].losses) {
			return 1;
		}
		return 0;
	});
	return mapStats.result.map(m => mapStats.entities[m]);
}
