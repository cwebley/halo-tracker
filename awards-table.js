const config = require('./config');
const Table = require("cli-table");

let allAwards = {
	entities: {
		stupidNoob: {
			name: 'Stupid Noob',
			description: '(suicides and betrayals) + (groundpound deaths) (assassination deaths) (explosive barrel deaths) + (hydras deaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		splinterExpert: {
			name: 'Splinter Expert',
			description: '(splinter kills) - (splinter deaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		loneWolf: {
			name: 'Lone Wolf',
			description: 'Number of unassisted kills',
			gamertags: {
				entities: {},
				result: []
			}
		},
		responsibleRyan: {
			name: 'Responsible Ryan',
			description: '(pWeaponPickups) / (turnovers)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		hereForTheFireworks: {
			name: 'Here For the Fireworks',
			description: 'Number of barrels destroyed',
			gamertags: {
				entities: {},
				result: []
			}
		},
		demolitionExpert: {
			name: 'Demolition Expert',
			description: 'Number of explosive barrel kills',
			gamertags: {
				entities: {},
				result: []
			}
		},
		starBoy: {
			name: 'Star Boy',
			description: 'Number of ground pound kills',
			gamertags: {
				entities: {},
				result: []
			}
		},
		knockoutNicholas: {
			name: 'Knockout Nicholas',
			description: '(melee kills) + (beatdowns) + (spartan charge kills)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		wheresTheCutTeam: {
			name: 'Where\'s The Cut Team?',
			description: '(melee deaths) + (spartan charge deaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		mrClutch: {
			name: 'Mr Clutch',
			description: '(Game Savers) + (Clutch Kills) + (Goal Line Stands) + (Flag Jousts)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		dontChallengeMe: {
			name: 'Don\'t Challenge Me',
			description: 'Number of Reversals',
			gamertags: {
				entities: {},
				result: []
			}
		},
		bestDuo: {
			name: 'Dominant Duo',
			description: 'Number of kills where both players are involved',
			gamertags: {
				entities: {},
				result: []
			}
		},

		// TODO all the next events
		wheresTheStrafe: {
			name: 'Where\'s The Strafe',
			description: 'Number of deaths to perfect kills',
			gamertags: {
				entities: {},
				result: []
			}
		},
		mostMultiKills: {
			name: 'Most Multikills',
			description: '(Double kills * 1) + (Triple Kills * 2) + (Overkills * 3) + (Killtaculars * 4)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		pushbackPeter: {
			name: 'Pushback Peter',
			description: 'Most unaccounted damage. (Damage) / (115 * Kills + .5 * Assists)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		circa2007Chan: {
			name: 'Circa 2007 Chan',
			description: 'Most Objective. TBD how this is calculated',
			gamertags: {
				entities: {},
				result: []
			}
		},
	}
};

