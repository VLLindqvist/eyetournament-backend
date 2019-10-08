'use strict';

const Library = require('../lib.js');

class Logout extends Library {
    constructor(req, res){
        super(req, res);   
    }

    index(){
        if(this.req.method == 'POST'){
            const cookie = this.parse_cookie();
            if(cookie != null && cookie.session != null){
                this.db.remove('sessions', {id: cookie.session});
            }
            this.render({logout: true}, 200, {'Set-Cookie':'session=null; path=/'});
            return;
        }
        this.render({logout: false}, 404);
    }
}

module.exports = Logout;