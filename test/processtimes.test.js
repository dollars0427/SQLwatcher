'use strict';

//Load Config File
var fs = require('fs');
var processTimes = require('../processtimes');
var moment = require('moment-timezone');
//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');

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

    'Test getTimeMs Right(12:00)':function(test){

        var time = '12:00';

        var result = processTimes.getTimeMs(time);

        var correctResult = 43200000;

        test.equal(result,correctResult,'The result should be 43200000!');

        test.done();
    },

    'Test getInitTime Right(No time zone offset)':function(test){

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
    
    'Test getInitTime Right(Have time zone offset)':function(test){

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


    'Test Send Alive Mail Time(17:45,No timeZoneOffset and lastAlive Time)':function(test){

        var timeZoneOffset = '';

        var keepAliveTime = ['17:45'];
        
        var lastAliveTime = null;

        var lastSuccessTime = new Date();

        lastSuccessTime.setHours(17);

        lastSuccessTime.setMinutes(46);

        var result = processTimes.checkTime(keepAliveTime,lastSuccessTime,timeZoneOffset);

        logger.info(result);

        test.equal(result,true,'The result should be true!');

        test.done();
    },

    'Test Send Alive Mail Time(17:45,have timeZoneOffset,no lastAlive Time)':function(test){

        var timeZoneOffset = 'America/Los_Angeles';

        var keepAliveTime = ['17:46'];
        
        var lastAliveTime = null;

        var lastSuccessTime = moment.tz(new Date(),timeZoneOffset);

        lastSuccessTime.hours(17);

        lastSuccessTime.minutes(46);

        var result = processTimes.checkTime(keepAliveTime,lastSuccessTime,lastAliveTime,timeZoneOffset);

        test.equal(result,true,'The result should be true!');

        test.done();

    },
}

