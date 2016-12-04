const mapsBaseRow = {
	wins: 0,
	losses: 0,
	objWins: 0,
	objLosses: 0,
	streak: 0,
	bestStreak: 0,
	worstStreak: 0,
	winningTurnovers: 0,
	losingTurnovers: 0,
	turnoversPGOnWin: null,
	turnoversPGOnLoss: null,
	bestAvgCsrWin: null,
	worstAvgCsrLoss: null
};

module.exports.getMapsTable = function (allMatchData) {
	let mapStats = {
		entities: {
			all: Object.assign({
				name: 'All'
			}, mapsBaseRow)
		},
		result: ['all']
	};

	allMatchData.forEach(m => {
		if (!mapStats.entities[m.map]) {
			mapStats.entities[m.map] = Object.assign({
				name: m.map
			}, mapsBaseRow);
			mapStats.result.push(m.map);
		}
		// total up all the turnovers for the friendly team (initial value of 0)
		const teamTurnovers = Object.keys(m.teams.friendly.ids).reduce((prev, cur) => prev + m.users[cur].turnovers, 0);
		const enemyIds = Object.keys(m.teams.enemy.ids);
		const totalEnemyCsr = enemyIds.reduce((prev, cur) => {
			// if it's a brand new player or new season, csr can be null
			if (!m.users[cur].previousCsr) {
				return prev;
			}
			return prev + m.users[cur].previousCsr.Csr;
		}, 0);
		const enemyAvgCsr = Math.floor(totalEnemyCsr / enemyIds.length);

		if (m.teams.friendly.win) {
			// update winning data for all maps
			mapStats.entities.all.wins++
			mapStats.entities.all.streak = mapStats.entities.all.streak > 0 ? mapStats.entities.all.streak + 1 : 1;
			if (mapStats.entities.all.streak > mapStats.entities.all.bestStreak) {
				mapStats.entities.all.bestStreak = mapStats.entities.all.streak;
			}
			mapStats.entities.all.winningTurnovers += teamTurnovers;

			// if this is the highest ranked team, record it
			if (enemyAvgCsr > mapStats.entities.all.bestAvgCsrWin) {
				mapStats.entities.all.bestAvgCsrWin = enemyAvgCsr;
			}

			// update winning data for this specific map
			mapStats.entities[m.map].wins++
			mapStats.entities[m.map].streak = mapStats.entities[m.map].streak > 0 ? mapStats.entities[m.map].streak + 1 : 1;
			if (mapStats.entities[m.map].streak > mapStats.entities[m.map].bestStreak) {
				mapStats.entities[m.map].bestStreak = mapStats.entities[m.map].streak;
			}
			mapStats.entities[m.map].winningTurnovers += teamTurnovers;
			if (enemyAvgCsr > mapStats.entities[m.map].bestAvgCsrWin) {
				mapStats.entities[m.map].bestAvgCsrWin = enemyAvgCsr;
			}
		} else {
			// update losing data for all maps
			mapStats.entities.all.losses++
			mapStats.entities.all.streak = mapStats.entities.all.streak < 0 ? mapStats.entities.all.streak - 1 : -1;
			if (mapStats.entities.all.streak < mapStats.entities.all.worstStreak) {
				mapStats.entities.all.worstStreak = mapStats.entities.all.streak;
			}
			mapStats.entities[m.map].losingTurnovers += teamTurnovers
			if (enemyAvgCsr < mapStats.entities.all.worstAvgCsrLoss) {
				mapStats.entities.all.worstAvgCsrLoss = enemyAvgCsr;
			}
			// update losing data for this specific map
			mapStats.entities[m.map].losses++
			mapStats.entities[m.map].streak = mapStats.entities[m.map].streak < 0 ? mapStats.entities[m.map].streak - 1 : -1;
			if (mapStats.entities[m.map].streak < mapStats.entities[m.map].worstStreak) {
				mapStats.entities[m.map].worstStreak = mapStats.entities[m.map].streak;
			}
			mapStats.entities[m.map].losingTurnovers += turnovers;
			if (enemyAvgCsr < mapStats.entities[m.map].worstAvgCsrLoss) {
				mapStats.entities[m.map].worstAvgCsrLoss = enemyAvgCsr;
			}
		}
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
	return mapStats.result.map(m => mapStats.entities[m]);
}
