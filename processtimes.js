//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var moment = require('moment-timezone');

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

function getInitTime(timeZoneOffset){

    if(timeZoneOffset == ''){

        var currentDate = new Date();

        currentDate.setHours(0);
        currentDate.setMinutes(0);
        currentDate.setSeconds(0);
        currentDate.setMilliseconds(0);

        return currentDate;

    }

    var currentDate = new moment.tz(new Date(),timeZoneOffset);

    currentDate.hours(0);
    currentDate.minutes(0);
    currentDate.seconds(0);
    currentDate.milliseconds(0);

    return currentDate;
}

function checkTime(keepAliveTimes,lastSuccessTime,lastAliveTime,timeZoneOffset){

    for(var i =0; i < keepAliveTimes.length; i++){

        if(timeZoneOffset == ''){

            var currentDateInited = getInitTime(timeZoneOffset);

            var lastSuccessTimeMs = lastSuccessTime.getTime();
            var keepAliveTimesMs1 = keepAliveTimes[i];
            var keepAliveTimesMs2 = keepAliveTimes[i +1];

 
            var totalKeepAliveTimesMs1 = keepAliveTimesMs1 + currentDateInited.getTime();
            var totalKeepAliveTimesMs2 = keepAliveTimesMs2 + currentDateInited.getTime();

            var keepAliveTimesDate = new Date(totalKeepAliveTimesMs1);
            var keepAliveTimesMonth = keepAliveTimesDate.getMonth();
            var keepAliveTimesDay = keepAliveTimesDate.getDate();
            var keepAliveTimesYear = keepAliveTimesDate.getYear();

            if(lastAliveTime !== null){

            var lastAliveTimeYear = lastAliveTime.getFullYear();
            var lastAliveTimeMonth = lastAliveTime.getMonth();
            var lastAliveTimeDate = lastAliveTime.getDate();
            var lastAliveTimeMs = lastAliveTime.getTime();

            }
        }

        else{

            var currentDateInited = getInitTime(timeZoneOffset);
            var lastSuccessTimeMs = lastSuccessTime.valueOf();
            var keepAliveTimesMs1 = keepAliveTimes[i];
            var keepAliveTimesMs2 = keepAliveTimes[i +1];

            var totalKeepAliveTimesMs1 = keepAliveTimesMs1 + currentDateInited.valueOf();
            var totalKeepAliveTimesMs2 = keepAliveTimesMs2 + currentDateInited.valueOf();

            var keepAliveTimesDate = moment.tz(totalKeepAliveTimesMs1,timeZoneOffset);
            var keepAliveTimesMonth = keepAliveTimesDate.get('month');

            var keepAliveTimesDate = keepAliveTimesDate.get('date');
            var keepAliveTimesYear = keepAliveTimesDate.get('year');

            if(lastAliveTime !== null){

            var lastAliveTimeYear = lastAliveTime.get('year');
            var lastAliveTimeMonth = lastAliveTime.get('month');
            var lastAliveTimeDate = lastAliveTime.get('date');
            var lastAliveTimeMs = lastAliveTime.valueOf();

            }
        }

        if(!keepAliveTimesMs2 && lastSuccessTimeMs >= totalKeepAliveTimesMs1){

            if(lastAliveTime === null){

                return true;
            }


            if(lastAliveTimeMonth == keepAliveTimesMonth && 
               lastAliveTimeDate == keepAliveTimesDate && 
                   lastAliveTimeYear == keepAliveTimesYear  &&
                       lastAliveTimeMs >= totalKeepAliveTimesMs1){

                return false;

            }

            return true;
        }

        if(lastSuccessTimeMs >= totalKeepAliveTimesMs1 && lastSuccessTimeMs < totalKeepAliveTimesMs2){

            if(lastAliveTime === null){

                return true;
            }

            if(lastAliveTimeMonth == keepAliveTimesMonth && 
               lastAliveTimeDate == keepAliveTimesDate && 
                   lastAliveTimeYear == keepAliveTimesYear  &&
                       lastAliveTimeMs >= totalKeepAliveTimesMs1 &&
                           lastAliveTimeMs < totalKeepAliveTimesMs2){

                return true;

            }

            return false;
        }
    }
}

module.exports = {
    checkTimeFormat:checkTimeFormat,
    getTimeMs:getTimeMs,
    getInitTime:getInitTime,
    checkTime:checkTime
}
