// tar bort gammla sessions från 'sessions'

'use strict';
  
const name = 'sessions';
const db = require('../db.js');
const dbo = new db();
let i = 0;

dbo.find_all(name).then(async (res) => {
    const now = Date.now();;
    for(const item of res){
        if(now > item.expire){
            await dbo.remove(name, {id: item.id});
            i++;
        }
    }
    console.log("removed " + i + " sessions");
});