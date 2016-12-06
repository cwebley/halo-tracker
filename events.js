const request = require('request');
const moment = require('moment');
const config = require('./config');
const limiter = config.limiter;

module.exports.getEventData = function (matchId, carnageData, cb) {
	limiter.removeTokens(1, (err, remainingTokens) => {
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
	events.forEach((friendlyPickupEvent, friendlyPickupEventIndex) => {

		// if a power weapon was picked up, lets track what happened to see if a turnover came out of it
		if (friendlyPickupEvent.EventName === 'WeaponPickup' && config.isPowerWeapon(friendlyPickupEvent.WeaponStockId)) {
			// count the powerWeapon pickup. this INCLUDES WeaponPadPickups
			carnageData.users[friendlyPickupEvent.Player.Gamertag].pWeaponPickups++

			const pickupTimeInSeconds = moment.duration(friendlyPickupEvent.TimeSinceStart).seconds();

			// check future events to see when the weapon was dropped
			for (let dropEventIndex = friendlyPickupEventIndex + 1; dropEventIndex < events.length; dropEventIndex++) {
				const dropEvent = events[dropEventIndex];

				// if the same weapon was dropped by the same player that picked up the weapon...
				if (dropEvent.EventName === 'WeaponDrop' && dropEvent.WeaponStockId === friendlyPickupEvent.WeaponStockId && dropEvent.Player.Gamertag === friendlyPickupEvent.Player.Gamertag) {
					const dropTimeInSeconds = moment.duration(dropEvent.TimeSinceStart).seconds();
					// if the weapon was held onto for less than 5 seconds, lets not count it as a turnover
					if (dropTimeInSeconds - pickupTimeInSeconds <= 5) {
						return;
					}

					// the weapon was dropped more than 5 seconds after it was picked up, now lets check if an enemy snagged it later
					for (let enemyPickupIndex = dropEventIndex + 1; enemyPickupIndex < events.length; enemyPickupIndex++) {
						const enemyPickupEvent = events[enemyPickupIndex];

						// if the same weapon that was dropped was picked up by an enemy...
						if (enemyPickupEvent.EventName === 'WeaponPickup' && enemyPickupEvent.WeaponStockId === friendlyPickupEvent.WeaponStockId) {

							// if the team that picked up the weapon is different than the team that dropped the weapon, its a turnover
							if (carnageData.users[friendlyPickupEvent.Player.Gamertag].friendlyTeam !== carnageData.users[enemyPickupEvent.Player.Gamertag].friendlyTeam) {
								carnageData.users[friendlyPickupEvent.Player.Gamertag].turnovers++
							}
							// the weapon was picked up. regardless of turnover status we are done checking future events.
							return;
						}
					}
					// weapon was dropped less than 5 seconds after it was picked up. player didn't really have control
					return;
				}
			}
		}
	});

	return carnageData;
}
