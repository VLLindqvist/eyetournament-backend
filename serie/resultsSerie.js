'use strict';

const Rank = require('./rank.js');

class ResultsSerie {
    constructor(serie, game_id){
        this.serie = serie;
        this.game_id = game_id;
    }

    async add(r1, r2, lika){
      this.serie.games[this.game_id].results[0] = r1;
      this.serie.games[this.game_id].results[1] = r2;
      if(lika) {
        this.serie.games[this.game_id].lika = true;
      }
      this.serie.games[this.game_id].edit = new Date().getTime();
      this.serie.games[this.game_id].status = true;
      this.serie = await this.update();
      return this.serie;
    }

    updateResults() {
      for(let i = 0; i < this.serie.teams.length; i++) {
        this.serie.rank[i] = i;
      }

      if(this.serie.teams.length > 0) {
        if(this.serie.games.length > 0) {
          this.serie.teams.map((team, i) => {
            let points = 0;
            let gp = 0;
            let wins = 0;
            let losses = 0;
            let ot = 0;
            let goaldiff = 0;
            let goals = 0;
            let igoals = 0;

            this.serie.games.map((game, j) => {
              if(game.results[0] !== "" && game.results[1] !== "" && game.teams[0] !== null && game.teams[1] !== null) {
                if(team == this.serie.teams[game.teams[0]]) {
                  if(game.lika) {
                    if(game.results[0] > game.results[1]) {
                      points += 2;
                      wins += 1;
                    }
                    else {
                      points += 1;
                      ot += 1;
                    }
                  }
                  else {
                    if(game.results[0] > game.results[1]) {
                      points += 3;
                      wins += 1;
                    }
                    else if(game.results[0] < game.results[1]) {
                      losses += 1;
                    }
                    else {
                      points += 1;
                      ot += 1;
                    }
                  }
                  gp += 1;
                  goals += game.results[0];
                  igoals += game.results[1];
                  goaldiff += (game.results[0] - game.results[1]);
                }

                if(team == this.serie.teams[game.teams[1]]) {
                  if(game.lika) {
                    if(game.results[1] > game.results[0]) {
                      points += 2;
                      wins += 1;
                    }
                    else {
                      points += 1;
                      ot += 1;
                    }
                  }
                  else {
                    if(game.results[1] > game.results[0]) {
                      points += 3;
                      wins += 1;
                    }
                    else if(game.results[1] < game.results[0]) {
                      losses += 1;
                    }
                    else {
                      points += 1;
                      ot += 1;
                    }
                  }
                  gp += 1;
                  goals += game.results[1];
                  igoals += game.results[0];
                  goaldiff += (game.results[1] - game.results[0]);
                }
              }
            });
            this.serie.points[i] = points;
            this.serie.stats[i][0] = gp;
            this.serie.stats[i][1] = wins;
            this.serie.stats[i][2] = losses;
            this.serie.stats[i][3] = ot;
            this.serie.stats[i][4] = goals;
            this.serie.stats[i][5] = igoals;
            this.serie.stats[i][6] = goaldiff;
          });
        }
        else {
          this.serie.teams.map((team, i) => {
            this.serie.points[i] = 0;
            this.serie.stats[i][0] = 0;
            this.serie.stats[i][1] = 0;
            this.serie.stats[i][2] = 0;
            this.serie.stats[i][3] = 0;
            this.serie.stats[i][4] = 0;
            this.serie.stats[i][5] = 0;
            this.serie.stats[i][6] = 0;
          });
        }
      }
      else {
        this.serie.points[0] = 0;
        this.serie.stats[0][0] = 0;
        this.serie.stats[0][1] = 0;
        this.serie.stats[0][2] = 0;
        this.serie.stats[0][3] = 0;
        this.serie.stats[0][4] = 0;
        this.serie.stats[0][5] = 0;
        this.serie.stats[0][6] = 0;
      }
    }

    async update() {
      await this.updateResults();
      this.serie = await new Rank(this.serie).sorter();
      return this.serie;
    }

    addTeam(t1, t2) {
      if(t2 == null) {
        this.serie.games[this.game_id].teams[0] = t1;
      }
      if(t1 == null) {
        this.serie.games[this.game_id].teams[1] = t2;
      }

      return this.update();
    }

    points(r1, r2){
        let p1, p2, o1 = 0, o2 = 0, v1 = 0, v2 = 0;
        if(r1 == r2){
            p1 = p2 = o1 = o2 = 1;
        } else if(r1 > r2){
            p1 = 3; p2 = 0;
            v1 = 1;
        } else if(r1 < r2){
            p1 = 0; p2 = 3;
            v2 = 1;
        };
        return {p1: p1, p2: p2, o1: o1, o2: o2, v1: v1, v2: v2};
    }

    // group_completed(){
    //     const group = this.tournament.games[this.game_id].group;
    //     let i = 0;
    //     for(const item of this.tournament.games){
    //         if(item.status == false && item.group == group && i != this.game_id){
    //             return false;
    //         }
    //         i++;
    //     }
    //     return true;
    // }
}

module.exports = ResultsSerie;
