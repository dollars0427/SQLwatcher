//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var moment = require('moment-timezone');
var fs = require('fs');

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

    if(timeZoneOffset == '' || timeZoneOffset == null){

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

    var currentDateMs = currentDate.valueOf();

    var newCurrentDate = new Date(currentDateMs)

    return newCurrentDate;
}

function checkTime(keepAliveTimes,lastAliveTime,lastSuccessTime,timeZoneOffset){

    for(var i =0; i < keepAliveTimes.length; i++){

        var currentDateInited = getInitTime(timeZoneOffset);
        var lastSuccessTimeMs = lastSuccessTime.getTime();

        var keepAliveTimesMs1 = keepAliveTimes[i];

        var index2 = i + 1;

        var keepAliveTimesMs2 = keepAliveTimes[index2];

        var totalKeepAliveTimesMs1 = keepAliveTimesMs1 + currentDateInited.getTime();
        var totalKeepAliveTimesMs2 = keepAliveTimesMs2 + currentDateInited.getTime();

        if(!keepAliveTimesMs2 && lastSuccessTimeMs >= totalKeepAliveTimesMs1){

            if(lastAliveTime == null){

                return new Date(totalKeepAliveTimesMs1);
            }

            lastAliveTimeMs = lastAliveTime.getTime();

            if(lastAliveTimeMs >= totalKeepAliveTimesMs1){ 

                return undefined;

            }

            return new Date(totalKeepAliveTimesMs1);
        }

        if(lastSuccessTimeMs >= totalKeepAliveTimesMs1 && lastSuccessTimeMs < totalKeepAliveTimesMs2){
            if(lastAliveTime == null){

                return new Date(totalKeepAliveTimesMs1);

            }

            if(lastAliveTimeMs >= totalKeepAliveTimesMs1){ 

                continue;
            }

            return new Date(totalKeepAliveTimesMs1);
        }
    }
}

module.exports = {
    checkTimeFormat:checkTimeFormat,
    getTimeMs:getTimeMs,
    getInitTime:getInitTime,
    checkTime:checkTime
}
