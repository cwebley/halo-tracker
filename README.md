#Halo Tracker
Command line tool that aggregates stats for a Halo session that are otherwise hard or annoying to obtain

## Usage

```bash
	node index.js 'The Furious Moo' 'WWMJPD' 'I chan I' 'TFA Ch3ckMate'
	# hits haloapi requesting the matches for args[0]
	# loops through all the matches of the most recent session (defined by every game from through when a custom game is recorded)
	# hits halo api for carnage reports and match events for every match
	# crunches a bunch of numbers then outputs a few giant tables of stats
```
