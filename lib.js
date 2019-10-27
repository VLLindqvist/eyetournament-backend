'use strict';

const DB = require('./db.js');
const qs = require('querystring');
const fs = require('fs');
const crypto = require('crypto');
this.sessions = [];

class Library {
    constructor(req, res){
        this.db = new DB();
        this.req = req;
        this.res = res;
        this.method = req.method;
    }

    // check login status
    // returns user+session if auth ok, returns false if auth failed
    authenticate(){
        return new Promise(async (resolve) => {
            const cookie = this.parse_cookie();
            if(cookie == undefined || cookie.session == undefined){
                resolve(false); return;
            }

            //const session = await this.db.find('sessions', {id: cookie.session});
            let session = sessions.find(obj => obj.token === cookie.token);

            if(session == null) {
                console.log("error: session not found");
                resolve(false); return;
            }

            // let user = await this.db.find('users', {username: session.username});
            // if(user == null){
            //     // this.db.remove('sessions', {id: cookie.session});
            //     resolve(false);
            //     sessions.forEach((item, index, arr) => {
            //       if(item.token === session.token) {
            //         arr.splice(index, 1);
            //       }
            //     });
            //     resolve(false); return;
            // }

            const time  = new Date().getTime();
            const expire = time + (3600*1000);

            if(session.useragent != this.req.headers['user-agent'] || session.ip != this.req.connection.remoteAddress || session.expire < time){
                console.log("error: timeout or ip/user-agent do not match session");
                resolve(false);
                sessions.forEach((item, index, arr) => {
                  if(item.token === session.token) {
                    arr.splice(index, 1);
                  }
                });
                // this.db.remove('sessions', {id: cookie.session});
                return;
            }

            // user.session = session;
            resolve(session);
            // this.db.edit('sessions', {id: cookie.session}, {update: time, expire: expire});
            session.update = time;
            session.expire = expire;
            sessions.forEach((item, index, arr) => {
              if(item.token === session.token) {
                arr.splice(index, 1);
              }
            });
            sessions.push(session);
        });
    }

    getLang(){
        return new Promise(async (resolve) => {
            const cookie = this.parse_cookie();
            if(cookie == undefined || cookie.lang == undefined){
                resolve(false); return;
            }

            // const session = await this.db.find('sessions', {id: cookie.session});
            let session = sessions.find(obj => obj.token === cookie.token);
            if(session == null) {
                console.log("error: language not found");
                resolve(false); return;
            }

            if(session.lang == undefined || session.lang == null) {
              session.lang = "sv";
            }

            resolve(session.lang);
            // this.db.edit('sessions', {id: cookie.session}, {update: time, expire: expire});
            sessions.forEach((item, index, arr) => {
              if(item.lang === session.lang) {
                arr.splice(index, 1);
              }
            });
            sessions.push(session);
        });
    }

    post(){
        return new Promise((resolve) => {
            let body = '';
            this.req.on('data', (chunk) => {
                body += chunk;
                if(body.length > 1e6){req.connection.destroy();}//1MB = max size
            });
            this.req.on('end', () => {
                resolve(qs.parse(body));
            });
        });
    }

    isset(input, list, empty){
        for(const item of list){
            if(input[item] == null){return false;}
        }
        return true;
    }

    is_number(arr){
        for(const item of arr){
            if(typeof item !== 'number'){return false;}
            if(!Number.isInteger(item)){return false;}
        }
        return true;
    }

    merge(query, template){
        for(let key in query){
            let target = template;
            let index = null;
            let sub_keys = key.split('.');

            if(sub_keys.length > 1){
                index = sub_keys[sub_keys.length-1];
                sub_keys.splice(-1, 1);
                for(let keys of sub_keys){target = target[keys];}
            }else {
                index = key;
            }

            if(!(target[index] === undefined || (target[index] !== null && typeof target[index] == 'object') || typeof query[key] == 'object')){
                target[index] = query[key];
            }
        }
        return template;
    }

    get_template(path){
        return new Promise((resolve) => {
            fs.readFile(path, (err, data) => {
                let obj = {};
                try{
                    if(err){throw err;}
                    obj = JSON.parse(data);
                }catch(e){console.log(e);}
                resolve(obj);
            });
        });
    }

    sanitize(text){
        if(typeof text == 'object'){text = JSON.stringify(text);}
        text = require('sanitize-html')(text, {allowedTags: [], allowedAttributes: []});
        return text.trim();
    }

