const config = require('./config');

const awardsTableBaseRow = {
	stupidNoob: 0, // suicides, betrayals, ground pound deaths, beatdown deaths, assassination deaths, environemntal exposive deaths, and hydra deaths
	splinterExpert: 0,
	firstBlood: 0,
	loneWolf: 0, // unassisted kills
	responsibleRyan: 0,
	demoExpert: 0, // explosive barrels destroyed
	starBoy: 0, // ground pound kills,
	brawler: 0, // melees, beatdowns, and spartan charge kills (maybe these should be FOR - AGAINST?)
	wheresTheCutTeam: 0, // melee and spartan charge deaths (maybe these should be FOR - AGAINST?)
	mrClutch: 0, // clutch kill medals
	drDistraction: 0, // distraction medals
	dontChallengeMe: 0, // most reversals
};

module.exports.getAwardsTable = function (allMatchData, usersTable) {
	let usersOverall = {
		entities: {},
		result: []
	};

	allMatchData.forEach((m, i) => {
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			// don't give out awards to random teammates
			if (config.isRandomTeammate(friendlyTag, true)) {
				return;
			}
			if (!usersOverall.entities[friendlyTag]) {
				usersOverall.entities[friendlyTag] = Object.assign({
					winner: friendlyTag
				}, awardsTableBaseRow);
				usersOverall.result.push(friendlyTag);
			}
			// Stupid Noob
			usersOverall.entities[friendlyTag].stupidNoob += m.users[friendlyTag].hydraDeaths;
			usersOverall.entities[friendlyTag].stupidNoob += m.users[friendlyTag].environmentalDeaths;
			usersOverall.entities[friendlyTag].stupidNoob += m.users[friendlyTag].groundPoundDeaths;
			usersOverall.entities[friendlyTag].stupidNoob += m.users[friendlyTag].assassinationDeaths;
			usersOverall.entities[friendlyTag].stupidNoob += m.users[friendlyTag].friendlyKills;

			// Splinter Expert
			usersOverall.entities[friendlyTag].splinterExpert += (m.users[friendlyTag].splinterKills - m.users[friendlyTag].splinterDeaths);

			// First Blood
			usersOverall.entities[friendlyTag].firstBlood += m.users[friendlyTag].firstBlood;

			// Lone Wolf
			usersOverall.entities[friendlyTag].loneWolf += m.users[friendlyTag].unassistedKills;

			// demoExpert
			usersOverall.entities[friendlyTag].demoExpert += m.users[friendlyTag].barrelDestroys;

			// starBoy
			usersOverall.entities[friendlyTag].starBoy += m.users[friendlyTag].groundPoundKills;

			// starBoy
			usersOverall.entities[friendlyTag].starBoy += m.users[friendlyTag].groundPoundKills;

			// brawler
			usersOverall.entities[friendlyTag].brawler += m.users[friendlyTag].meleeKills;
			usersOverall.entities[friendlyTag].brawler += m.users[friendlyTag].spartanChargeKills;
			usersOverall.entities[friendlyTag].brawler += m.users[friendlyTag].beatDownKills;

			// wheresTheCutTeam
			usersOverall.entities[friendlyTag].wheresTheCutTeam += m.users[friendlyTag].meleeDeaths;
			usersOverall.entities[friendlyTag].wheresTheCutTeam += m.users[friendlyTag].spartanChargeDeaths;

			//  mrClutch
			usersOverall.entities[friendlyTag].mrClutch += m.users[friendlyTag].clutchKillMedals;

			//  drDistraction
			usersOverall.entities[friendlyTag].drDistraction += m.users[friendlyTag].distractions;

			//  dontChallengeMe
			usersOverall.entities[friendlyTag].dontChallengeMe += m.users[friendlyTag].reversals;
		});

	});

	// Responsible Ryan
	usersTable.forEach(user => {
		if (config.isRandomTeammate(user.name, true)) {
			return;
		}
		usersOverall.entities[user.name].responsibleRyan = Math.floor(user.pWeaponPickups / user.turnovers);
	});

	return usersOverall.result.map(u => usersOverall.entities[u]);
}
