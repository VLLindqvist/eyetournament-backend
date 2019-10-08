// ta bort denna fil!!

'use strict';

const Library = require('../lib.js');

class Test extends Library {
    constructor(req, res, query){
        super(req, res);   
        this.query = this.format(query);
    }

    index(){
        this.render({
            users: "/list",
            sessions: "/sessions",
            tournaments: "/t",
        });
    }

    async _list(){
        this.render(await this.db.find_all('users', this.query, null, null, 0, 0));
    }

    async _sessions(){
        this.render(await this.db.find_all('sessions', this.query));
    }

    async _t(){
        this.render(await this.db.find_all('tournaments', this.query));
    }
}

module.exports = Test;