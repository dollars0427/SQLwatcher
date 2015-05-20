'use strict';


//Load Config File
var fs = require('fs');
var settingFile = JSON.parse(fs.readFileSync('../config/setting.json'));
var queryListFile = JSON.parse(fs.readFileSync('../config/querylist.json'));

var dbConfig = settingFile['database']
var queryConfig = queryListFile['queryList']
var timerConfig = settingFile['repeatTimer'];
var mailConfig = settingFile['mail'];

//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');

var mysql = require('mysql');
var email = require('emailjs');

var database = require('../database');

var mysqlOpt = {
    host:dbConfig.host,
    port:dbConfig.port,
    user:dbConfig.username,
    password:dbConfig.password,
    database:dbConfig.dbName
}
var connection = mysql.createConnection(mysqlOpt);

exports['Establish DB connection'] = function(test){

    connection.connect(function(err){

        test.equal(err,null,'Cannot Connect To Database!');

        test.done();

    });
}

exports['Test SQL'] = {

    'Test SQL(select)': function(test){

            var query = 'SELECT * FROM TestTable"';

            var result = database.excuteQuery(connection,query);

            test.ok(result != null,'The result should be success.');
            logger.debug('Excute Query Result: ',result);

            test.done();
    }
}


exports['Terminate DB connection'] = function(test){

        connection.end(function(err){

        test.equal(err,null,'Cannot Close Connection !');

        test.done();

        });
}


