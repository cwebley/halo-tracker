const config = require('./config');
const Table = require("cli-table");
const colors = require('colors');

let allAwards = {
	entities: {
		stupidNoob: {
			name: 'Stupid Noob',
			description: '(friendlyKills)+(gpDeaths)+(assasDeaths)+(enviroDeaths)+(stickyDeaths)+(hydraDeaths)',
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
			description: '(unassistedKills / kills)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		mostOutnumbered: {
			name: 'Most Outnumbered',
			description: '(TotalAssistantsInDeath / Deaths) + 1',
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
		theXFactor: {
			name: 'The X Factor',
			description: '(pWeaponKills / turnovers) - (powerWeaponDeaths / forcedTurnovers)',
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
		knockoutNicholas: {
			name: 'Knockout Nicholas',
			description: '(2*groundPoundKills) + (melee kills) + (beatdowns) + (spartan charge kills)',
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
			description: '(2*Game Savers) + (2*Clutch Kills) + (Goal Line Stands) + (Flag Jousts)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		dontChallengeMe: {
			name: 'Don\'t Challenge Me!',
			description: '(Reversals - ReversalDeaths)',
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
		circa2k7Chan: {
			name: 'Circa 2k7 Chan',
			description: '(FlgTime/10)+(FlgPickups/10)+(FlgPulls)+(FlgCaps)+(FlgRtrns)+(ShCaps)+(ShAssists)+(ShSecs)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		pushbackPeter: {
			name: 'Pushback Peter',
			description: '(dmgDealt) - (100 * Kills) - (50 * Assists) - (15 * Headshots)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		multikillMartin: {
			name: 'Multikill Martin',
			description: '(Double kills * 1) + (Triple Kills * 3) + (OverkillsAndBeyond * 5)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		wheresTheStrafe: {
			name: 'Where\'s The Strafe?',
			description: '(perfectDeaths) + (noScopeDeaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		theFutureOfHalo: {
			name: 'The Future Of Halo',
			description: '(autoKills) - (autoDeaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		stayAwayFromMe: {
			name: 'Stay Away From Me!',
			description: '(totalKillDistance / kills)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		mrDowntown: {
			name: 'Mr Downtown',
			description: 'Longest distance magnum/flagnum kill',
			gamertags: {
				entities: {},
				result: []
			}
		},
		considerHiding: {
			name: 'Consider Hiding',
			description: 'doubleKillDeaths + (3 * tripleKillDeaths) + (5 * overkillAndBeyondDeaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		categoryKing: {
			name: 'Category King',
			description: '(Games With Most Kills) + (Games With Most Assists) + (Games With Least Deaths)',
			gamertags: {
				entities: {},
				result: []
			}
		},
		riflePurist: {
			name: 'Rifle Purist',
			description: 'Highest fraction of total kills with a one rifle',
			gamertags: {
				entities: {},
				result: []
			}
		}
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
					stickyDeaths: 0,
					get longform () {
						return `(${this.friendlyKills}+${this.groundPoundDeaths}+${this.assassinationDeaths}+${this.environmentalDeaths}+${this.stickyDeaths}+${this.hydraDeaths})`;
					},
					get value () {
						return this.friendlyKills + this.groundPoundDeaths + this.assassinationDeaths + this.environmentalDeaths + this.stickyDeaths + this.hydraDeaths;
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
						return `(${this.splinterKills} - ${this.splinterDeaths})`;
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
					kills: 0,
					get longform () {
						return `${this.unassistedKills} / ${this.kills}`;
					},
					get value () {
						return Math.round(100 * this.unassistedKills / this.kills) / 100;
					}
				};
				allAwards.entities.loneWolf.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.loneWolf.gamertags.entities[friendlyTag].unassistedKills += m.users[friendlyTag].unassistedKills;
			allAwards.entities.loneWolf.gamertags.entities[friendlyTag].kills += m.users[friendlyTag].kills;

			// hereForTheFireworks
			if (!allAwards.entities.hereForTheFireworks.gamertags.entities[friendlyTag]) {
				allAwards.entities.hereForTheFireworks.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					barrelDestroys: 0,
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
					get value () {
						return this.environmentalKills;
					}
				};
				allAwards.entities.demolitionExpert.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.demolitionExpert.gamertags.entities[friendlyTag].environmentalKills += m.users[friendlyTag].environmentalKills;

			// knockoutNicholas
			if (!allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag]) {
				allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					groundPoundKills: 0,
					meleeKills: 0,
					spartanChargeKills: 0,
					beatDownKills: 0,
					get longform () {
						return `(2*${this.groundPoundKills} + ${this.meleeKills} + ${this.spartanChargeKills} + ${this.beatDownKills})`;
					},
					get value () {
						return 2 * this.groundPoundKills + this.meleeKills + this.spartanChargeKills + this.beatDownKills;
					}
				};
				allAwards.entities.knockoutNicholas.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.knockoutNicholas.gamertags.entities[friendlyTag].groundPoundKills += m.users[friendlyTag].groundPoundKills;
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
						return `(${this.meleeDeaths} + ${this.spartanChargeDeaths})`;
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
						return `(2*${this.gameSavers} + 2*${this.clutchKills} + ${this.goalLineStands} + ${this.flagJousts})`;
					},
					get value () {
						return (2*this.gameSavers) + (2*this.clutchKills) + this.goalLineStands + this.flagJousts;
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
					reversalDeaths: 0,
					get longform () {
						return `(${this.reversals} - ${this.reversalDeaths})`
					},
					get value () {
						return this.reversals - this.reversalDeaths;
					}
				};
				allAwards.entities.dontChallengeMe.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.dontChallengeMe.gamertags.entities[friendlyTag].reversals += m.users[friendlyTag].reversals;
			allAwards.entities.dontChallengeMe.gamertags.entities[friendlyTag].reversalDeaths += m.users[friendlyTag].reversalDeaths;

			//  circa2k7Chan
			if (!allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag]) {
				allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					flagTime: 0,
					flagPulls: 0,
					flagCaptures: 0,
					flagReturns: 0,
					shCaptures: 0,
					shAssists: 0,
					shSecures: 0,
					flagsPickedUp: 0,
					get longform () {
						return `((${this.flagTime}/10)+(${this.flagsPickedUp}/10)+${this.flagPulls}+${this.flagCaptures}+${this.flagReturns}+${this.shCaptures}+${this.shAssists}+${this.shSecures})`;
					},
					get value () {
						return Math.ceil(this.flagTime/10)+Math.round(this.flagsPickedUp / 10)+this.flagPulls+this.flagCaptures+this.flagReturns+this.shCaptures+this.shAssists+this.shSecures;
					}
				};
				allAwards.entities.circa2k7Chan.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].flagTime += m.users[friendlyTag].flagTime;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].flagPulls += m.users[friendlyTag].flagPulls;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].flagCaptures += m.users[friendlyTag].flagCaptures;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].flagReturns += m.users[friendlyTag].flagReturns;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].shCaptures += m.users[friendlyTag].shCaptures;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].shAssists += m.users[friendlyTag].shAssists;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].shSecures += m.users[friendlyTag].shSecures;
			allAwards.entities.circa2k7Chan.gamertags.entities[friendlyTag].flagsPickedUp += m.users[friendlyTag].flagsPickedUp;

			//  multikillMartin
			if (!allAwards.entities.multikillMartin.gamertags.entities[friendlyTag]) {
				allAwards.entities.multikillMartin.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					doubleKills: 0,
					tripleKills: 0,
					overkillsAndBeyond: 0,
					get longform () {
						return `(${this.doubleKills} + ${this.tripleKills}*2 + ${this.overkillsAndBeyond}*3)`;
					},
					get value () {
						return this.doubleKills + this.tripleKills * 2 + this.overkillsAndBeyond * 3;
					}
				};
				allAwards.entities.multikillMartin.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.multikillMartin.gamertags.entities[friendlyTag].doubleKills += m.users[friendlyTag].doubleKills;
			allAwards.entities.multikillMartin.gamertags.entities[friendlyTag].tripleKills += m.users[friendlyTag].tripleKills;
			allAwards.entities.multikillMartin.gamertags.entities[friendlyTag].overkillsAndBeyond += m.users[friendlyTag].overkillsAndBeyond;

			//  mostOutnumbered
			if (!allAwards.entities.mostOutnumbered.gamertags.entities[friendlyTag]) {
				allAwards.entities.mostOutnumbered.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					deaths: 0,
					totalAssistantsInDeath: 0,
					get longform () {
						return `((${this.totalAssistantsInDeath} / ${this.deaths}) + 1)`
					},
					get value () {
						return Math.round(100 * (1 + (this.totalAssistantsInDeath / this.deaths))) / 100;
					}
				};
				allAwards.entities.mostOutnumbered.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.mostOutnumbered.gamertags.entities[friendlyTag].deaths += m.users[friendlyTag].deaths;
			allAwards.entities.mostOutnumbered.gamertags.entities[friendlyTag].totalAssistantsInDeath += m.users[friendlyTag].totalAssistantsInDeath;

			//  wheresTheStrafe
			if (!allAwards.entities.wheresTheStrafe.gamertags.entities[friendlyTag]) {
				allAwards.entities.wheresTheStrafe.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					perfectDeaths: 0,
					noScopeDeaths: 0,
					get longform () {
						return `(${this.perfectDeaths} + ${this.noScopeDeaths})`
					},
					get value () {
						return this.perfectDeaths + this.noScopeDeaths;
					}
				};
				allAwards.entities.wheresTheStrafe.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.wheresTheStrafe.gamertags.entities[friendlyTag].perfectDeaths += m.users[friendlyTag].perfectDeaths;
			allAwards.entities.wheresTheStrafe.gamertags.entities[friendlyTag].noScopeDeaths += m.users[friendlyTag].noScopeDeaths;

			//  theFutureOfHalo
			if (!allAwards.entities.theFutureOfHalo.gamertags.entities[friendlyTag]) {
				allAwards.entities.theFutureOfHalo.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					autoKills: 0,
					autoDeaths: 0,
					get longform () {
						return `(${this.autoKills} - ${this.autoDeaths})`
					},
					get value () {
						return this.autoKills - this.autoDeaths;
					}
				};
				allAwards.entities.theFutureOfHalo.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.theFutureOfHalo.gamertags.entities[friendlyTag].autoKills += m.users[friendlyTag].autoKills;
			allAwards.entities.theFutureOfHalo.gamertags.entities[friendlyTag].autoDeaths += m.users[friendlyTag].autoDeaths;

			//  stayAwayFromMe
			if (!allAwards.entities.stayAwayFromMe.gamertags.entities[friendlyTag]) {
				allAwards.entities.stayAwayFromMe.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					totalKillDistance: 0,
					kills: 0,
					get longform () {
						return `(${Math.round(100 * this.totalKillDistance / this.kills)} / ${this.kills})`
					},
					get value () {
						return Math.round(100 * this.totalKillDistance / this.kills) / 100;
					}
				};
				allAwards.entities.stayAwayFromMe.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.stayAwayFromMe.gamertags.entities[friendlyTag].totalKillDistance += m.users[friendlyTag].totalKillDistance;
			allAwards.entities.stayAwayFromMe.gamertags.entities[friendlyTag].kills += m.users[friendlyTag].kills;

			//  mrDowntown
			if (!allAwards.entities.mrDowntown.gamertags.entities[friendlyTag]) {
				allAwards.entities.mrDowntown.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					longestMagnumKill: 0,
					get value () {
						return this.longestMagnumKill;
					}
				};
				allAwards.entities.mrDowntown.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.mrDowntown.gamertags.entities[friendlyTag].longestMagnumKill = Math.max(m.users[friendlyTag].longestMagnumKill || 0, allAwards.entities.mrDowntown.gamertags.entities[friendlyTag].longestMagnumKill);

			//  considerHiding
			if (!allAwards.entities.considerHiding.gamertags.entities[friendlyTag]) {
				allAwards.entities.considerHiding.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					doubleKillDeaths: 0,
					tripleKillDeaths: 0,
					overkillAndBeyondDeaths: 0,
					get longform () {
						return `(${this.doubleKillDeaths} + (3 * ${this.tripleKillDeaths}) + (5 * ${this.overkillAndBeyondDeaths}))`;
					},
					get value () {
						return this.doubleKillDeaths + (3 * this.tripleKillDeaths) + (5 * this.overkillAndBeyondDeaths);
					}
				};
				allAwards.entities.considerHiding.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.considerHiding.gamertags.entities[friendlyTag].doubleKillDeaths += m.users[friendlyTag].doubleKillDeaths;
			allAwards.entities.considerHiding.gamertags.entities[friendlyTag].tripleKillDeaths += m.users[friendlyTag].tripleKillDeaths;
			allAwards.entities.considerHiding.gamertags.entities[friendlyTag].overkillAndBeyondDeaths += m.users[friendlyTag].overkillAndBeyondDeaths;

			//  categoryKing
			if (!allAwards.entities.categoryKing.gamertags.entities[friendlyTag]) {
				allAwards.entities.categoryKing.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					mostKills: 0,
					mostAssists: 0,
					leastDeaths: 0,
					get longform () {
						return `(${this.mostKills} + ${this.mostAssists} + ${this.leastDeaths})`;
					},
					get value () {
						return this.mostKills + this.mostAssists + this.leastDeaths;
					}
				};
				allAwards.entities.categoryKing.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.categoryKing.gamertags.entities[friendlyTag].mostKills += m.users[friendlyTag].mostKills;
			allAwards.entities.categoryKing.gamertags.entities[friendlyTag].mostAssists += m.users[friendlyTag].mostAssists;
			allAwards.entities.categoryKing.gamertags.entities[friendlyTag].leastDeaths += m.users[friendlyTag].leastDeaths;

			//  riflePurist
			if (!allAwards.entities.riflePurist.gamertags.entities[friendlyTag]) {
				allAwards.entities.riflePurist.gamertags.entities[friendlyTag] = {
					name: friendlyTag,
					kills: 0,
					brKills: 0,
					dmrKills: 0,
					lrKills: 0,
					carbineKills: 0,
					get brData () {
						return {
							name: 'br',
							value: Math.round(100 * this.brKills / this.kills) / 100,
						}
					},
					get dmrData () {
						return {
							name: 'dmr',
							value: Math.round(100 * this.dmrKills / this.kills) / 100,
						}
					},
					get lrData () {
						return {
							name: 'lr',
							value: Math.round(100 * this.lrKills / this.kills) / 100,
						}
					},
					get carbineData () {
						return {
							name: 'c',
							value: Math.round(100 * this.carbineKills / this.kills) / 100,
						}
					},
					get longform () {
						const sortedData = [this.brData, this.dmrData, this.lrData, this.carbineData].sort((a, b) => b.value - a.value);
							return `(${sortedData.map(d => `${d.name}: ${d.value}`).join(', ')}`
					},
					get value () {
						return Math.round(100 * Math.max(this.brKills, this.dmrKills, this.lrKills, this.carbineKills) / this.kills) / 100;
					}
				};
				allAwards.entities.riflePurist.gamertags.result.push(friendlyTag);
			}
			allAwards.entities.riflePurist.gamertags.entities[friendlyTag].kills += m.users[friendlyTag].kills;
			allAwards.entities.riflePurist.gamertags.entities[friendlyTag].brKills += m.users[friendlyTag].brKills;
			allAwards.entities.riflePurist.gamertags.entities[friendlyTag].dmrKills += m.users[friendlyTag].dmrKills;
			allAwards.entities.riflePurist.gamertags.entities[friendlyTag].lrKills += m.users[friendlyTag].lrKills;
			allAwards.entities.riflePurist.gamertags.entities[friendlyTag].carbineKills += m.users[friendlyTag].carbineKills;

		}); // done iterating through teammates
	}); // done iterating through matches

	duoTotals.result.forEach(duoName => {
		allAwards.entities.bestDuo.gamertags.entities[duoName] = {
			name: duoName,
			duoKills: duoTotals.entities[duoName],
			get value () {
				return this.duoKills;
			}
		};
		allAwards.entities.bestDuo.gamertags.result.push(duoName);
	});

	usersTable.forEach(user => {
		if (config.isRandomTeammate(user.name, true)) {
			return;
		}
		// responsibleRyan
		allAwards.entities.responsibleRyan.gamertags.entities[user.name] = {
			name: user.name,
			pWeaponPickups: user.pWeaponPickups,
			turnovers: user.turnovers,
			get longform () {
				return `(${this.pWeaponPickups} / ${this.turnovers})`;
			},
			get value () {
				return Math.round(100 * this.pWeaponPickups / this.turnovers) / 100;
			}
		};
		allAwards.entities.responsibleRyan.gamertags.result.push(user.name);
		// theXFactor
		allAwards.entities.theXFactor.gamertags.entities[user.name] = {
			name: user.name,
			pWeaponKills: user.pWeaponKills,
			turnovers: user.turnovers,
			powerWeaponDeaths: user.powerWeaponDeaths,
			forcedTurnovers: user.forcedTurnovers,
			get longform () {
				return `((${this.pWeaponKills} / ${this.turnovers}) - (${this.powerWeaponDeaths} / ${this.forcedTurnovers}))`;
			},
			get value () {
				return Math.round(100 * ((this.pWeaponKills / this.turnovers) - (this.powerWeaponDeaths / this.forcedTurnovers))) / 100;
			}
		};
		allAwards.entities.theXFactor.gamertags.result.push(user.name);

		// pushbackPeter
		allAwards.entities.pushbackPeter.gamertags.entities[user.name] = {
			name: user.name,
			dmgDealt: user.dmgDealt,
			kills: user.kills,
			assists: user.assists,
			headshots: user.headshots,
			get longform () {
				return `(${this.dmgDealt} - 100*${this.kills} - 50*${this.assists} - 15*${this.headshots})`;
			},
			get value () {
				return this.dmgDealt - (100 * this.kills) - (50 * this.assists) - (15 * this.headshots)
			}
		};
		allAwards.entities.pushbackPeter.gamertags.result.push(user.name);
	});

	let prettyTable = new Table({
		head: ['Award', 'Winner', 'Runner Ups', 'Description']
	});

	const getAndStyleRow = (gamertagResult, opts = { winner: false }) => {
		return `${opts.winner ? gamertagResult.name.bold : gamertagResult.name}: ${gamertagResult.value.toString().italic} ${gamertagResult.longform ? gamertagResult.longform.dim : ''}`;
	};

	// sort all the awards by the value property of each gamertag
	Object.keys(allAwards.entities).forEach(awardName => {
		const award = allAwards.entities[awardName];
		if (award.gamertags.result.length < 2) {
			return;
		}
		award.gamertags.result.sort((prevTag, nextTag) => {
			return award.gamertags.entities[nextTag].value - award.gamertags.entities[prevTag].value;
		});
		// if first place is a tie, dont include the award
		if (award.gamertags.entities[award.gamertags.result[0]].value === award.gamertags.entities[award.gamertags.result[1]].value) {
			// return;
		}

		prettyTable.push([
			award.name,
			getAndStyleRow(award.gamertags.entities[award.gamertags.result[0]], { winner: true }),
			award.gamertags.result.slice(1, 4).map(runnerupTag => getAndStyleRow(award.gamertags.entities[runnerupTag])).join(' | '),
			award.description
		]);
	});

	return prettyTable.toString();
}
