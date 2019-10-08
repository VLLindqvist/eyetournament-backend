'use strict';

const ResultsSerie = require('./resultsSerie.js');

class CreateTeam {
    constructor(teams, serie){
        this.serie = serie;
        this.teams = teams
        this.oldTeams = serie.teams;
    }

    async generate(){
      const {points, stats, rank} = await this.stats(this.teams.length, this.oldTeams.length);

      this.serie = await new ResultsSerie(this.serie, null).update();

      return {data: {
          teams: this.teams,
          points: points,
          stats: stats,
          rank: rank,
      }, status: true, error: null};
    }

    // total: antalet lag
    async stats(total, amountOldTeams) {
        let points = [];
        let stats = [];
        let rank = [];

        for(let j = 0; j < total; j++){
            rank.push(j + amountOldTeams);
        }

        for(let k = 0; k < total; k++){
            points.push(0);
            stats.push([0, 0, 0, 0, 0, 0, 0]);
        }

        return {points, stats, rank};
    }
}

module.exports = CreateTeam;
