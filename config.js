const RateLimiter = require('limiter').RateLimiter;

 // haloapi only allows 10 requests every 10 seconds
module.exports.limiter = new RateLimiter(10, 10000);

module.exports.API_KEY = 'c4778a4ab06e40c39136923ae01c4245';

module.exports.getMetaDataUrl = function (type) {
	return `https://www.haloapi.com/metadata/h5/metadata/${type}`;
}
module.exports.getMatchesUrl = function (gamertag) {
	return `https://www.haloapi.com/stats/h5/players/${gamertag}/matches?count=2`;
}
