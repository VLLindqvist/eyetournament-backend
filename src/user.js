'use strict';

const Library = require('../lib.js');
const Verify = require('./verify.js');
const nodemailer = require("nodemailer");
const isEmail = require('is-email-node');
const salt = 'nm/&(xx2d329738d2b36#';

class User extends Library {
    constructor(req, res, query){
        super(req, res);
        this.query = this.format(query);
    }

    async index(){
        if(this.method == 'GET'){this.self(); return;}
        if(this.method == 'POST'){this.add(); return;}
        if(this.method == 'PATCH'){this.update(); return;}
        if(this.method == 'DELETE'){this.remove(); return;}
        this.render({status: false}, 404);
    }

    async self(){
      const user = await this.authenticate();
      if(!user){this.render({}, 401); return;}
        this.render({
            username: user.username,
            group: user.group
        });
    }

    async add() {
        const input = await this.post();
        if(!this.isset(input, ["username", "email", "password"])){
            this.render({status:false, error: "fields missing"}, 404); return;
        }

        const email = input.email.trim().toLowerCase();
        const username = input.username.trim();
        if(username.match(/[^a-zA-Z0-9-]|-{2,}/)){
            this.render({user: false, email: true, pass: true, error: "Illegal characters in username."}); return;
        }

        if(!isEmail(email)) {
          this.render({user: true, email: false, pass: true, error: "Invalid email."}); return;
        }

        if((await this.db.count('users', {username: username})) != 0){
            this.render({user: false, email: true, pass: true, error: "The username is taken."}); return;
        }

        if((await this.db.count('users', {email: email})) != 0){
            this.render({user: true, email: false, pass: true, error: "There is already an account with that email address."}); return;
        }

        const howManyAccounts = await this.db.find_all('users');

        if(howManyAccounts.length > 1000) {
          this.render({user: false, email: true, pass: true, error: "Too many users, server can't take it."}); return;
        }

        const hash = this.hash(username, salt);
        const time  = new Date().getTime();

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
          subject: 'Kontoverifiering', // Subject line
          html: '<div>'
                +  '<img style="margin: auto; max-width: 150px; background-color: #557a95; padding: 10px;" src="http://eyeleague.se/static/media/EmaileyeLeague.png" alt="logo">'
                +  '<div style="border: 1px solid #ccc; border-radius: 2px; background-color: #fff; padding: 15px;">'
                +    '<p style="margin-left: 20px; margin-right: 20px; font-family: Arial, Helvetica, sans-serif; line-height: 25px; color: gray; margin-bottom: 35px;">'
                +      'Hej ' + username + '!<br><br>Tack för att du skapade ditt eyeLeague-konto. Tryck på knappen nedan för att bekräfta din e-postadress och slutföra regristreringen.'
                +    ' Länken är giltig i 24 timmar.</p>'
                +    '<a style="text-decoration: none;" href="http://eyeleague.se/verify/' + username + '-' + hash + '">'
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
           console.log("Mail sent to " + email);
        });

        //----------------------------

        const verification = {
          username: username,
          hash: hash,
          expire: time + (3600*1000)
        };

        const data = {
            username: username,
            email: email,
            password: this.hash(input.password, (username+salt)),
            active: false,
            group: 1, // default!
            latestlogin: time
        };

        await this.db.insert('verification', verification);
        await this.db.insert('users', data);
        this.render({user: true, email: true, pass: true}, 200);
    }

    async update(){
        const user = await this.authenticate();
        if(!user){this.render({}, 401); return;}
        const allowed = ["email", "data"];
        let changes = {};
        let password_required = true;

        if(this.query.username != null){
            if(!(user.group == 0 || user.group == 1)){this.render({}, 401); return;}

            const target = await this.db.find('users', {username: this.query.username});
            if(target == null || (user.group == 1 && (target.group == 1 || target.group == 0))){
                this.render({status: false, error: "my error"}); return;
            }

            user = target;
            password_required = false;
        }

        if(this.query.password != null){
            if(password_required){
                if(this.query.current_password != null){
                    const current = this.hash(this.query.current_password, (user.username+salt));
                    changes.password = this.hash(this.query.password, (user.username+salt));
                    if(current != user.password){
                        this.render ({error: "passwords did not match"}); return;
                    }
                }else {
                    this.render({status:false, error: "current_password missing"}); return;
                }
            }else {
                changes.password = this.hash(this.query.password, (user.username+salt));
            }
        }

        if(this.query.group != null){
            if(!password_required && (this.query.group == 1 || this.query.group == 2)){
                changes.group = this.query.group;
            }else {
                this.render({status: false, error: "nah.."}); return;
            }
        }

        for(const item of allowed){
            if(this.query[item] != null){
                changes[item] = this.query[item];
            }
        }

        if(Object.keys(changes).length === 0){
            this.render({status: false, error: "nothing could be changed(?)"}); return;
        }
        this.render(await this.db.edit('users', {username: user.username}, changes));
    }

    async remove(){
      const user = await this.authenticate();
      if(!user){this.render({}, 401); return;}
        //if(!(user.group == 0 || user.group == 1)){this.render({}, 401); return;}

        if(this.query.username == null){
            this.render({status: false, error: "empty fields"}); return;
        }

        if(this.query.username == user.username){
            this.render({status: false, error: "you can't remove yourself.."}); return;
        }

        const target = await this.db.find('users', {username: this.query.username});
        if(target == null){
            this.render({status: false, error: "user not found"}); return;
        }

        if(target.group == 0 || (user.group == 1 && target.group == 1)){
            this.render({status: false, error: "nej."}, 401); return;
        }

        this.render(await this.db.remove('users', {username: this.query.username}));
    }
};

module.exports = User;
