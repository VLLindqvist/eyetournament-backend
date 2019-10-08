'use strict';

// 1. poäng
// 2. antal vinster
// 3. målskillnad
// 4. lottning
// 'all' tar hänsyn till att det kan vara olika antal i grupperna

class Rank {
    constructor(serie){
        this.serie = serie;
        this.games = serie.games;
    }

    async sorter() {
      for(let i = 0; i < this.serie.teams.length; ++i) {
        this.serie.rank[i] = i;
      }
      console.log(this.serie.rank);
      for(let i = 0; i < this.serie.teams.length-1; i++){
        for(let j = i+1; j < this.serie.teams.length; j++){
          if(parseInt(this.serie.points[j]) > parseInt(this.serie.points[i])) {
            let temp1 = this.serie.rank[i];
            this.serie.rank[i] = this.serie.rank[j];
            this.serie.rank[j] = temp1;
            continue;
          }

          else if(parseInt(this.serie.points[j]) === parseInt(this.serie.points[i])){
            if(this.serie.stats[j][6] > this.serie.stats[i][6]){
              let temp1 = this.serie.rank[i];
              this.serie.rank[i] = this.serie.rank[j];
              this.serie.rank[j] = temp1;
              continue;
            }
          }
        }
      }

      return this.serie;
    }

    all(excludes){
      let teams = [];
      let points = [];

      for(let i = 0; i < this.serie.teams.length; i++){
        if(excludes.includes(this.serie.teams[i])){continue;}
        teams.push(this.serie.teams[i]);
        points.push(this.serie.points[i] / this.serie.teams.length);
      }
      return this.sort(teams, points, false);
    }

    sort(teams, points, group){
        teams = teams.slice();
        points = points.slice();

        for(let i = 0; i < teams.length-1; i++){
            for(let j = i+1; j < teams.length; j++){
                if(points[j] > points[i]){
                    [points[i], points[j]] = [points[j], points[i]];
                    [teams[i], teams[j]] = [teams[j], teams[i]];
                    continue;
                }

                if(points[j] == points[i]){
                    let t1, t2;
                    if(group){
                        ({r1: t1, r2: t2} = this.wins(teams[j], teams[i]));
                    }else {
                        t1 = this.sum(teams[j]);
                        t2 = this.sum(teams[i]);
                    }

                    if(t1[0] > t2[0]){
                        [points[i], points[j]] = [points[j], points[i]];
                        [teams[i], teams[j]] = [teams[j], teams[i]];
                        continue;
                    }

                    if(t1[1] > t1[1]){
                        [points[i], points[j]] = [points[j], points[i]];
                        [teams[i], teams[j]] = [teams[j], teams[i]];
                        continue;
                    }

                    if(Math.floor(Math.random()*2) == 0){
                        [points[i], points[j]] = [points[j], points[i]];
                        [teams[i], teams[j]] = [teams[j], teams[i]];
                    }
                }
            }
        }

        return teams;
    }

    wins(t1, t2){
        let res_t1 = [0, 0]; //wins, goals,
        let res_t2 = [0, 0];

        for(const item of this.games){
            if(item.status){
                if((item.teams[0] == t1 || item.teams[0] == t2) && (item.teams[1] == t1 || item.teams[1] == t2)){
                    if(item.results[0] > item.results[1]){
                        if(item.teams[0] == t1){
                            res_t1[0]++;
                        }else {
                            res_t2[0]++;
                        }
                    }else if(item.results[1] > item.results[0]){
                        if(item.teams[1] == t1){
                            res_t1[0]++;
                        }else {
                            res_t2[0]++;
                        }
                    }

                    res_t1[1] += item.results[0];
                    res_t2[1] += item.results[1];
                }
            }
        }

        return {r1: res_t1, r2: res_t2};
    }

    sum(team){
        let res = [0, 0, 0]; // wins, goals, -goals
        for(const item of this.games){
            if(item.status){
                if(item.teams[0] == team){
                    if(item.results[0] > item.results[1]){
                        res[0]++;
                    }

                    res[1] += item.results[0];
                    res[2] += item.results[1];
                }

                if(item.teams[1] == team){
                    if(item.results[1] > item.results[0]){
                        res[0]++;
                    }

                    res[1] += item.results[1];
                    res[2] += item.results[0];
                }
            }
        }

        return [(res[0] / this.serie.teams.length), ((res[1] - res[2]) / this.serie.teams.length)];
    }
}

module.exports = Rank;

// if(this.serie.stats[j][6] == this.serie.stats[i][6]){
//   this.serie.games.map((game, index) => {
//     if(game.teams[0] == this.serie.teams[j] && game.teams[1] == this.serie.teams[i]) {
//       if(game.results[0] > game.results[1]) {
//         let temp1 = this.serie.rank[i];
//         this.serie.rank[i] = this.serie.rank[j];
//         this.serie.rank[j] = temp1;
//         continue;
//       }
//     }
//     if(game.teams[1] == this.serie.teams[j] && game.teams[0] == this.serie.teams[i]) {
//       if(game.results[1] > game.results[0]) {
//         let temp1 = this.serie.rank[i];
//         this.serie.rank[i] = this.serie.rank[j];
//         this.serie.rank[j] = temp1;
//         continue;
//       }
//     }
//   });
// }
