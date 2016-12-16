const RateLimiter = require('limiter').RateLimiter;

 // haloapi only allows 10 requests every 10 seconds
module.exports.limiter = new RateLimiter(7, 10000); // just to be safe; still get some 429s at 10 in 10000ms
module.exports.API_KEY = 'c4778a4ab06e40c39136923ae01c4245';
module.exports.BASE_STATS_URL = 'https://www.haloapi.com/stats/';

module.exports.getMetaDataUrl = function (type) {
	return `https://www.haloapi.com/metadata/h5/metadata/${type}`;
}

module.exports.getMatchesUrl = function ({ gamertag, start, count }) {
	return `https://www.haloapi.com/stats/h5/players/${gamertag}/matches?start=${start}&count=${count}`;
}

module.exports.getMatchEventsUrl = function (matchId) {
	return `https://www.haloapi.com/stats/h5/matches/${matchId}/events`;
}


// dictionaries of resourceId -> resourceName
let userIndex = {};
module.exports.userIndex = userIndex;
let mapIndex = {};
let medalIndex = {};
let impulseIndex = {};
let weaponIndex = {};
let gametypeIndex = {};

// for pWeapons and rifles for consistency and ease of lookup
// weaponId -> true
let powerWeaponIds = {};
let rifleIds = {};
let autoIds = {};

// there are several medals that share the name 'Perfect Kill'
// here we keep them in one dictionary
let perfectKillIds = {};

let overkillAndBeyondIds = {};

const powerWeaponNames = [
	'Rocket Launcher',
	'SPNKr Rocket Launcher',
	'Sniper Rifle',
	'Plasma Caster',
	'Fuel Rod Cannon',
	'Railgun',
	'Scattershot',
	'Shotgun',
	'Energy Sword',
	'SAW',
	'Beam Rifle'
];

const rifleNames = [
	'Battle Rifle',
	'LightRifle',
	'DMR',
	'Carbine',
	'Halo 2 Battle Rifle'
];

const autoNames = [
	'Assault Rifle',
	'Storm Rifle',
	'SMG',
	'Suppressor'
];

module.exports.set = function (type, id, name) {
	switch (type) {
		case 'user':
			// id is the gamertag here
			userIndex[id] = true;
			break;
		case 'map':
			mapIndex[id] = name;
			break;
		case 'medal':
			if (name === 'Perfect Kill') {
				perfectKillIds[id] = true;
				break;
			}
			if (name === 'Overkill' || name === 'Killtacular' || name === 'Killtrocity' || name === 'Killtastrophe' || name === 'Killpocalypse' || name === 'Killionaire') {
				overkillAndBeyondIds[id] = true;
			}
			medalIndex[id] = name;
			break;
		case 'impulse':
			medalIndex[id] = name;
			break;
		case 'weapon':
			weaponIndex[id] = name;
			if (powerWeaponNames.indexOf(name) !== -1) {
				powerWeaponIds[id] = true;
			}
			if (rifleNames.indexOf(name) !== -1) {
				rifleIds[id] = true;
			}
			if (autoNames.indexOf(name) !== -1) {
				autoIds[id] = true;
			}
			break;
		case 'gametype':
			gametypeIndex[id] = name;
			break;
	}
}

module.exports.isPowerWeapon = function (id) {
	return !!powerWeaponIds[id];
}
module.exports.isRifle = function (id) {
	return !!rifleIds[id];
}
module.exports.isAuto = function (id) {
	return !!autoIds[id];
}
module.exports.isPerfectMedal = function (id) {
	return !!perfectKillIds[id];
}
module.exports.isOverKillOrBeyond = function (id) {
	return !!overkillAndBeyondIds[id];
}

module.exports.get = function (type, key) {
	switch (type) {
		case 'map':
			return mapIndex[key];
		case 'medal':
			return medalIndex[key];
		case 'impulse':
			return medalIndex[key];
		case 'weapon':
			return weaponIndex[key];
		case 'gametype':
			return gametypeIndex[key]
	}
}

module.exports.isRandomTeammate = function (gamertag, isTeammate) {
	// we don't really care about random teammates' names
	if (isTeammate && !userIndex[gamertag]) {
		return true;
	}
	return false;
}
