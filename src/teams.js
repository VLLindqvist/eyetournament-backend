'use strict';

const Library = require('../lib.js');
const CreateTeam = require('../serie/createTeam.js');
const RemoveTeam = require('../serie/removeTeam.js');

class Teams extends Library {
  constructor(req, res, query){
    super(req, res);
    this.query = query;
  }

  async index(){
    const session = await this.authenticate();
    if(!session){this.render({}, 401); return;}
    if(this.method == 'GET'){this.self(session); return;}
    if(this.method == 'POST'){this.create(session); return;}
    if(this.method == 'PATCH'){this.update(session); return;}
    if(this.method == 'DELETE'){this.remove(session); return;}
    this.render({status: false}, 404);
  }

  async self(user){
    //Gör om
    this.render(await this.db.find_all('serier', {owners: user.username}, {_id: 0, name: 1, owners: 1, id: 1, created: 1}, {created: -1}));
  }

  // check korrekt nummer eller string osv osv..
  async create(user){
    const required = ["s", "team"];
    let input = await this.post();

    if(!this.isset(input, required)){
      this.render({status: false, error: "empty fields"}); return;
    }

    let id = this.extract_value('s', input);

    const target = await this.get(id);
    if(target === false){return;}

    if(!target.owners.includes(user.username) && !(user.group == 0 || user.group == 1)){
      this.render({status: false, error: "cant touch this"}, 401); return;
    }

    let teams = this.extract_value('team', input);
    input = this.format(input);

    if(typeof teams === 'string'){teams = [teams];}
    teams = teams.map((item) => {return this.sanitize(item);});

    const {data, status, error} = await new CreateTeam(teams, target).generate();
    if(!status){
      this.render({status: false, error: error}); return;
    }

    await this.db.edit('serier', {id: id}, null, {teams: { $each: data.teams}});
    await this.db.edit('serier', {id: id}, null, {points: { $each: data.points}});
    await this.db.edit('serier', {id: id}, null, {stats: { $each: data.stats}});
    await this.db.edit('serier', {id: id}, null, {rank: { $each: data.rank}});

    this.render({status: true}, 200);
  }

  async update(user){
    this.render({status: false, error: "inte implementerad ännu"});
    return;
  }

  async remove(user){
    const target = await this.get(this.query.s);
    if(target === false){return;}

    if(target == null){
      this.render({status: false, error: "League not found"}, 404);
      return;
    }

    if(this.query.team == null) {
      this.render({status: false, error: "fields missing"}, 404);
      return;
    }

    if(target.teams.length == 0) {
      this.render({status: false, error: "no teams in league"}, 404);
      return;
    }

    if(Array.isArray(this.query.team)) {
      if(this.query.team.some(r => r > (target.teams.length - 1))) {
        this.render({status: false, error: "Teams not found"}, 404);
        return;
      }

      if(this.query.team.length + 1 > target.teams.length) {
        this.render({status: false, error: "Not that many teams in league"}, 404);
        return;
      }
    }
    else {
      if(this.query.team > (target.teams.length - 1)) {
        this.render({status: false, error: "Team not found"}, 404);
        return;
      }
    }

    if(target.teams.length == 1) {
      this.render({status: false, error: "Can't remove last team"}, 404);
      return;
    }

    if(target.owners.includes(user.username) || user.group == 0 || user.group == 1){
      const {data, status, error} = await new RemoveTeam(target, this.query.team).generate();

      await this.db.edit('serier', {id: this.query.s}, {teams: data.teams});
      await this.db.edit('serier', {id: this.query.s}, {points: data.points});
      await this.db.edit('serier', {id: this.query.s}, {stats: data.stats});
      await this.db.edit('serier', {id: this.query.s}, {rank: data.rank});
      await this.db.edit('serier', {id: this.query.s}, {games: data.games});
      this.render({status: true}, 200);
    }
    this.render({status: false}, 401);
  }

  get(id){
    return new Promise(async (resolve) => {
      if(id != null){
        const target = await this.db.find('serier', {id: id});
        if(target != null){
          resolve(target); return;
        }
        else {
          this.render({status: false, error: "target issue"}, 404);
          resolve(false);
        }
      }
      else {
        this.render({status: false, error: "target issue"}, 404);
        resolve(false);
      }
    });
  }
}

module.exports = Teams;
