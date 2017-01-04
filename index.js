const program = require('commander');
require('console.table');
const config = require('./config');
const metadata = require('./metadata');
const matches = require('./matches');
const events = require('./events');
const carnage = require('./carnage');
const async = require('neo-async');
const mapsTable = require('./maps-table');
const usersTable = require('./users-table');
const strongholdsTable = require('./strongholds-table');
const ctfTable = require('./ctf-table');
const weaponsTable = require("./weapons-table");
const awardsTable = require("./awards-table");

program
	.version('1.0.0')
	.option('-s, --skip [skip]', 'The number of games halo-tracker should skip before it begins looking for a session', parseInt)
	.option('-c --count [count]', 'The number of games halo-tracker should include in this batch of stats', parseInt)
	.option('-c --allow-customs [allowCustoms]', 'The number of games halo-tracker should include in this batch of stats', parseInt)
	.parse(process.argv);

program.args.forEach(gamertag => {
	config.set('user', gamertag);
});

const fetchAllDataForMatch = (matchId, carnageReportUrl, friendlyTeamId, cb) => {
		console.info(`Fetching carnage report and match events for ${matchId}`);
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

	matches.getMatches({
		gamertag: program.args[0],
		skip: program.skip || 0,
		count: program.count,
		allowCustoms: program.allowCustoms || false
	}, (err, matchesData) => {
		if (err) {
			console.error(`Error fetching matches: ${err}`);
			process.exit(1);
			return;
		}

		// for each match of our session, hit the carnage report api and the match events api, and put together some interesting stats
		async.series(matchesData.map(match => fetchAllDataForMatch.bind(null, match.Id.MatchId, match.Links.StatsMatchDetails.Path, match.Players[0].TeamId)), (err, allMatchData) => {
			if (err) {
				console.error(`Error fetching carnage reports: ${err}`);
				process.exit(1);
				return;
			}

			console.table(mapsTable.getMapsTable(allMatchData));
			const userData = usersTable.getUsersTable(allMatchData);
			console.table(userData);
			console.table(weaponsTable.getWeaponsTable(allMatchData));
			console.table(strongholdsTable.getStrongholdsTable(allMatchData));
			console.table(ctfTable.getCtfTable(allMatchData));
			console.log(awardsTable.getAwardsTable(allMatchData, userData));
		});
	});
});