module.exports.getAwardsTable = function (allMatchData, usersTable) {
	let usersOverall = {
		entities: {},
		result: []
	};

	const duoTotals = {
		entities: {},
		result: []
	};

	allMatchData.forEach((m, i) => {
		m.duos.result.forEach(duoName => {
			if (!duoTotals.entities[duoName]) {
				duoTotals.result.push(duoName);
				duoTotals.entities[duoName] = 0;
			}
			duoTotals.entities[duoName] += m.duos.entities[duoName];
		});
		Object.keys(m.teams.friendly.ids).forEach(friendlyTag => {
			// don't give out awards to random teammates
			if (config.isRandomTeammate(friendlyTag, true)) {
				return;
			}

			// Stupid Noob
			if (!allAwards.entities.stupidNoob.gamertags.entities[friendlyTag]) {
				allAwards.entities.stupidNoob.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					friendlyKills: 0,
					groundPoundDeaths: 0,
					assassinationDeaths: 0,
					environmentalDeaths: 0,
					hydraDeaths: 0,
					get longform () {
						return `${this.name}: ${this.value} (${this.friendlyKills} + ${this.groundPoundDeaths} + ${this.assassinationDeaths} + ${this.environmentalDeaths} + ${this.hydraDeaths})`;
					},
					get value () {
						return this.friendlyKills + this.groundPoundDeaths + this.assassinationDeaths + this.environmentalDeaths + this.hydraDeaths;
					}
				};
				allAwards.entities.stupidNoob.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.stupidNoob.gamertags.entities[friendlyTag].friendlyKills += m.users[friendlyTag].friendlyKills;
			allAwards.entities.stupidNoob.gamertags.entities[friendlyTag].groundPoundDeaths += m.users[friendlyTag].groundPoundDeaths;
			allAwards.entities.stupidNoob.gamertags.entities[friendlyTag].assassinationDeaths += m.users[friendlyTag].assassinationDeaths;
			allAwards.entities.stupidNoob.gamertags.entities[friendlyTag].environmentalDeaths += m.users[friendlyTag].environmentalDeaths;
			allAwards.entities.stupidNoob.gamertags.entities[friendlyTag].hydraDeaths += m.users[friendlyTag].hydraDeaths;

			// Splinter Expert
			if (!allAwards.entities.splinterExpert.gamertags.entities[friendlyTag]) {
				allAwards.entities.splinterExpert.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					splinterKills: 0,
					splinterDeaths: 0,
					get longform () {
						return `${this.name}: ${this.value} (${this.splinterKills} - ${this.splinterDeaths})`;
					},
					get value () {
						return this.splinterKills - this.splinterDeaths;
					}
				};
				allAwards.entities.splinterExpert.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.splinterExpert.gamertags.entities[friendlyTag].splinterKills += m.users[friendlyTag].splinterKills;
			allAwards.entities.splinterExpert.gamertags.entities[friendlyTag].splinterDeaths += m.users[friendlyTag].splinterDeaths;

			// Lone Wolf
			if (!allAwards.entities.loneWolf.gamertags.entities[friendlyTag]) {
				allAwards.entities.loneWolf.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					unassistedKills: 0,
					get longform () {
						return `${this.name}: ${this.value}`;
					},
					get value () {
						return this.unassistedKills;
					}
				};
				allAwards.entities.loneWolf.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.loneWolf.gamertags.entities[friendlyTag].unassistedKills += m.users[friendlyTag].unassistedKills;

			// hereForTheFireworks
			if (!allAwards.entities.hereForTheFireworks.gamertags.entities[friendlyTag]) {
				allAwards.entities.hereForTheFireworks.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					barrelDestroys: 0,
					get longform () {
						return `${this.name}: ${this.value}`;
					},
					get value () {
						return this.barrelDestroys;
					}
				};
				allAwards.entities.hereForTheFireworks.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.hereForTheFireworks.gamertags.entities[friendlyTag].barrelDestroys += m.users[friendlyTag].barrelDestroys;

			// demolitionExpert
			if (!allAwards.entities.demolitionExpert.gamertags.entities[friendlyTag]) {
				allAwards.entities.demolitionExpert.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					environmentalKills: 0,
					get longform () {
						return `${this.name}: ${this.value}`;
					},
					get value () {
						return this.environmentalKills;
					}
				};
				allAwards.entities.demolitionExpert.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.demolitionExpert.gamertags.entities[friendlyTag].environmentalKills += m.users[friendlyTag].environmentalKills;

			// starBoy
			if (!allAwards.entities.starBoy.gamertags.entities[friendlyTag]) {
				allAwards.entities.starBoy.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					groundPoundKills: 0,
					get longform () {
						return `${this.name}: ${this.value}`;
					},
					get value () {
						return this.groundPoundKills;
					}
				};
				allAwards.entities.starBoy.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.starBoy.gamertags.entities[friendlyTag].groundPoundKills += m.users[friendlyTag].groundPoundKills;

			// knockoutNicholas
			if (!allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag]) {
				allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					meleeKills: 0,
					spartanChargeKills: 0,
					beatDownKills: 0,
					get longform () {
						return `${this.name}: ${this.value} (${this.meleeKills} + ${this.spartanChargeKills} + ${this.beatDownKills})`;
					},
					get value () {
						return this.meleeKills + this.spartanChargeKills + this.beatDownKills;
					}
				};
				allAwards.entities.knockoutNicholas.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag].meleeKills += m.users[friendlyTag].meleeKills;
			allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag].spartanChargeKills += m.users[friendlyTag].spartanChargeKills;
			allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag].beatDownKills += m.users[friendlyTag].beatDownKills;

			// wheresTheCutTeam
			if (!allAwards.entities.wheresTheCutTeam.gamertags.entities[friendlyTag]) {
				allAwards.entities.wheresTheCutTeam.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					meleeDeaths: 0,
					spartanChargeDeaths: 0,
					get longform () {
						return `${this.name}: ${this.value} (${this.meleeDeaths} + ${this.spartanChargeDeaths})`;
					},
					get value () {
						return this.meleeDeaths + this.spartanChargeDeaths;
					}
				};
				allAwards.entities.wheresTheCutTeam.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.wheresTheCutTeam.gamertags.entities[friendlyTag].meleeDeaths += m.users[friendlyTag].meleeDeaths;
			allAwards.entities.wheresTheCutTeam.gamertags.entities[friendlyTag].spartanChargeDeaths += m.users[friendlyTag].spartanChargeDeaths;

			//  mrClutch
			if (!allAwards.entities.mrClutch.gamertags.entities[friendlyTag]) {
				allAwards.entities.mrClutch.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					gameSavers: 0,
					clutchKills: 0,
					goalLineStands: 0,
					flagJousts: 0,
					get longform () {
						return `${this.name}: ${this.value} (${this.gameSavers} + ${this.clutchKills} + ${this.goalLineStands} + ${this.flagJousts})`;
					},
					get value () {
						return this.gameSavers + this.clutchKills + this.goalLineStands + this.flagJousts;
					}
				};
				allAwards.entities.mrClutch.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.mrClutch.gamertags.entities[friendlyTag].gameSavers += m.users[friendlyTag].gameSavers;
			allAwards.entities.mrClutch.gamertags.entities[friendlyTag].clutchKills += m.users[friendlyTag].clutchKills;
			allAwards.entities.mrClutch.gamertags.entities[friendlyTag].goalLineStands += m.users[friendlyTag].goalLineStands;
			allAwards.entities.mrClutch.gamertags.entities[friendlyTag].flagJousts += m.users[friendlyTag].flagJousts;

			//  dontChallengeMe
			if (!allAwards.entities.dontChallengeMe.gamertags.entities[friendlyTag]) {
				allAwards.entities.dontChallengeMe.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					reversals: 0,
					get longform () {
						return `${this.name}: ${this.value}`;
					},
					get value () {
						return this.reversals;
					}
				};
				allAwards.entities.dontChallengeMe.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.dontChallengeMe.gamertags.entities[friendlyTag].reversals += m.users[friendlyTag].reversals;
		}); // done iterating through teammates
	}); // done iterating through matches

	duoTotals.result.forEach(duoName => {
		allAwards.entities.bestDuo.gamertags.entities[duoName] = {
			name: duoName,
			duoKills: duoTotals.entities[duoName],
			get longform () {
				return `${this.name}: ${this.value}`;
			},
			get value () {
				return this.duoKills;
			}
		};
		allAwards.entities.bestDuo.gamertags.result.push(duoName);
	});

	// Responsible Ryan
	usersTable.forEach(user => {
		if (config.isRandomTeammate(user.name, true)) {
			return;
		}
		allAwards.entities.responsibleRyan.gamertags.entities[user.name] = {
			name: user.name,
			pWeaponPickups: user.pWeaponPickups,
			turnovers: user.turnovers,
			get longform () {
				return `${this.name}: ${this.value} (${this.pWeaponPickups} / ${this.turnovers})`;
			},
			get value () {
				return Math.floor(this.pWeaponPickups / this.turnovers);
			}
		};
		allAwards.entities.responsibleRyan.gamertags.result.push(user.name);
	});

	let prettyTable = new Table({
		head: ['Award', 'Winner', 'Runner Ups', 'Description']
	});

	// sort all the awards by the value property of each gamertag
	Object.keys(allAwards.entities).forEach(awardName => {
		const award = allAwards.entities[awardName];
		if (award.gamertags.result.length < 2) {
			return;
		}
		award.gamertags.result.sort((prevTag, nextTag) => {
			return award.gamertags.entities[nextTag].value - award.gamertags.entities[prevTag].value;
		});

		prettyTable.push([award.name, award.gamertags.entities[award.gamertags.result[0]].longform, award.gamertags.result.slice(1, 4).map(runnerupTag => award.gamertags.entities[runnerupTag].longform).join(' | '), award.description]);
	});

	return prettyTable.toString();
}
