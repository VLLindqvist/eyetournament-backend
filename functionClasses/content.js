'use strict';

class Content {
    constructor(page, content, lang, html, title = null, lead = null, body = null){
        this.page = page;
        this.content = content;
        this.lang = lang;
        this.html = html;
        this.title = title;
        this.lead = lead;
        this.body = body;
    }

    async post_about() {
      if(this.html !== null) {
        const newContent = {
          title: null,
          lead: null,
          body: null,
          html: this.html
        };

        this.render(await this.db.edit('main', {type: "about"}, null, { lang: data }));
      }

      if(this.title !== null && this.lead !== null && this.body !== null) {
        this.content.html = null;
      }

      return this.content;
    }

    async edit_about(which) {
      return this.content;
    }

    // async getContent() {
    //   return this.content;
    // }

}

module.exports = Content;
