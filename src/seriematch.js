'use strict';

const Library = require('../lib.js');
const ResultsSerie = require('../serie/resultsSerie.js');
const RemoveGame = require('../serie/removeGame.js');

class SerieGame extends Library {
  constructor(req, res, query){
    super(req, res);
    this.query = query;
  }

  async index(){
    const session = await this.authenticate();
    if(!session) {this.render({}, 401); return;}
    if(this.method == 'PATCH') {this.update(session); return;}
    if(this.method == 'POST') {this.create(session); return;}
    if(this.method == 'DELETE'){this.remove(session); return;}
    this.render({status: false}, 404);
  }

  async update(user) {
    if(this.isset(this.query, ["s", "g", "t1"])) {
      let s = await this.db.find('serier', {id: this.query.s});

      if(s == null){
        this.render({status: false,}, 404); return;
      }

      if(!s.owners.includes(user.username) && !(user.group == 0 || user.group == 1)){
        this.render({status: false, error: "cant touch this"}, 401); return;
      }

      if(typeof this.query.t1 === 'number' && typeof Number.isInteger(this.query.t1)) {
        this.render({status: false, error: "NaN"}); return;
      }

      if(s.games[this.query.g] == null) {
        this.render({status: false, error: "game not found"}); return;
      }

      if(Array.isArray(s.teams)) {
        if(this.query.t1 > (s.teams.length - 1) || this.query.t1 < 0) {
          this.render({status: false, error: "team not found"}, 404); return;
        }
        if(this.query.t1 == parseInt(s.games[this.query.g].teams[1])) {
          s.games[this.query.g].teams[1] = null;
        }
        if(this.query.t1 == parseInt(s.games[this.query.g].teams[0])) {
          this.render({status: false, error: "No updates"}, 200); return;
        }
      }
      else {
        this.render({status: false, error: "There is only one team in the league"}, 404); return;
      }

      const res = await new ResultsSerie(s, this.query.g);

      let update = null;
      s = await res.addTeam(parseInt(this.query.t1), null);
        //rank changes..

      this.render(await this.db.edit('serier', {id: this.query.s}, s), 200);
      return;
    }

    if(this.isset(this.query, ["s", "g", "t2"])) {
      let s = await this.db.find('serier', {id: this.query.s});

      if(s == null){
        this.render({status: false,}, 404); return;
      }

      if(!s.owners.includes(user.username) && !(user.group == 0 || user.group == 1)){
        this.render({status: false, error: "cant touch this"}, 401); return;
      }

      if(typeof this.query.t2 === 'number' && typeof Number.isInteger(this.query.t2)) {
        this.render({status: false, error: "NaN"}); return;
      }

      if(s.games[this.query.g] == null) {
        this.render({status: false, error: "game not found"}); return;
      }

      if(Array.isArray(s.teams)) {
        if(this.query.t2 > (s.teams.length - 1) || this.query.t2 < 0) {
          this.render({status: false, error: "team not found"}, 404); return;
        }
        if(this.query.t2 == parseInt(s.games[this.query.g].teams[0])) {
          s.games[this.query.g].teams[0] = null;
        }
        if(this.query.t2 == parseInt(s.games[this.query.g].teams[1])) {
          this.render({status: false, error: "No updates"}, 200); return;
        }
      }
      else {
        this.render({status: false, error: "There is only one team in the league"}, 404); return;
      }

      const res = await new ResultsSerie(s, this.query.g);
      s = await res.addTeam(null, parseInt(this.query.t2));

      this.render(await this.db.edit('serier', {id: this.query.s}, s), 200);
      return;
    }

    //add results
    if(this.isset(this.query, ["s", "g", "r1", "r2"])){
      let s = await this.db.find('serier', {id: this.query.s});

      if(s == null){
        this.render({status: false, error: "No league found"}, 404); return;
      }

      if(!s.owners.includes(user.username) && !(user.group == 0 || user.group == 1)){
        this.render({status: false, error: "cant touch this"}, 401); return;
      }

      if(!this.is_number([parseInt(this.query.r1), parseInt(this.query.r2)])){
        this.render({status: false, error: "NaN"}); return;
      }

      if(s.games[this.query.g] == null){
        this.render({status: false, error: "game not found"}); return;
      }
      if(parseInt(s.games[this.query.g].teams[0]) == parseInt(s.games[this.query.g].teams[1])) {
        this.render({status: false, error: "A team cannot play against itself"}, 404); return;
      }

      const res = await new ResultsSerie(s, this.query.g);
      if(this.isset(this.query, ["lika"])) {
        s = await res.add(parseInt(this.query.r1), parseInt(this.query.r2), true);
      }
      else {
        s = await res.add(parseInt(this.query.r1), parseInt(this.query.r2), false);
      }
      console.log(s);
      this.render(await this.db.edit('serier', {id: this.query.s}, s));
      return;
    }

    else {
      this.render({status: false, error: "empty fields"}, 404); return;
    }
  }

  async create(user) {
    const required = ["s"];
    let input = await this.post();

    if(!this.isset(input, required)){
      this.render({status: false, error: "empty fields"}); return;
    }

    const id = this.extract_value('s', input);
    const target = await this.db.find('serier', {id: id});

    if(target == null){
      this.render({status: false, error: "target issue"}, 404); return;
    }

    if(!target.owners.includes(user.username) && !(user.group == 0 || user.group == 1)){
      this.render({status: false, error: "cant touch this"}, 401); return;
    }

    input = this.format(input);

    const data = {
      teams: [null, null],
      results: ["", ""],
      status: false,
      edit: null,
      lika: false
    };

    this.render(await this.db.edit('serier', {id: id}, null, { games: data }));
  }

  async remove(user) {
    if(this.query.g == null || this.query.s == null) {
      this.render({status: false, error: "fields missing"}, 404);
      return;
    }

    let target = await this.db.find('serier', {id: this.query.s});
    if(target == null){
      this.render({status: false, error: "League not found"}, 404);
      return;
    }

    if(target.games == null) {
      this.render({status: false, error: "no games availible"}, 404);
      return;
    }

    if(Array.isArray(this.query.g) && Array.isArray(target.games)) {
      if(this.query.g.length > target.games.length) {
        this.render({status: false, error: "There are not that many games"}, 404);
        return;
      }
      if(!target.games.some((r, i) => this.query.g.includes(i))) {
        this.render({status: false, error: "games not found"}, 404);
        return;
      }
    }

    else if(!Array.isArray(this.query.g) && Array.isArray(target.games)) {
      if(!target.games.some((r, i) => this.query.g == i)) {
        this.render({status: false, error: "game not found"}, 404);
        return;
      }
    }
    else if(Array.isArray(this.query.g) && !Array.isArray(target.games)) {
      if(this.query.g.length > 1) {
        this.render({status: false, error: "There are not that many games"}, 404);
        return;
      }
      if(!this.query.g.includes(0)) {
        this.render({status: false, error: "games not found"}, 404);
        return;
      }
    }
    else {
      if(this.query.g != 0) {
        this.render({status: false, error: "game not found"}, 404);
        return;
      }
    }

    if(target.owners.includes(user.username) || user.group == 0 || user.group == 1){
      await new RemoveGame(target, this.query.g).generate();
      const res = await new ResultsSerie(target, this.query.g).update();

      this.render(await this.db.edit('serier', {id: this.query.s}, res));
    }
    this.render({status: false}, 401);
  }
}

module.exports = SerieGame;
