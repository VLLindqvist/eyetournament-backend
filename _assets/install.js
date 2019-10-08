// lägger till första användaren
// username: admin
// password: 123

'use strict';

const admin = {
    username: "admin",
    password: "754d94af8cad1470a457efc21f1a866945fa93e8ab32c4f54156de19d64aaf70", //123
    email: "admin@localhost",
    group: 0
}
    
const db = require('../db.js');

new db().insert('users', admin).then((res) => {
    console.log(res);
});
