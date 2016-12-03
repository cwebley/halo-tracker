const request = require('request');
const config = require('./config');
const limiter = config.limiter;

module.exports.getMatches = function (gamertag, cb) {
	limiter.removeTokens(1, (err, remainingTokens) => {
		console.log("LIMITER ERR: ", err);
		console.log("REMAINING: ", remainingTokens);
		request({
			method: 'GET',
			uri: config.getMatchesUrl(gamertag),
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
			console.log("MATCHSES RESP: ", body)
			cb(null, body.Results);
		});
	});
};
