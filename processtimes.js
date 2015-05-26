 //Require Module
 var log4js = require('log4js');
 var logger = log4js.getLogger('Logging');

 function checkTimeFormat(time){

     var checking = time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

     if(!checking){

         throw new Error('The format of time Is no correct!');
     }

     return true;
 }


 function getTimeMs(time){

     checkTimeFormat(time);

     var splitedTime = time.split(':');

     var hour = splitedTime[0];

     var minute = splitedTime[1];

     var hourMs = hour * 60 * 60 * 1000;

     var minMs = minute * 60 *1000;

     var totalMs = hourMs + minMs;

     return totalMs;

 }

module.exports = {

    checkTimeFormat:checkTimeFormat,
    getTimeMs:getTimeMs
}
