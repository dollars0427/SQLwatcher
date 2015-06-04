//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var moment = require('moment-timezone');
var fs = require('fs');

/**
 * Check time format "hh:mm"
 * @param{String} time
 * @return{Boolean} true
 * */

function checkTimeFormat(time){

    //If the time format is wrong, throw error.

    var checking = time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

    if(!checking){

        return false;
    }

    return true;
}

/**
 * Convert time to ms
 * @param{String} time
 * @return{Number} totalMs
 */

function getTimeMs(time){

    //Call checkTimeFormat to make sure the format is right.

    var format = checkTimeFormat(time);

    if(format == true){

    //Split the time and convert it to ms

    var splitedTime = time.split(':');

    var hour = splitedTime[0];

    var minute = splitedTime[1];

    var hourMs = hour * 60 * 60 * 1000;

    var minMs = minute * 60 *1000;

    var totalMs = hourMs + minMs;

    return totalMs;

    }

    return;
}

/**
 * Get the date of today with init time (00:00:00)
 * @param{string} timeZone
 * @return {Object(Date)} newCurrentDate
 */

function getInitTime(timeZone){

    if(timeZone == '' || timeZone == null){

        //Get the date of today, and set the time to 00:00:00

        var currentDate = new Date();

        currentDate.setHours(0);
        currentDate.setMinutes(0);
        currentDate.setSeconds(0);
        currentDate.setMilliseconds(0);

        return currentDate;

    }

    //If user setted timezone, using moment to convert the date with timezone

    var currentDate = new Date();

    var currentDateTz = new moment.tz(new Date(),timeZone);

    //Make sure the month and date of converted date is same of currentDate
    //After that, set it to 00:00:00

    currentDateTz.month(currentDate.getMonth());
    currentDateTz.date(currentDate.getDate());
    currentDateTz.hours(0);
    currentDateTz.minutes(0);
    currentDateTz.seconds(0);
    currentDateTz.milliseconds(0);

    //Get the ms and convert it to date object.

    var currentDateMs = currentDateTz.valueOf();

    var newCurrentDate = new Date(currentDateMs)

    return newCurrentDate;
}

/**
 * Check the success time is match keepAliveTime and lastAliveTime.
 * It will return the date which convent from totalKeepAliveTimeMs, 
 * it mean the script can send alive mail. Otherwise if it return null, 
 * it should not send any mail.
 *
 * @param {Number[]} keepAliveTimes (Timestamp, in ms)
 * @param {Number} lastAliveTime (Timestamp, in ms)
 * @param {Number} lastSuccessTime (Timestamp, in ms)
 * @param {String} timeZone
 * @return {Date} Date, null for mismatch 
 */

function checkKeepAliveTime(keepAliveTimes,lastAliveTime,lastSuccessTime,timeZone){

    //Get a initDate by calling the getInitTime function

    var currentDateInited = getInitTime(timeZone).getTime();

    //Convert lastSuccessTime,lastAliveTime(If it is not null) and keepAliveTime to ms.

    for(var i =0; i < keepAliveTimes.length; i++){
        var keepAliveTimeMs1 = keepAliveTimes[i];
        var keepAliveTimeMs2 = keepAliveTimes[i+1];

        //Convert the KeepAliveTime to be a timestamp of current Date.

        var totalKeepAliveTimeMs1 = keepAliveTimeMs1 + currentDateInited;
        var totalKeepAliveTimeMs2 = keepAliveTimeMs2 + currentDateInited;

        logger.debug('keepAliveTimes: ', new Date(totalKeepAliveTimeMs1));
        logger.debug('lastSuccessTime: ', new Date(lastSuccessTime));

        /*If the keepAliveTimeMs2 is NaN, 
         *lastSuccessTimeMs is bigger than totalKeepAliveTimeMs1,
         *return a date object of totalKeepAliveTime.
         */

        if(isNaN(keepAliveTimeMs2) && lastSuccessTime >= totalKeepAliveTimeMs1){

            if(lastAliveTime == null){

                return new Date(totalKeepAliveTimeMs1);
            }

            /*If the keepAliveTimeMs2 is NaN, 
            *lastSuccessTimeMs is bigger than totalKeepAliveTimeMs1,
            *but lastAliveTimeMs is bigger than totalKeepAliveTimeMs1,
            *it will return undefined.
            */

            if(lastAliveTime >= totalKeepAliveTimeMs1){ 

                return null;

            }

            return new Date(totalKeepAliveTimeMs1);
        }

        /*If the keepAliveTimeMs2 is not NaN, 
         *lastSuccessTimeMs is bigger than totalKeepAliveTimeMs1 
         *and smaller than totalKeepAliveTimeMs2, 
         *it will return a date object of totalKeepAliveTime.
         */

        if(lastSuccessTime >= totalKeepAliveTimeMs1 && lastSuccessTime < totalKeepAliveTimeMs2){
            if(lastAliveTime == null){

                return new Date(totalKeepAliveTimeMs1);

            }

            /*If the keepAliveTimeMs2 is not NaN, 
             *lastSuccessTimeMs is bigger than totalKeepAliveTimeMs1,
             *but lastAliveTimeMs is bigger than totalKeepAliveTimeMs1,
             *it will be skip.
             */

            if(lastAliveTime >= totalKeepAliveTimeMs1){ 

                continue;
            }

            return new Date(totalKeepAliveTimeMs1);
        }
    }
}

module.exports = {
    checkTimeFormat:checkTimeFormat,
    getTimeMs:getTimeMs,
    getInitTime:getInitTime,
    checkKeepAliveTime:checkKeepAliveTime
}
