const request = require('request');
const config = require('./config');
const limiter = config.limiter;

module.exports.getEventData = function (matchId, carnageData, cb) {
	limiter.removeTokens(1, (err, remainingTokens) => {
		console.log("EVENTS LIMITER ERR: ", err);
		console.log("REMAINING: ", remainingTokens);
		request({
			method: 'GET',
			uri: config.getMatchEventsUrl(matchId),
			json: true,
			headers: {
				'Ocp-Apim-Subscription-Key': config.API_KEY
			}
		}, function(err, response, body) {
			if (err) {
				cb(err);
				return;
			}

			if (response.statusCode > 399) {
				cb(new Error(response.statusCode + ': ' + body));
				return;
			}

			cb(null, processEventData(body.GameEvents, carnageData));
		});
	});
};

function processEventData (events, carnageData) {
	events.forEach((event, eventIndex) => {
		if (event.EventName === 'WeaponDrop') {
			if (config.isPowerWeapon(event.WeaponStockId)) {
				// check future events to see who picked up the weapon
				for (let i = eventIndex + 1; i < events.length; i++) {
					const futureEvent = events[i];
					if (futureEvent.EventName === 'WeaponPickup' && futureEvent.WeaponStockId === event.WeaponStockId) {
						// if the team that picked up the weapon is different than the team that dropped the weapon, its a turnover
						// TODO work to make this only possible for 30 seconds or something
						if (carnageData.users[event.Player.Gamertag.friendlyTeamId] !== carnageData.users[futureEvent.Player.Gamertag.friendlyTeamId]) {
							carnageData.users[event.Player.Gamertag].turnovers++
						}
						// the weapon was picked up. regardless of turnover status we are done checking future events.
						return;
					}
				}
			}
			return;
		}
		// this INCLUDES WeaponPickupPad events. Both events are triggered in that scenario
		if (event.EventName === 'WeaponPickup') {
			if (config.isPowerWeapon(event.WeaponStockId)) {
				carnageData.users[event.Player.Gamertag].pWeaponPickups++
			}
		}
	});
	return carnageData;
}
