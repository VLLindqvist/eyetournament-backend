// töm en collection

'use strict';
  
const name = 'tournaments';

const db = require('../db.js');
new db().drop(name).then((res) => {
    console.log(res);
});