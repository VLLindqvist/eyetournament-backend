'use strict';

const Library = require('../lib.js');
const salt = 'nm/&(xx2d329738d2b36#';

class Lang extends Library {
  constructor(req, res, query){
    super(req, res);
    this.query = query;
  }

  async index(){
    if(this.method == 'GET'){this.self(); return;}
    if(this.method == 'PATCH'){this.langChoose(); return;}
    // if(this.method == 'DELETE'){this.remove(session); return;}
    this.render({status: false}, 404);
  }

  async self(){
    const data = await this.db.find('sessions', {ip: this.req.connection.remoteAddress}, {lang: 1, _id: 0});

    if(data !== null) {
      this.render(data, 200); return;
    }

    else {
      this.setCookie("sv");
    }
  }

  async langChoose() {
    //store language cookie
    if(this.isset(this.query, ["lang"])) {
      this.setCookie(this.query.lang);
    }

    else {
      this.render({status: false, error: "empty fields"}, 404); return;
    }
  }

  async setCookie(lang) {
    const time  = new Date().getTime();
    const cookie = this.parse_cookie();
    if(cookie != null && cookie.session != null){
      this.db.remove('sessions', {id: cookie.session});
    }

    const hashing = this.hash(this.random_id(15), salt);

    if(lang === "sv" || lang === "en") {
      const session = {
          lang: lang,
          token: hashing,
          ip: this.req.connection.remoteAddress,
          useragent: this.req.headers['user-agent']
      };

      // const data = await this.db.insert_with_unique_id('sessions', session, this.random_id, 40, 'id');
      sessions.push(session);
      storeSessions();
      this.render({lang: lang, token: session.token}, 200);//, {'Set-Cookie':'session=' + data.id + '; path=/'});
    }
  }
}

module.exports = Lang;
