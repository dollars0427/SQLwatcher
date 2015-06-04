'use strict';

var fs = require('fs');
var processTimes = require('../processtimes');
var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');
var moment = require('moment-timezone');
var nconf = require('nconf');
nconf.argv()
.env()
.file({file:'./config/setting.json'});

var timerConfig = nconf.get('timer');
var keepAliveTimes = timerConfig.keepalivetimes;

exports['Test Checking Time Format Function'] ={ 

    'Test checkTimeFormat success(12:00)':function(test){

        var time = '12:00';

        var result = processTimes.checkTimeFormat(time);

        test.equal(result,true,'It should return true!');

        test.done();
    },

    'Test checkTimeFormat false(24:00)':function(test){

        var time = '24:00';

        var result = processTimes.checkTimeFormat(time);

        test.equal(result,false,'The function must return false!');

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

    'Test getTimeMs Incorrect(25:00)':function(test){

        var time = '25:00';

        try{

            var result = processTimes.getTimeMs(time);

        }catch(ex){

            test.ok(ex,'The function must throw error!');

            test.done();

        }
    },

    'Test getInitTime Correct(No time zone offset)':function(test){

        var timeZone = '';

        var result = processTimes.getInitTime(timeZone);

        var correctResult = new Date();

        correctResult.setHours(0);
        correctResult.setMinutes(0);
        correctResult.setSeconds(0);
        correctResult.setMilliseconds(0);

        test.equal(result.getTime(),correctResult.getTime(),'The time should be 00:00:00 !');

        test.done();
    },

    'Test getInitTime Correct(Have time zone offset)':function(test){

        var timeZone = 'America/Los_Angeles';

        var currentDate = new Date();

        var correctResult = new moment.tz(new Date(),timeZone);

        correctResult.month(currentDate.getMonth());
        correctResult.date(currentDate.getDate());
        correctResult.hours(0);
        correctResult.minutes(0);
        correctResult.seconds(0);
        correctResult.milliseconds(0);

        var correctResultMs = correctResult.valueOf();

        var result = processTimes.getInitTime(timeZone);

        logger.debug(result);

        test.equal(result.getTime(),correctResultMs,'The time should be covert to correct time offset !');

        test.done();
    },

    'Test getInitTime Incorrect(Wrong time zone offset)':function(test){

        var timeZone = 'HelloWorld';

        var currentDate = new Date();

        currentDate.setHours(8);
        currentDate.setMinutes(0);
        currentDate.setMilliseconds(0);
        
        var result = processTimes.getInitTime(timeZone);

        test.ok(result !== currentDate.getTime(),'It should not get any result.');

        test.done();
    }     
},

exports['Test check time function'] = {

    'Test Send Alive Mail Time Correct(17:45,No timeZone and lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(46);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should had a result!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45,No timeZone and lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(30);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(0,No timeZone and lastAlive Time)':function(test){

        var keepAliveTime = ['0'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(30);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time Correct(17:45,18:00,No timeZone and lastAlive Time)':function(test){

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

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(18);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should had a result!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(0,1,No timeZone and lastAlive Time)':function(test){

        var keepAliveTime = ['0','1'];

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

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(18);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45,18:00,No timeZone and lastAlive Time)':function(test){

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

        var lastAliveTime = null;

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(15);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time Correct(1:00,have timeZone but no lastAlive Time)':function(test){

        var keepAliveTime = ['1:00'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should had a result!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45, have timeZone but no lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(7);

        lastCorrectTime.setMinutes(30);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },

    'Test Send Alive Mail Time correct(1:00, have wrong timeZone but no lastAlive Time)':function(test){

        var keepAliveTime = ['1:00'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = 'Hello World';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(0);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should have a result!');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(17:45, have wrong timeZone but no lastAlive Time)':function(test){

        var keepAliveTime = ['17:45'];

        var splitedTime = keepAliveTime[0].split(':');

        var hour = splitedTime[0];

        var minute = splitedTime[1];

        var hourMs = hour * 60 * 60 * 1000;

        var minMs = minute * 60 *1000;

        var totalMs = hourMs + minMs;

        keepAliveTime[0] = totalMs;

        var lastAliveTime = null;

        var timeZone = 'Hello World';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(7);

        lastCorrectTime.setMinutes(30);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined!');

        test.done();
    },


    'Test Send Alive Mail Time Correct(17:45,No timeZone but lastAlive Time match)':function(test){

        var keepAliveTime = ['17:45'];

        var keepAliveTimeMs = getTimeMs(keepAliveTime[0]);

        keepAliveTime[0] = keepAliveTimeMs;

        var lastAliveTime = new Date();

        lastAliveTime.setHours(17);
        
        lastAliveTime.setMinutes(47);

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(46);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined.');

        test.done();
    },

    'Test Send Alive Mail Time Correct(18:00,No timeZone but lastAlive Time match 17:45)':function(test){

        var keepAliveTime = ['17:45','18:00','19:00'];

        for(var i =0; i < keepAliveTime.length; i++){

            var splitedTime = keepAliveTime[i].split(':');

            var hour = splitedTime[0];

            var minute = splitedTime[1];

            var hourMs = hour * 60 * 60 * 1000;

            var minMs = minute * 60 *1000;

            var totalMs = hourMs + minMs;

            keepAliveTime[i] = totalMs;
        }

        var lastAliveTime = new Date();

        lastAliveTime.setHours(17);

        lastAliveTime.setMinutes(46);

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(18);

        lastCorrectTime.setMinutes(3);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should had a result.');

        test.done();
    },

    'Test Send Alive Mail Time Correct(17:45,No timeZone but lastAlive Time not match)':function(test){

        var keepAliveTime = ['17:45'];

        var keepAliveTimeMs = getTimeMs(keepAliveTime[0]);

        keepAliveTime[0] = keepAliveTimeMs;

        var lastAliveTime = new Date();

        lastAliveTime.setHours(16);
        
        lastAliveTime.setMinutes(40);

        var timeZone = '';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(46);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should had a result.');

        test.done();
    },

    'Test Send Alive Mail Time Correct(1:00,have timeZone and lastAlive Time match)':function(test){

        var keepAliveTime = ['1:00'];

        var keepAliveTimeMs = getTimeMs(keepAliveTime[0]);

        keepAliveTime[0] = keepAliveTimeMs;

        var lastAliveTime = new Date();

        lastAliveTime.setHours(20);
        
        lastAliveTime.setMinutes(2);

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(1);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined.');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(10:00,have timeZone and lastAlive Time match)':function(test){

        var keepAliveTime = ['10:00'];

        var keepAliveTimeMs = getTimeMs(keepAliveTime[0]);

        keepAliveTime[0] = keepAliveTimeMs;

        var lastAliveTime = new Date();

        lastAliveTime.setHours(20);
        
        lastAliveTime.setMinutes(2);

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(1);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined.');

        test.done();
    },

    'Test Send Alive Mail Time Correct(1:00,have timeZone and lastAlive Time not match)':function(test){

        var keepAliveTime = ['1:00'];

        var keepAliveTimeMs = getTimeMs(keepAliveTime[0]);

        keepAliveTime[0] = keepAliveTimeMs;

        var lastAliveTime = new Date();

        lastAliveTime.setHours(0);
        
        lastAliveTime.setMinutes(0);

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(1);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'It should had a result.');

        test.done();
    },

    'Test Send Alive Mail Time Incorrect(10:00,have timeZone and lastAlive Time not match)':function(test){

        var keepAliveTime = ['10:00'];

        var keepAliveTimeMs = getTimeMs(keepAliveTime[0]);

        keepAliveTime[0] = keepAliveTimeMs;

        var lastAliveTime = new Date();

        lastAliveTime.setHours(0);
        
        lastAliveTime.setMinutes(0);

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(20);

        lastCorrectTime.setMinutes(1);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.equal(result,undefined,'The result should be undefined.');

        test.done();
    },

    'Test Send Alive Mail Time Correct(2:00,have timeZone and lastAlive Time match)':function(test){

        var keepAliveTime = ['1:00','2:00','3:00'];

        for(var i =0; i < keepAliveTime.length; i++){

            var splitedTime = keepAliveTime[i].split(':');

            var hour = splitedTime[0];

            var minute = splitedTime[1];

            var hourMs = hour * 60 * 60 * 1000;

            var minMs = minute * 60 *1000;

            var totalMs = hourMs + minMs;

            keepAliveTime[i] = totalMs;
        }

        var lastAliveTime = new Date();

        lastAliveTime.setHours(16);
        
        lastAliveTime.setMinutes(2);

        var timeZone = 'America/Los_Angeles';

        var lastCorrectTime = new Date();

        lastCorrectTime.setHours(17);

        lastCorrectTime.setMinutes(2);

        var result = processTimes.checkKeepAliveTime(keepAliveTime,lastAliveTime,lastCorrectTime,timeZone);

        logger.info(result);

        test.ok(result,'The result should have result.');

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
