'use strict';

const Library = require('../lib.js');
const CreateSerie = require('../serie/createSerie.js');

class About extends Library {
    constructor(req, res, query){
      super(req, res);
      this.query = query;
    }

    async index(){
      if(this.method == 'GET'){this.self(session); return;}
      // if(this.method == 'POST'){this.create(session); return;}
      // if(this.method == 'PATCH'){this.update(session); return;}
      // if(this.method == 'DELETE'){this.remove(session); return;}
      this.render({status: false}, 404);
    }

    async self(user){
      this.render(await this.db.find_all('serier', {}, {_id: 0, name: 1, owners: 1, id: 1, created: 1}, {created: -1}));
    }
    //
    // async create(user) {
    //   const required = ["name", "team"];
    //   let input = await this.post();
    //
    //   if(!this.isset(input, required)){
    //     this.render({status: false, error: "empty fields"}); return;
    //   }
    //
    //   let teams = this.extract_value('team', input);
    //   input = this.format(input);
    //
    //   if(typeof teams === 'string'){teams = [teams];}
    //   teams = teams.map((item) => {return this.sanitize(item);});
    //
    //   const {data, status, error} = await new CreateSerie(user, input, teams).generate();
    //   if(!status){
    //     this.render({status: false, error: error}); return;
    //   }
    //
    //   const howManyLeagues = await this.db.find_all('serier', {owners: user.username});
    //
    //   if(howManyLeagues.length > 20) {
    //     this.render({status:false, error: "Can't create any more leagues, server can't take it."}, 403); return;
    //   }
    //
    //   this.render(await this.db.insert_with_unique_id('serier', data, this.random_id, null, 'id'));
    // }
    //
    // async update(user){
    //     const target = await this.get();
    //     if(target === false){return;}
    //
    //     if(!target.owners.includes(user.username) && !(user.group == 0 || user.group == 1)){
    //         this.render({status: false, error: "cant touch this"}, 401); return;
    //     }
    //
    //     let owners = Array.from(target.owners);
    //     if(this.query.add != null){
    //         if(typeof this.query.add == 'string'){
    //             this.query.add = [this.query.add];
    //         }
    //
    //         for(const owner of this.query.add){
    //             if(await this.db.count('users', {username: owner}) == 0){
    //                 this.render({status: false, error: "cant add users who not exist"}); return;
    //             }
    //             if(!owners.includes(owner)){
    //                 owners.push(owner);
    //             }
    //         }
    //         delete this.query.add;
    //     }
    //
    //     if(this.query.remove != null){
    //         if(typeof this.query.remove == 'string'){
    //             this.query.remove = [this.query.remove];
    //         }
    //         for(const owner of this.query.remove){
    //             if(owners.includes(owner)){
    //                 owners.splice(owners.indexOf(owner), 1);
    //             }
    //         }
    //         delete this.query.remove;
    //     }
    //
    //     let changes = {owners: owners};
    //
    //     if(this.query.group != null){
    //         if(target.groups[this.query.group] == null){
    //             this.render({status: false, error: "group not found"}); return;
    //         }
    //
    //         if(target.groups[this.query.group].completed !== true){
    //             const p = new Progress(target);
    //             if(p.complete(this.query.group, true)){
    //                 changes['groups.' + this.query.group + '.completed'] = true;
    //
    //                 const list = p.get_bracket(this.query.group);
    //                 if(list !== false){
    //                     changes.bracket = p.populate_bracket(list);
    //                 }
    //             }else {
    //                 this.render({status: false, error: "group not completed"}); return;
    //             }
    //         }
    //     }
    //
    //     const allowed = ["name", "text"];
    //     for(const item of allowed){
    //         if(this.query[item] != null){
    //             changes[item] = this.sanitize(this.query[item]);
    //             delete this.query[item];
    //         }
    //     }
    //
    //     for(const item in this.query){
    //         try{
    //             const n = Number(item);
    //             if(!Number.isNaN(n)){
    //                 if(n >= 0 && n < target.teams.length){
    //                     changes['teams.'+n] = this.sanitize(this.query[item]);
    //                 }
    //             }
    //         }catch(e){continue;}
    //     }
    //
    //     this.render(await this.db.edit('serier', {id: target.id}, changes));
    // }
    //
    // async remove(user){
    //   const target = await this.get();
    //   if(target === false){return;}
    //
    //   if(target.owners.includes(user.username) || user.group == 0 || user.group == 1){
    //     try {
    //       this.render(await this.db.remove('serier', {id: this.query.s}));
    //     }
    //     catch(err) {
    //       this.render({status: false}, 401);
    //     }
    //   }
    //   this.render({status: false}, 401);
    // }
    //
    // get(){
    //     return new Promise(async (resolve) => {
    //         if(this.query.s != null){
    //           try {
    //             const target = await this.db.find('serier', {id: this.query.s});
    //             if(target != null){
    //               resolve(target); return;
    //             }
    //           }
    //           catch(err) {
    //             this.render({status: false, error: err}, 404);
    //           }
    //         }
    //         this.render({status: false, error: "no target"}, 404);
    //         resolve(false);
    //     });
    // }
}

module.exports = Serie;
