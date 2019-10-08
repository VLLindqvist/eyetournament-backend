'use strict';

class CreateSerie {
    constructor(creator, data, teams){
        this.creator = creator;
        this.data = data;
        this.teams = teams;
    }

    generate(){
      const {points, stats, rank} = this.stats(this.teams.length);

        return {data: {
            name: this.data.name,
            text: this.data.text,
            created: new Date().getTime(),
            owners: [this.creator.username],
            teams: this.teams,
            games: [],
            points: points,
            stats: stats,
            rank: rank
        }, status: true, error: null};
    }

    // total: antalet lag
    stats(total) {
        let points = [];
        let stats = [];
        let rank = [];

        for(let j = 0; j < total; j++){
            rank.push(j);
        }

        for(let k = 0; k < total; k++){
            points.push(0);
            stats.push([0, 0, 0, 0, 0, 0, 0]);
        }

        return {points, stats, rank};
    }
}

module.exports = CreateSerie;
