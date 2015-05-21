//Load the config file

var fs = require('fs');

var settingPath = process.argv[2];
var queryListPath = process.argv[3];

if(!settingPath || !queryListPath){
    printUsage();
    process.exit(1);
}

function printUsage(){

    var out = "Usage: " + process.argv[1] + " [Setting file] [Query list file]"

    console.log(out);
}

var settingFile = JSON.parse(fs.readFileSync(settingPath));
var queryListFile = JSON.parse(fs.readFileSync(queryListPath));

var dbConfig = settingFile['database']
var queryConfig = queryListFile['queryList']
var timerConfig = settingFile['repeatTimer'];
var mailConfig = settingFile['mail'];

//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var mysql = require('mysql');
