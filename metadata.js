const request = require('request');
const config = require('./config');
const limiter = config.limiter;
const async = require('neo-async');

module.exports.getMetadata = function (cb) {
	async.parallel({
		maps: getMaps,
		medals: getMedals,
		impulses: getImpulses,
		weapons: getWeapons
	}, (err, results) => {
		cb(err, results)
		return;
	});
};

getMaps = function (cb) {
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

			cb(null, body);
		});
	});
};

getMedals = function (cb) {
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

			cb(null, body);
		});
	});
};

getImpulses = function (cb) {
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

			cb(null, body);
		});
	});
};

getWeapons = function (cb) {
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

			cb(null, body);
		});
	});
};
