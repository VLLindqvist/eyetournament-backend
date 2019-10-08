'use strict';

const ResultsSerie = require('./resultsSerie.js');

class RemoveGame {
  constructor(target, gameToRemove){
      this.serie = target;
      this.games = target.games;
      this.gameToRemove = gameToRemove;
  }

  async generate(){
    this.serie = await this.remover();
    return;
  }

  async remover() {
    if(this.games.length > 1 && Array.isArray(this.gameToRemove)) {
      this.gameToRemove.map((game) => {
        this.games.map((tmp, index) => {
          if(index == game) {
            this.serie.games.splice(index, 1);
          }
        });
      });
    }
    else if(this.games.length > 1 && !Array.isArray(this.gameToRemove)) {
      this.games.map((tmp, index) => {
        if(index == this.gameToRemove) {
          this.serie.games.splice(index, 1);
        }
      });
    }
    else if(this.games.length == 1 && Array.isArray(this.gameToRemove)) {
      this.gameToRemove.map((game) => {
        if(game == 0) {
          this.serie.games.splice(0, 1);
        }
      });
    }
    else {
      if(this.gameToRemove == 0) {
        this.serie.games.splice(0, 1);
      }
    }

    return this.serie;
  }
}

module.exports = RemoveGame;
