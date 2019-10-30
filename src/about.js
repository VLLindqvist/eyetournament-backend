'use strict';

const Library = require('../lib.js');
const Content = require('../functionClasses/content.js');

class About extends Library {
    constructor(req, res, query){
      super(req, res);
      this.query = query;
    }

    async index(){
      if(this.method == 'GET'){this.self(); return;}
      if(this.method == 'POST'){this.newPost(); return;}
      if(this.method == 'PATCH'){this.update(); return;}
      if(this.method == 'DELETE'){this.update(); return;}
      this.render({status: false}, 404);
    }

    async self(){
      let data = await this.db.find('main', {type: "about"}, {lang: 1, _id: 0});
      const lang = await this.getLang();
      this.render(data.lang[lang], 200); return;
    }

    async newPost() {
      const user = await this.authenticate();
      if(!user){this.render({status: false, error: "unauthorized"}, 401); return;}

      if(user.group !== "Admin") { this.render({status: false, error: "cant touch this"}, 401); return; }

      const input = await this.post();
      if(this.isset(input, ["html", "lang"])) {
        let data = await this.db.find('main', {type: "about"}, {about: 1, _id: 0});
        const content = await new Content("about", data, input.lang, input.html);
        const newContent = await content.post_about();

        this.render(await this.db.edit('main', {type: "about"}, newContent), 200); return;
      }

      if(this.isset(input, ["title", "lead", "body", "lang"])) {
        let data = await this.db.find('main', {type: "about"}, {about: 1, _id: 0});
        const content = await new Content("about", data, input.lang, null, input.title, input.lead, input.body);
        const newContent = await content.post_about();

        this.render(await this.db.edit('main', {type: "about"}, newContent), 200); return;
      }

      this.render({status: false, error: "empty fields"}, 404); return;
    }
}

module.exports = About;
