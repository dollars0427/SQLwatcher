'use strict';

//Load Config File
var fs = require('fs');
var processTimes = require('../processtimes');

//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');

exports['Test Checking Time Format Function'] ={ 
    
    'Test checkTimeFormat sucess(12:00)':function(test){

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
