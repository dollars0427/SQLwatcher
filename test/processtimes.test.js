'use strict';

//Load Config File
var fs = require('fs');
var processTimes = require('../processtimes');
var moment = require('moment-timezone');

//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');
var settingFile = JSON.parse(fs.readFileSync('../config/setting.json'));
var timerConfig = settingFile['timer'];
var keepAliveTimes = timerConfig.keepalivetimes;

exports['Test Checking Time Format Function'] ={ 

    'Test checkTimeFormat success(12:00)':function(test){

        var time = '12:00';

        var result = processTimes.checkTimeFormat(time);

        test.equal(result,true,'The result should be true!');

        test.done();
    },

    'Test checkTimeFormat false(24:00)':function(test){

        var time = '24:00';

        try{

            var result = processTimes.checkTimeFormat(time);

        }catch(ex){

            test.ok(ex,'The function must throw error!');

        }

        test.done();
    }
}

exports['Test Get Time Function'] = {

    'Test getTimeMs Correct(12:00)':function(test){

        var time = '12:00';

        var result = processTimes.getTimeMs(time);

        var correctResult = 43200000;

        test.equal(result,correctResult,'The result should be 43200000!');

        test.done();
    },

    'Test getInitTime Correct(No time zone offset)':function(test){

        var timeZoneOffset = '';

        var result = processTimes.getInitTime(timeZoneOffset);

        var correctResult = new Date();

        correctResult.setHours(0);
        correctResult.setMinutes(0);
        correctResult.setSeconds(0);
        correctResult.setMilliseconds(0);

        test.equal(result.getTime(),correctResult.getTime(),'The time should be 00:00:00 !');

        test.done();
    },

    'Test getInitTime Correct(Have time zone offset)':function(test){

        var timeZoneOffset = 'America/Los_Angeles';

        var correctResult = new moment.tz(new Date(),timeZoneOffset);

        correctResult.hours(0);
        correctResult.minutes(0);
        correctResult.seconds(0);
        correctResult.milliseconds(0);

        var correctResultMs = correctResult.valueOf();

        var result = processTimes.getInitTime(timeZoneOffset);

        logger.debug(result);

        test.equal(result.getTime(),correctResultMs,'The time should be covert to correct time offset !');

        test.done();

    }   
},

exports['Test check time function'] = {

    'Test Send Alive Mail Time Correct(17:45,No timeZoneOffset and lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZoneOffset = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(46);

        var result = processTimes.checkTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,true,'The result should be true!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45,No timeZoneOffset and lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZoneOffset = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(30);

        var result = processTimes.checkTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time Correct(17:45,18:00,No timeZoneOffset and lastAlive Time)':function(test){

        var keepAliveTime = ['17:45','18:00'];

        for(var i =0; i < keepAliveTime.length; i++){

            var splitedTime = keepAliveTime[i].split(':');

            var hour = splitedTime[0];

            var minute = splitedTime[1];

            var hourMs = hour * 60 * 60 * 1000;

            var minMs = minute * 60 *1000;

            var totalMs = hourMs + minMs;

            keepAliveTime[i] = totalMs;

        }

        logger.debug(keepAliveTime);

        var lastAliveTime = null;

        var timeZoneOffset = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(18);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,true,'The result should be true!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45,18:00,No timeZoneOffset and lastAlive Time)':function(test){

        var keepAliveTime = ['17:45','18:00'];

        for(var i =0; i < keepAliveTime.length; i++){

            var splitedTime = keepAliveTime[i].split(':');

            var hour = splitedTime[0];

            var minute = splitedTime[1];

            var hourMs = hour * 60 * 60 * 1000;

            var minMs = minute * 60 *1000;

            var totalMs = hourMs + minMs;

            keepAliveTime[i] = totalMs;

        }

        logger.debug(keepAliveTime);

        var lastAliveTime = null;

        var timeZoneOffset = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(15);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time Correct(17:45,have timeZoneOffset but no lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZoneOffset = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,true,'The result should be true!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45, have timeZoneOffset but no lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZoneOffset = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(7);

        lastCorrectTime.setMinutes(30);

        var result = processTimes.checkTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },
}

function getTimeMs(time){

    var splitedTime = time.split(':');

    var hour = splitedTime[0];

    var minute = splitedTime[1];

    var hourMs = hour * 60 * 60 * 1000;

    var minMs = minute * 60 *1000;

    var totalMs = hourMs + minMs;

    return totalMs;

}
