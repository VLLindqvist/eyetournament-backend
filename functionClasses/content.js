'use strict';

class Content {
    constructor(page, content, lang, newContent){
        this.page = page;
        this.content = content;
        this.lang = lang;
        this.newContent = newContent;

        this["edit_" + page]();
    }

    edit_about() {

    }

    async getContent() {
      return this.content;
    }

}

module.exports = Content;
