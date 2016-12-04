const program = require('commander');
require('console.table');
const config = require('./config');
const metadata = require('./metadata');
const matches = require('./matches');
const events = require('./events');
const carnage = require('./carnage');
const async = require('neo-async');

program
	.version('1.0.0')
	.parse(process.argv);

const getMatchEvents = (matchId) => {
	console.log("getMatchEvents: ", matchId);
	return axios.get(getMatchEventsUrl(matchId), {
		headers: {
			'Ocp-Apim-Subscription-Key': config.API_KEY
		}
	});
};

program.args.forEach(gamertag => {
	config.set('user', gamertag);
});

const fetchAllDataForMatch = (matchId, carnageReportUrl, friendlyTeamId, cb) => {
		carnage.getCarnageReportData(carnageReportUrl, friendlyTeamId, (err, carnageData) => {
			if (err) {
				console.error(`Error fetching carnage report for match ${matchId}: ${err}`)
				cb(err);
				return;
			}

			// pass the carnageData in and update it with whatever we can tease out through the matchEvent api
			events.getEventData(matchId, carnageData, (err, finalMatchData) => {
				if (err) {
					console.error(`Error fetching event data for match ${matchId}: ${err}`);
					cb(err);
					return;
				}
				return cb(null, finalMatchData);
			});
		});
};

metadata.getMetadata((err, { maps, medals, impulses, weapons, gameTypes }) => {
	if (err) {
		console.error(`Error fetching metadata: ${err}`);
		process.exit(1);
		return;
	}

	matches.getMatches(program.args[0], (err, matchesData) => {
		if (err) {
			console.error(`Error fetching matches: ${err}`);
			process.exit(1);
			return;
		}

		// for each match of our session, hit the carnage report api and the match events api, and put together some interesting stats
		async.parallel(matchesData.map(match => fetchAllDataForMatch.bind(null, match.Id.MatchId, match.Links.StatsMatchDetails.Path, match.Players[0].TeamId)), (err, allMatchData) => {
			if (err) {
				console.error(`Error fetching carnage reports: ${err}`);
				process.exit(1);
				return;
			}
			console.log("DONE PARALLEL CARNAGE: ", allMatchData);


			let mapStats = {
				entities: {
					all: {
						mapName: 'all',
						totalWins: 0,
						totalGames: 0,
						turnoversOnWins: null,
						turnoversOnLosses: null
					}
				},
				result: ['all']
			};
			allMatchData.forEach(m => {
				if (!mapStats.entities[m.map]) {
					mapStats.entities[m.map] = {
						mapName: m.map,
						totalWins: 0,
						totalGames: 0,
						turnoversOnWins: null,
						turnoversOnLosses: null,
					};
					mapStats.result.push(m.map);
				}
				// total up all the turnovers for the friendly team (initial value of 0)
				const turnovers = Object.keys(m.teams.friendly.ids).reduce((prev, cur) => prev + m.users[cur].turnovers, 0);

				mapStats.entities.all.totalGames++;
				mapStats.entities[m.map].totalGames++;

				if (m.teams.friendly.win) {
					mapStats.entities.all.totalWins++
					if (!mapStats.entities.all.turnoversOnWins) {
						mapStats.entities.all.turnoversOnWins = 0;
					}
					mapStats.entities.all.turnoversOnWins += turnovers;

					mapStats.entities[m.map].totalWins++
					if (!mapStats.entities[m.map].turnoversOnWins) {
						mapStats.entities[m.map].turnoversOnWins = 0;
					}
					mapStats.entities[m.map].turnoversOnWins += turnovers;
				} else {
					if (!mapStats.entities.all.turnoversOnLosses) {
						mapStats.entities.all.turnoversOnLosses = 0;
					}
					mapStats.entities.all.turnoversOnLosses += turnovers;

					if (!mapStats.entities[m.map].turnoversOnLosses) {
						mapStats.entities[m.map].turnoversOnLosses = 0;
					}
					mapStats.entities[m.map].turnoversOnLosses += turnovers;
				}
			});
			console.table(mapStats.result.map(m => mapStats.entities[m]))
		});

		// avgStaringCSR: null,
		// avgEndingCSR: null,
		// averageOpponentCSR: null,
		// averageOpponentCSRWins: null,
		// averageOpponentCSRLosses: null
		// 			if (!aggregatedData.users[currentUser]) {
		// 				aggregatedData.users[currentUser] = {
		// 					name: currentUser,
		// 					kills: 0,
		// 					deaths: 0,
		// 					assists: 0,
		// 					damageDealt: 0,
		// 					damagePerDeath: 0,
		// 					grenadeKills: 0,
		// 					magnumDamage: 0,
		// 					magnumHits: 0,
		// 					magnumShots: 0,
		// 					magnumAccuracy: 0,
		// 					arDamage: 0,
		// 					arHits: 0,
		// 					arShots: 0,
		// 					arAccuracy: 0,
		// 					rifleHits: 0,
		// 					rifleShots: 0,
		// 					rifleAccuracy: 0,
		// 					pWeaponKills: 0,
		// 					pWeaponDamage: 0,
		// 					pWeaponPickups: 0,
		// 					perfectKills: 0,
		// 					medals: 0,
		// 					flagPulls: 0,
		// 					flagsCapped: 0,
		// 					flagsReturned: 0,
		// 					flagnumKills: 0,
		// 					flagCarrierKills: 0,
		// 					sHCaptures: 0,
		// 					sHAssists: 0,
		// 					sHSecured: 0,
		// 					sHDefense: 0,
		// 					turnovers: 0
		// 				};

	});
});