    format(json){
        for(let key in json){
            json[key] = this.sanitize(json[key]);
            if(json[key] == 'true'){json[key] = true; continue;}
            if(json[key] == 'false'){json[key] = false; continue;}
            if(json[key] == 'null'){json[key] = null; continue;}

            //stora nummer!?
            try{
                let n = Number(json[key]);
                if(!Number.isNaN(n)){json[key] = n;}
            }catch(e){console.log(e);}
        }
        return json;
    }

    // only values, NOT nested objects
    // returns NULL if key do not exist
    extract_value(what, object){
        if(object[what] !== undefined && object[what] !== 'object'){
            let x = object[what];
            delete object[what];
            return x;
        }
        return null;
    }

    // lenght: lenght of string, empty => size between 5-15
    random_id(length){
        const data = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let id = "";
        let n = Math.floor(Math.random() * 5) + 15;
        if(Number.isInteger(length)){n = length;}

        for(let i = 0; i < n; i++){
            id += data.charAt(Math.floor(Math.random() * data.length));
        }
        return id;
    }

    parse_cookie(){
        if(this.req.headers['cookie'] === undefined){return undefined;}
        let item = this.req.headers['cookie'].split(';');

        let obj = {};
        for(let row of item){
            row = row.trim();
            obj = Object.assign(obj, qs.parse(row));
        }
        console.log(obj);
        return obj;
    }

    hash(string, salt){
        let hash = crypto.createHash('sha256');
        if(salt == null){
            hash.update(string);
        }else {
            hash.update(salt+string+salt);
        }
        return hash.digest('hex');
    }

    sendVerificationMail(user, hash) {
      //------- MAIL -----------

      var transporter = nodemailer.createTransport({
        host: 'smtp01.binero.se',
        port: 587,
        secure: true,
        auth: {
          user: "no-reply@medieteknikdagarna.se",
          pass: "inteMTD2019"
        }
      });

      const mailOptions = {
        from: '"eyeLeague" <no-reply@eyeleague.se>', // sender address
        to: user.email, // list of receivers
        subject: 'Kontoverifiering', // Subject line
        html: '<div>'
              +  '<img style="margin: auto; max-width: 150px; background-color: #557a95; padding: 10px;" src="http://eyeleague.se/static/media/EmaileyeLeague.png" alt="logo">'
              +  '<div style="border: 1px solid #ccc; border-radius: 2px; background-color: #fff; padding: 15px;">'
              +    '<p style="margin-left: 20px; margin-right: 20px; font-family: Arial, Helvetica, sans-serif; line-height: 25px; color: gray; margin-bottom: 35px;">'
              +      'Hej ' + user.username + '!<br><br>Tack för att du skapade ditt eyeLeague-konto. Tryck på knappen nedan för att bekräfta din e-postadress och slutföra regristreringen.'
              +    ' Länken är giltig i 24 timmar.</p>'
              +    '<a style="text-decoration: none;" href="http://eyeleague.se/verify/' + user.username + '-' + hash + '">'
              +      '<div style="margin: auto; padding: 8px; background-color: #557a95; border: 1px solid #7395ae; border-radius: 2px; width: 175px; text-align: center;">'
              +        '<h2 style="color: #fff; margin: 0; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.8px;">Verifiera</h2>'
              +      '</div>'
              +    '</a>'
              +  '</div>'
              + '</div>',
      };

      transporter.sendMail(mailOptions, function (err, info) {
        if(err) {
          console.log(err);
        }
        else {
         // console.log(info);
         console.log("Mail sent to " + user.email);
        }
      });
    }

    render(json, http_status_code, option){
        if(http_status_code == null){http_status_code = 200;}
        this.res.setHeader('Content-Type', 'application/json');

        // TILLFÄLLIG:
        //console.log("req origin: " + this.req.headers.origin + ", ip: " + this.req.connection.remoteAddress);

        if(this.req.headers.origin !== "http://vlq.se"){
            this.res.setHeader('Access-Control-Allow-Origin', this.req.headers.origin);
        }else {
            this.res.setHeader('Access-Control-Allow-Origin', 'http://vlq.se');
            console.log(" local conn");
        }

        //this.res.setHeader('Access-Control-Allow-Origin', "*");

        this.res.setHeader('Access-Control-Allow-Credentials','true');
        this.res.setHeader('Access-Control-Allow-Headers','Origin, Content-type, Accept');
        this.res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, HEAD, OPTIONS');
        this.res.writeHead(http_status_code, option);
        this.res.end(JSON.stringify(json, null, 0));
    }
}

module.exports = Library;
