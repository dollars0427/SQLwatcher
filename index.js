//Load the config file

var config = require('config');
var dbConfig = config.get('Database');
var timerConfig = config.get('RepeatTimer');
var mailConfig = config.get('Mail');

//Require Module

var mysql = require('mysql');
var log4js = require('log4js');
var promise = require('promised-io');

log4js.configure({
    appenders:[
        {type:'console'}],
        replaceConsole:true
});

var logger = log4js.getLogger('Logging');

