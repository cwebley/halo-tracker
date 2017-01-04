const request = require('request');
const config = require('./config');
const limiter = config.limiter;

module.exports.getMatches = function getMatches ({ gamertag, skip, count, allowCustoms, matches }, cb) {
	if (!matches || !matches.length) {
		matches = [];
	}
	const effectiveCount = count && count < 25 ? count : 25;
	console.info(`Fetching ${effectiveCount} matches for ${gamertag} (skipping ${skip})`);
	limiter.removeTokens(1, (err, remainingTokens) => {
		request({
			method: 'GET',
			uri: config.getMatchesUrl({
				gamertag,
				start: skip,
				count: effectiveCount
			}),
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

			// don't allow custom games, use all games after the first custom game found as the data set
			if (!allowCustoms && effectiveCount) {
				// find the beginning of the session (1 arena, 2 campaign, 3 custom, 4 warzone)
				let startOfSessionIndex;
				for (let i=0; i < body.Results.length; i++) {
					if (body.Results[i].Id.GameMode !== 1) {
						// beginning of the session found
						startOfSessionIndex = i;
						break;
					}
				}

				// start of session found
				if (startOfSessionIndex !== undefined) {
					// found the beginning of the session
					Array.prototype.push.apply(matches, body.Results.slice(0, startOfSessionIndex));
					cb(null, matches);
					return;
				}
			}

			// push all the results onto our matches array regardless of whether we need to fetch more
			Array.prototype.push.apply(matches, body.Results);

			// end of count reached and start of session not found
			if (body.Results.length === count) {
				cb(null, matches);
				return;
			}

			// neither start of session found nor end of count reached--recursively paginate
			getMatches({
				gamertag,
				skip: skip + effectiveCount,
				count: count - effectiveCount,
				matches
			}, cb);
			return;
		});
	});
}
