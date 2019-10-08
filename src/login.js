'use strict';

const Library = require('../lib.js');
const isEmail = require('is-email-node');
const nodemailer = require("nodemailer");
const salt = 'nm/&(xx2d329738d2b36#';

class Login extends Library {
    constructor(req, res, query){
        super(req, res);
        this.query = query;
    }

    index(){
        if(this.method == 'POST'){this.check(); return;}
        if(this.method == 'PATCH'){this.newPassword(); return;}
        this.render({login: false}, 404);
    }

    async check(){
        const time  = new Date().getTime();
        const input = await this.post();

        if(input.username == null|| input.password == null) {
          this.render({login: false, error: "empty fields.."});
          return;
        }

        let user = {};
        let hash;

        if(isEmail(input.username)) {
          user = await this.db.find('users', {email: input.username.toLowerCase()}, {username: 1, password: 1, email: 1, active: 1});
        }

        else {
          user = await this.db.find('users', {username: input.username}, {username: 1, password: 1, email: 1, active: 1});
        }

        if(user == null) {
          this.render({login: false, activated: true, error: "wrong password or username"}, 401);
          return;
        }

        hash = this.hash(input.password, (user.username + salt));

        if(user.password != hash) {
          this.render({login: false, activated: true, error: "wrong password or username"}, 401);
          return;
        }

        if(user.active == false) {
          const hash2 = this.hash(user.username, salt);
          //------- MAIL -----------

          var transporter = nodemailer.createTransport({
            host: 'mailout.telia.com',
            port: 465,
            secure: true, // upgrade later with STARTTLS
            auth: {
              user: "a00519341",
              pass: "19abb84a"
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
                  +    '<a style="text-decoration: none;" href="http://eyeleague.se/verify/' + user.username + '-' + hash2 + '">'
                  +      '<div style="margin: auto; padding: 8px; background-color: #557a95; border: 1px solid #7395ae; border-radius: 2px; width: 175px; text-align: center;">'
                  +        '<h2 style="color: #fff; margin: 0; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.8px;">Verifiera</h2>'
                  +      '</div>'
                  +    '</a>'
                  +  '</div>'
                  + '</div>',
          };

          transporter.sendMail(mailOptions, function (err, info) {
            if(err)
             console.log(err)
            else
             // console.log(info);
             console.log("Mail sent to " + user.email);
          });

          //----------------------------
          this.render({login: true, activated: false, error: "User not actiated"}, 403);
          return;
        }

        const cookie = this.parse_cookie();
        if(cookie != null && cookie.session != null){
          this.db.remove('sessions', {id: cookie.session});
        }

        const session = {
            username: user.username,
            update: time,
            expire: time + (7200*1000),
            ip: this.req.connection.remoteAddress,
            useragent: this.req.headers['user-agent']
        };

        user.latestlogin = time;

        await this.db.edit('users', {username: user.username}, user);
        const data = await this.db.insert_with_unique_id('sessions', session, this.random_id, 40, 'id');
        this.render({login: true, activated: true}, 200, {'Set-Cookie':'session=' + data.id + '; path=/'});
    }

    async newPassword() {
      if(this.isset(this.query, ["email"])) {
        const email = this.query.email;
        const user = await this.db.find('users', {email: email}, {username: 1, password: 1});

        if(user == null) {
          this.render({status: false, email: false, error: "No account connected with email address."}, 404);
        }

        const hash = user.password;

        //------- MAIL -----------

        var transporter = nodemailer.createTransport({
          host: 'mailout.telia.com',
          port: 465,
          secure: true, // upgrade later with STARTTLS
          auth: {
            user: "a00519341",
            pass: "19abb84a"
          }
        });

        const mailOptions = {
          from: '"eyeLeague" <no-reply@eyeleague.se>', // sender address
          to: email, // list of receivers
          subject: 'Ändra lösenord', // Subject line
          html: '<div>'
                +  '<img style="margin: auto; max-width: 150px; background-color: #557a95; padding: 10px;" src="http://eyeleague.se/static/media/EmaileyeLeague.png" alt="logo">'
                +  '<div style="border: 1px solid #ccc; border-radius: 2px; background-color: #fff; padding: 15px;">'
                +    '<p style="margin-left: 20px; margin-right: 20px; font-family: Arial, Helvetica, sans-serif; line-height: 25px; color: gray; margin-bottom: 35px;">'
                +      'Hej ' + user.username + '!<br><br>Tryck på knappen nedan för att ändra ditt lösenord.'
                +    '</p>'
                +    '<a style="text-decoration: none;" href="http://eyeleague.se/login/' + hash + '">'
                +      '<div style="margin: auto; padding: 8px; background-color: #557a95; border: 1px solid #7395ae; border-radius: 2px; width: 175px; text-align: center;">'
                +        '<h2 style="color: #fff; margin: 0; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.8px;">Ändra lösenord</h2>'
                +      '</div>'
                +    '</a>'
                +  '</div>'
                + '</div>',
        };

        transporter.sendMail(mailOptions, function (err, info) {
          if(err)
           console.log(err)
          else
           // console.log(info);
           console.log(email + " got an email to change password");
        });

        //----------------------------

        this.render({status: true, email: true}, 200);
      }

      else if(this.isset(this.query, ["hash"])) {
        const user = await this.db.find('users', {password: this.query.hash}, {username: 1});

        if(user == null) {
          this.render({status: false, password: false, error: "No account found."}, 404);
        }
        user.password = true;
        this.render(user, 200);
      }

      else if(this.isset(this.query, ["username", "nPass", "oPassHash"])) {
        const user = await this.db.find('users', {username: this.query.username}, {password: 1, username: 1});

        if(user == null) {
          this.render({status: false, error: "Couldn't update password"}, 404);
        }

        if(this.query.oPassHash != user.password) {
          this.render({status: false, error: "Couldn't update password"}, 404);
        }

        const data = {
            password: this.hash(this.query.nPass, (user.username + salt))
        };

        await this.db.edit('users', {username: this.query.username}, data);
        this.render({status: true}, 200);
      }

      else {
        this.render({status: false, error: "empty fields"}, 404); return;
      }
    }
}

module.exports = Login;
