'use strict';

const Library = require('../lib.js');

class Index extends Library {
  constructor(req, res, query){
    super(req, res);
    this.query = query;
  }

  async index() {
    //store language cookie
    if(this.query.lang != null) {
      const cookie = this.parse_cookie();
      if(cookie != null && cookie.session != null){
        this.db.remove('sessions', {id: cookie.session});
      }

      if(this.query.lang === "sv" || this.query.lang === "en") {
        const session = {
            lang: this.query.lang,
            update: time,
            ip: this.req.connection.remoteAddress,
            useragent: this.req.headers['user-agent']
        };

        user.latestlogin = time;

        const data = await this.db.insert_with_unique_id('sessions', session, this.random_id, 40, 'id');
        this.render({language: session.lang}, 200, {'Set-Cookie':'session=' + data.id + '; path=/'});
      }
    }

    this.render({status: false}, 404); return;
  }
}

module.exports = Index;
