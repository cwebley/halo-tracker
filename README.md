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

##Interesting Stats
	In addition to simple aggregate stats for the session (kills, deaths, medals, flag pulls etc), there are a couple more interesting stats:
	* **Turnovers**
		Incremented when a player has control of a power weapon (tier 1 weapons like sniper/rockets,
			OR tier 2 weapons like shotgun/sword) for at least 5 seconds, then drops the weapon before having
			it be picked up by a member of the enemy team.
	* **BestAvgCsrWin**
		The highest ranked team beaten, by average CSR rating, for each map and overall
	* **Weapon Stats**
		Kills, headshots, damage, shots fired, accuracy for magnum, ar, and combined rifles
