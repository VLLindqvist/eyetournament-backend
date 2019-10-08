'use strict';

const Library = require('../lib.js');
const nodemailer = require("nodemailer");
const salt = 'nm/&(xx2d329738d2b36#';

class Verify extends Library {
    constructor(req, res, query){
        super(req, res);
        this.query = this.format(query);
    }

    async index(){
        if(this.method == 'POST'){this.verifier(); return;}
        if(this.method == 'PATCH'){this.sendNewEmail(); return;}
        if(this.method == 'DELETE'){this.remove(); return;}
        this.render({status: false}, 404);
    }

    async verifier(){
        const input = await this.post();
        const time  = new Date().getTime();
        if(!this.isset(input, ["username", "hash"])) {
            this.render({status:false, error: "fields missing"}, 404); return;
        }

        const verif = await this.db.find('verification', {username: input.username}, {username: 1, hash: 1, expire: 1});
        let user = await this.db.find('users', {username: input.username}, {username: 1, active: 1, email: 1});

        if(user == null) {
          this.render({status:false, error: "Cannot verify!"}, 406); return;
        }

        if(verif == null) {
          await this.emailSender(user.username, user.email);
          this.render({status:false, error: "Verification code missing. Sending one."}, 405); return;
        }

        if(verif.expire < time) {
          await this.db.remove('verification', {_id: verif._id});
          await this.emailSender(user.username, user.email);
          this.render({status:false, error: "Verification code expired. Sending a new one."}, 405); return;
        }

        if(input.username == user.username && input.hash == verif.hash) {
          user.active = true;
          await this.db.remove('verification', {_id: verif._id});
        }

        this.render(await this.db.edit('users', {username: user.username}, user));
    }

    async sendNewEmail() {
      const input = await this.post();
      if(!this.isset(input, ["username", "email", "password"])){
          this.render({status:false, error: "fields missing"}, 404); return;
      }

      const username = input.username.trim();
      const email = input.username.trim();

      await this.emailSender(username, email);
    }

    async emailSender(username, email) {
      const hash = this.hash(username, salt);

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

      const time  = new Date().getTime();

      const verification = {
        username: username,
        hash: hash,
        expire: time + (3600*1000)
      };

      await this.db.insert('verification', verification);
      return;
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

module.exports = Verify;
