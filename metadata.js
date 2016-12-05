const request = require('request');
const config = require('./config');
const limiter = config.limiter;
const async = require('neo-async');

module.exports.getMetadata = function (cb) {
	async.parallel([getMaps, getMedals, getImpulses, getWeapons, getGameBaseVariants], cb);
};

function getMaps (cb) {
	console.info('Fetching Maps...');
	limiter.removeTokens(1, (err, remainingRequests) => {
		request({
			method: 'GET',
			uri: config.getMetaDataUrl('maps'),
			json: true,
			gzip: true,
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

			// keep dictionary of mapId -> mapName in our config object for easy lookups
			body.forEach(map => {
				// there is apparently a null map that just ruins everything
				if (!map.name) {
					return;
				}
				config.set('map', map.id, map.name);
			});

			cb(null, body);
		});
	});
};

function getMedals (cb) {
	console.info('Fetching Medal...');
	limiter.removeTokens(1, (err, remainingRequests) => {
		request({
			method: 'GET',
			uri: config.getMetaDataUrl('medals'),
			json: true,
			gzip: true,
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

			// keep dictionary of medalId -> medalName in config object
			body.forEach(medal => {
				config.set('medal', medal.id, medal.name);
			});

			cb(null, body);
		});
	});
};

function getImpulses (cb) {
	console.info('Fetching Impulses...');
	limiter.removeTokens(1, (err, remainingRequests) => {
		request({
			method: 'GET',
			uri: config.getMetaDataUrl('impulses'),
			json: true,
			gzip: true,
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

			// keep dictionary of impulseId -> impulseName
			body.forEach(impulse => {
				config.set('impulse', impulse.id, impulse.internalName);
			});

			cb(null, body);
		});
	});
};

function getWeapons (cb) {
	console.info('Fetching Weapons...');
	limiter.removeTokens(1, (err, remainingRequests) => {
		request({
			method: 'GET',
			uri: config.getMetaDataUrl('weapons'),
			json: true,
			gzip: true,
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

			// keep dictionary of weaponId -> weaponName
			body.forEach(weapon => {
				config.set('weapon', weapon.id, weapon.name);
			});

			cb(null, body);
		});
	});
};

function getGameBaseVariants (cb) {
	console.info('Fetching Gametypes...');
	limiter.removeTokens(1, (err, remainingRequests) => {
		request({
			method: 'GET',
			uri: config.getMetaDataUrl('game-base-variants'),
			json: true,
			gzip: true,
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

			// keep dictionary of gametypeId -> gametypeName
			body.forEach(gametype => {
				// there's a null gametype for forge. don't index it.
				if (!gametype.name) {
					return;
				}
				config.set('gametype', gametype.id, gametype.name);
			});

			cb(null, body);
		});
	});
};
