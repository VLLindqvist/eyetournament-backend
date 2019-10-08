'use strict';

const DB = require('../db.js');
const fetch = require('node-fetch');

let db = new DB();
let data;
let teams;
let index = 0;

const initTeams = [
  {name: "Laget finns inte i listan", pic: null},
  {name: "Malmö FF", pic: "https://upload.wikimedia.org/wikipedia/commons/3/33/Malm%C3%B6_FF_Logo.png"},
  {name: "AIK", pic: "https://upload.wikimedia.org/wikipedia/en/2/20/Allm%C3%A4nna_Idrottsklubben_Ishockey_Logo.svg"},
  {name: "IFK Norrköping", pic: "https://www.tvmatchen.nu/media/teams/904px-IFK_Norrkoeping_Logo.png?580700"},
  {name: "BK Häcken", pic: "https://upload.wikimedia.org/wikipedia/de/c/cf/BK_H%C3%A4cken.svg"},
  {name: "Hammarby IF", pic: "https://upload.wikimedia.org/wikipedia/en/a/a9/Hammarby_IF.png"},
  {name: "Djurgårdens IF", pic: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Djurg%C3%A5rdens_IF_sk%C3%B6ld.png"},
  {name: "Östersunds FK", pic: "https://upload.wikimedia.org/wikipedia/en/8/85/%C3%96stersunds_FK.pnga"},
  {name: "IF Elfsborg", pic: "https://upload.wikimedia.org/wikipedia/en/3/37/IF_Elfsborg_logo.svg"},
  {name: "GIF Sundsvall", pic: "https://upload.wikimedia.org/wikipedia/en/6/6e/Gif_sundsvall.png"},
  {name: "Kalmar FF", pic: "https://upload.wikimedia.org/wikipedia/en/1/12/Kalmar_FF.png"},
  {name: "IK Sirius", pic: "https://upload.wikimedia.org/wikipedia/en/9/9f/IK_Sirius.png"},
  {name: "IFK Göteborg", pic: "https://upload.wikimedia.org/wikipedia/en/f/fb/IFK_G%C3%B6teborg.png"},
  {name: "Örebro SK", pic: "https://upload.wikimedia.org/wikipedia/en/c/c4/Orebro.png"},
  {name: "Trelleborgs FF", pic: "https://upload.wikimedia.org/wikipedia/en/0/05/Trelleborgs_ff.png"},
  {name: "IF Brommapojkarna", pic: "https://upload.wikimedia.org/wikipedia/en/2/20/IF_Brommapojkarna_logo.svg"},
  {name: "Dalkurd FF", pic: "https://upload.wikimedia.org/wikipedia/en/5/57/Dalkurd_FF_logo.gif"},
];

let promise1 = new Promise(async (resolve, reject) => {
  await fetch("https://api.football-data.org/v2/competitions", {
    method: "GET",
    headers: {'X-Auth-Token': 'f8a98cd8401f4504a0599ed5c14dc12f'}
  }).then(response => {
    if(!response.ok){console.log(response); throw Error(response.errorCode);}
    return response.json()
  }).then(response => {
    resolve('Data recieved!');
    data = response.competitions.map((item, i) => {
      if(item.plan == "TIER_ONE") {
        return item.id;
      }
    });
    data = data.filter(Number);
  }).catch((error) => {
    reject('Data not recieved!');
  	console.log(error);
  });

  await db.edit('teams', {name: "teams"}, null, {teamsArr: {$each: initTeams}}).then((res) => {
    console.log(res);
  });
});

let promise2 = new Promise((resolve, reject) => {
  promise1.then((msg) => {
    let interval = setInterval(async () => {
      await fetch("https://api.football-data.org/v2/competitions/" + data[index] + "/teams/", {
        method: "GET",
        headers: {'X-Auth-Token': 'f8a98cd8401f4504a0599ed5c14dc12f'}
      }).then(response => {
        if(!response.ok){console.log(response); throw Error(response.errorCode);}
        return response.json();
      }).then(response => {
        teams = response.teams.map((item, i) => {
          return {name: item.name, pic: item.crestUrl};
        });
        return teams;
      }).then((teams) => {
        for(let i = 0; i < teams.length - 1; ++i) {
          for(let j = 0; j < initTeams.length - 1; ++j) {
            if(teams[i].name == initTeams[j].name) {
              console.log("duplicate");
              teams.splice(i, 1);
            }
          }
        }
        return teams;
      }).then(async (teams) => {
        const oldTeams = await db.find('teams', {name: "teams"});
        if(oldTeams.teamsArr.length > 1) {
          for(let j = 0; j < oldTeams.teamsArr.length - 1; ++j) {
            for(let i = 0; i < teams.length - 1; ++i) {
              if(teams[i].name == oldTeams.teamsArr[j].name) {
                console.log("duplicate");
                teams.splice(i, 1);
              }
            }
          }
        }
      }).then(() => {
        db.edit('teams', {name: "teams"}, null, {teamsArr: {$each: teams}}).then((res) => {
          console.log(res);
        });
      }).catch((error) => {
        reject('There was an error!');
      	console.log(error);
      });

      if(index == data.length-2) {
        resolve('Done!');
        clearInterval(interval);
      }
      else {
        ++index;
      }
    }, 6000);
  }).catch((msg) => {
    console.log(msg);
  });
});

promise2.then((msg) => {
  console.log(msg);
}).catch((msg) => {
  console.log(msg);
});
