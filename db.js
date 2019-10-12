'use strict';

const mongodb = require('mongodb');//3.1.6. .MongoClient;?
const url = 'mongodb://127.0.0.1:27017/';
const options = {useNewUrlParser:true};
const name = 'MTD-DB';

class Database {
    find(collection, query, projection){
        return new Promise((resolve) => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;}
                db.db(name).collection(collection).findOne(query, {projection: projection}, (err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(res);
                });
            });
        });
    }

    find_all(collection, query, projection, sort, limit, skip){
        if(limit == null){limit = 0;}
        if(skip == null){skip = 0;}
        return new Promise((resolve) => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;} 
                db.db(name).collection(collection).find(query, {projection: projection}).sort(sort).skip(skip).limit(limit).toArray((err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(res);
                });
            });
        });
    }

    insert(collection, data){
        return new Promise((resolve) => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;}
                db.db(name).collection(collection).insertOne(data, (err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(this.parse_results(res.result));
                });
            });
        });
    }

    insert_new_team(collection, data, id, key) {
      return new Promise((resolve) => {
        mongodb.connect(url, options, async (err, db) => {
          if(this.error(err)) {resolve(null); return;}

          let dbo = db.db(name);

          data[key] = id;
          dbo.collection(collection).updateOne(
            { id: id },
            { $addToSet: { teams: { $each: [data.teams] } } }
          );
        });
      });
    }

    insert_with_unique_id(collection, data, random, random_length, key){
        return new Promise((resolve) => {
            mongodb.connect(url, options, async (err, db) => {
                if(this.error(err)){resolve(null); return;}

                let dbo = db.db(name);
                let id = random(random_length);

                while(await dbo.collection(collection).countDocuments({[key]: id}) != 0){
                    id = random(random_length);
                    console.log("duplicate id :(");
                }

                data[key] = id;
                dbo.collection(collection).insertOne(data, (err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}

                    let output = this.parse_results(res.result);
                    output[key] = id;
                    resolve(output);
                });
            });
        });
    }

    edit(collection, target, set, push, unset){
        return new Promise((resolve) => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;}

                let obj = {}
                if(set != null){obj.$set = set;}
                if(push != null){obj.$push = push;}
                if(unset != null){obj.$unset = unset;}

                db.db(name).collection(collection).updateOne(target, obj, (err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(this.parse_results(res.result));
                });
            });
        });
    }

    remove(collection, query){
        return new Promise((resolve) => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;}
                db.db(name).collection(collection).deleteOne(query, (err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(this.parse_results(res.result));
                });
            });
        });
    }

    count(collection, query){
        return new Promise(resolve => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;}
                db.db(name).collection(collection).countDocuments(query, (err, n) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(n);
                });
            });
        });
    }

    drop(collection){
        return new Promise((resolve) => {
            mongodb.connect(url, options, (err, db) => {
                if(this.error(err)){resolve(null); return;}
                db.db(name).collection(collection).deleteMany({}, (err, res) => {
                    db.close();
                    if(this.error(err)){resolve(null); return;}
                    resolve(this.parse_results(res.result));
                });
            });
        });
    }

    error(e){
        try {
            if(e){throw e;}
        }catch(err){
            console.log(err);
            return true;
        }
        return false;
    }

    parse_results(res){
        if(res.ok == 0){return {status: false, error: "db error"};}
        if(res.n >= 1){
            if(res.nModified != null){
                if(res.nModified == 0){
                    return {status: true, msg: "records up to date, no changes"};
                }else {
                    return {status: true};
                }
            }else {
                return {status: true};
            }
        }else {
            return {status: false, error: "no target found"};
        }
    }

    remove_keys(keys, target){
        for(let key of keys){
            if(target[key] !== undefined){
                delete target[key];
            }
        }
        return target;
    }

    mongodb_id(id){
        return new mongodb.ObjectID(id);
    }
}

module.exports = Database;
