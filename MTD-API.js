'use strict';

const http = require('http');
let proxiedHttp = require('findhit-proxywrap').proxy(http);
const qs = require('querystring');
const parse_url = require('url');
const Library = require('./lib.js');
const DB = require('./db.js');

let sessions = [];

const storeSessions = () => {
  const db = new DB();
  db.drop('sessions'); //remove all sessions

  sessions.forEach((item, index) => {
    db.insert_with_unique_id('sessions', item, this.random_id, 40, 'id');
  });
}

const removeVerifications = setInterval(async () => {
  const db = new DB();

  let arr = await db.find_all('verification');
  const time  = new Date().getTime();
  let remove = [];

  arr.forEach((item, index) => {
    if(item.expire < time) {
      remove.push({_id: item._id});
    }
  });

  if(remove.length > 0) {
    remove.forEach((item) => {
      db.remove('verification', item);
    });
  }
}, 86400000); //every day

const removeSessions = setInterval(async () => {
  const time  = new Date().getTime();

  sessions.forEach((item, index, arr) => {
    if(item.expire < time) {
      arr.splice(index, 1);
    }
  });
}, 86400000); //every day

const storeSessionsInterval = setInterval(async () => {
  await storeSessions();
}, 1800000); //every thirty minutes

const server = proxiedHttp.createServer((req, res) => {
    console.log(req.headers.origin);

    const input = url(req.url);

    if(req.method == 'OPTIONS'){
        new Library(req, res).render({});
        return;
    }

    if(input.url != null){
        new Library(req, res).render({}, 301, {Location: input.url});
        return;
    }
    try {
        let target;
        if(input.path.length != 0){
            target = require('./src/'+input.path[0]+'.js');
        }else {
            target = require('./src/index.js');
        }
        const obj = new target(req, res, input.query);

        if(input.path.length > 1){
            if(input.path.length == 2 && typeof obj['_'+input.path[1]] === 'function'){
                obj['_'+input.path[1]].call(obj);
            }else {throw "404, method missing";}
        }else {
            obj.index();
        }
    }catch(e){
        new Library(req, res).render({status: false, error: e}, 404);
    }
});

const url = (request_url) => {
    const input = parse_url.parse(request_url, true);

    let path = input.pathname.replace(/%20|\+/g, '');
    path = path.split('/');
    path = path.filter(item => item.match(/[^A-Za-z0-9_.-]|^$/) == null);

    let correct_url = '/'+path.join('/');
    if(path.length > 0){correct_url += '/';};

    if(correct_url != input.pathname){
        let q = qs.stringify(input.query);
        if(q != ''){correct_url += '?'+qs.stringify(input.query);}
    }else {
        correct_url = null;
    }

    return {
        path: path,
        query: input.query,
        url: correct_url
    };
};

server.listen(8000);
