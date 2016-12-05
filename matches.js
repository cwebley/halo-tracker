const request = require('request');
const config = require('./config');
const limiter = config.limiter;

// fetches the most recent 25 games and only returns the most recent games that are arena (GameMode = 1)
// there is no pagination right now if the session is longer than 25 games
module.exports.getMatches = function (gamertag, cb) {
	console.info(`Fetching matches for ${gamertag}`);
	limiter.removeTokens(1, (err, remainingTokens) => {
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

			// find the beginning of the session (1 arena, 2 campaign, 3 custom, 4 warzone)
			let startOfSessionIndex = body.Results.length;
			for (let i=0; i < body.Results.length; i++) {
				if (body.Results[i].Id.GameMode !== 1) {
					// beginning of the session found
					startOfSessionIndex = i;
					break;
				}
			}

			// only include the current arena session
			cb(null, body.Results.slice(0, startOfSessionIndex));
		});
	});
};
