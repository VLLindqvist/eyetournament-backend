'use strict';

const ResultsSerie = require('./resultsSerie.js');

class RemoveTeam {
  constructor(target, teamToRemove){
      this.serie = target;
      this.teams = target.teams;
      this.points = target.points;
      this.stats = target.stats;
      this.rank = target.rank;
      this.games = target.games;
      this.teamToRemove = teamToRemove;
  }

  async generate(){
    let anyGames = false;
    let manyGames = false;
    if(this.games.length != 0) {
      anyGames = true;
      if(this.games.length > 1) {
        manyGames = true;
      }
    }
    console.log(anyGames);
    console.log(manyGames);

//------------- IF THERE ARE GAMES --------------
    if(anyGames == true) {
      if(Array.isArray(this.teamToRemove) && manyGames == true) {
        this.teamToRemove.map((teamToRemove) => {
          this.teams.splice(teamToRemove, 1);
          this.points.splice(teamToRemove, 1);
          this.stats.splice(teamToRemove, 1);
          this.rank.splice(teamToRemove, 1);
        });
        this.games.map((game, i) => {
          if(this.teamToRemove.some(r => r == game.teams[0]) || this.teamToRemove.some(r => r == game.teams[1])) {
            this.games.splice(i, 1);
          }
        });
      }

      else if(!Array.isArray(this.teamToRemove) && manyGames == true) {
        this.teams.splice(this.teamToRemove, 1);
        this.points.splice(this.teamToRemove, 1);
        this.stats.splice(this.teamToRemove, 1);
        this.rank.splice(this.teamToRemove, 1);

        this.games.map((game, i) => {
          if(this.teamToRemove == game.teams[0] || this.teamToRemove == game.teams[1]) {
            this.games.splice(i, 1);
          }
        });
      }

      else if(Array.isArray(this.teamToRemove) && manyGames == false) {
        this.teamToRemove.map((teamToRemove) => {
          this.teams.splice(teamToRemove, 1);
          this.points.splice(teamToRemove, 1);
          this.stats.splice(teamToRemove, 1);
          this.rank.splice(teamToRemove, 1);
        });
        if(this.teamToRemove.some(r => r == this.games[0].teams[0]) || this.teamToRemove.some(r => r == this.games[0].teams[1])) {
          this.games.splice(0, 1);
        }
      }

      else {
        this.teams.splice(this.teamToRemove, 1);
        this.points.splice(this.teamToRemove, 1);
        this.stats.splice(this.teamToRemove, 1);
        this.rank.splice(this.teamToRemove, 1);
        if(this.teamToRemove == this.games[0].teams[0] || this.teamToRemove == this.games[0].teams[1]) {
          this.games.splice(0, 1);
        }
      }
    }

//---------- IF THERE ARE NO GAMES -----------
    else {
      if(Array.isArray(this.teamToRemove)) {
        this.teamToRemove.map((teamToRemove) => {
          this.teams.splice(teamToRemove, 1);
          this.points.splice(teamToRemove, 1);
          this.stats.splice(teamToRemove, 1);
          this.rank.splice(teamToRemove, 1);
        });
      }

      else {
        this.teams.splice(this.teamToRemove, 1);
        this.points.splice(this.teamToRemove, 1);
        this.stats.splice(this.teamToRemove, 1);
        this.rank.splice(this.teamToRemove, 1);
      }
    }

    this.serie = await new ResultsSerie(this.serie, null).update();

    return {data: {
        teams: this.serie.teams,
        points: this.serie.points,
        stats: this.serie.stats,
        rank: this.serie.rank,
        games: this.serie.games
    }, status: true, error: null};
  }
}

module.exports = RemoveTeam;
