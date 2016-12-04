const program = require('commander');
require('console.table');
const config = require('./config');
const metadata = require('./metadata');
const matches = require('./matches');
const events = require('./events');
const carnage = require('./carnage');
const async = require('neo-async');

const axios = require('axios');

const HALO_CE_PERFECT_MEDAL_ID = 3992195104;
const CARBINE_PERFECT_MEDAL_ID = 3098362934;
const LIGHTRIFLE_PERFECT_MEDAL_ID = 2279899989;
const DMR_PERFECT_MEDAL_ID = 370413844;
const MAGNUM_PERFECT_MEDAL_ID = 3653057799;
const BR_PERFECT_MEDAL_ID = 1080468863;

const FLAG_PULL_IMPULSE_ID = 1039658009;
const FLAG_CAPPED_IMPULSE_ID = 2944278681;
const FLAG_RETURNED_IMPULSE_ID = 1063951891;
const FLAG_PICK_UP_IMPULSE_ID = 4191318012;
const FLAGNUM_KILLS_IMPULSE_ID = 3514632335;
const FLAG_CARRIER_KILL_IMPULSE_ID = 2299858338;
const FLAG_DROP_IMPULSE_ID = 3435524855;

const STRONGHOLD_CAPTURE_ASSIST_MEDAL_ID = 1637841390;
const STRONGHOLD_SECURED_MEDAL_ID = 2916014239;
const STRONGHOLD_CAPTURE_MEDAL_ID = 3565443938;
const STRONGHOLD_DEFENSE_MEDAL_ID = 1351381581;

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

let aggregatedData = {
	users: {},
	result: []
};
let teamStats = {
	maps: {
		total: {
			totalWins: 0,
			totalGames: 0,
			bestStreak: 0,
			turnoversOnWins: null,
			turnoversOnLosses: null,
			avgStaringCSR: null,
			avgEndingCSR: null,
			averageOpponentCSR: null,
			averageOpponentCSRWins: null,
			averageOpponentCSRLosses: null
		}
	},
	result: ['total']
};

const fetchAllMatchData = (matchId, carnageReportUrl, friendlyTeamId, cb) => {
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

		async.parallel(matchesData.map(match => fetchAllMatchData.bind(null, match.Id.MatchId, match.Links.StatsMatchDetails.Path, match.Players[0].TeamId)), (err, allMatchData) => {
			if (err) {
				console.error(`Error fetching carnage reports: ${err}`);
				process.exit(1);
				return;
			}
			console.log("DONE PARALLEL CARNAGE: ", allMatchData);
		});

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

	})
});
