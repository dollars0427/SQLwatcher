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
var queryConfig = queryListFile['query']
var timerConfig = settingFile['repeatTimer'];
var mailConfig = settingFile['mail'];

//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var mysql = require('mysql');
var mailer = require('emailjs');
var promise = require('promised-io');

var database = require('./database');
var email = require('./email');

var mysqlOpt = {
    host:dbConfig.host,
    port:dbConfig.port,
    user:dbConfig.username,
    password:dbConfig.password,
    database:dbConfig.dbName
}   

var aliveMailOpt = {
    text:    mailConfig.alive.text,
    from:    mailConfig.alive.from,
    to:      mailConfig.alive.to,
    subject: mailConfig.alive.subject
};

var warningMailOpt = {
    text:    mailConfig.dead.text,
    from:    mailConfig.dead.from,
    to:      mailConfig.dead.to,
    subject: mailConfig.dead.subject
}

var mailConnection =  mailer.server.connect({
    user:mailConfig.server.user,
    password:mailConfig.server.password,
    host:mailConfig.server.host,
    port:mailConfig.server.port,
    ssl:mailConfig.server.ssl,
    tls:mailConfig.server.tls
});

var workerFree = true;
var lastExecute = 0;

var times = timerConfig.ms;

setInterval(runSQL,500);

function getLock(){

    if(!workerFree){

        return false;
    }

    workerFree = false;

    return true;
}

function release(reset){

    if(reset){

        lastExecute = new Date().getTime();
    }

    workerFree = true;
}

function runSQL(){

    if(!getLock()){

        return;
    }

    var now = new Date().getTime();

    if (now - lastExecute < times){

        release();

        return;

    }

    var dbConnection = mysql.createConnection(mysqlOpt);
    
    function connectDatabase(){

        var p = new promise.defer();

        dbConnection.connect(function(err){

            if(err){
                logger.error('Cannot Connect To Database!',err);
                process.exit(1);
            }

            logger.info('Connected to database.');

            p.resolve();

        });

        return p;
    }


    function complete(){

        var p = new promise.defer();

        dbConnection.end(function(err){

            if(err){

                logger.error(err);

                connection.end();
            }

            logger.info('Complete!');

            release(true);

            p.resolve();

        });

        return p;

    }
    
    var chain = new promise.defer();
    chain
    .then(connectDatabase)
    .then(complete)

    chain.resolve();
}

function checkDatabase(dbConnection){

    var query = queryConfig.pop();

    database.excuteMySQLQuery(dbConnection,queryConfig,function(err,result){

        if(err){

            logger.error('Detected Error! ', err);

            email.sendWarningMail(mailConnection,warningMailOpt,sendMail);

            return;
        }

        logger.info('OK,There no any error.');

        email.sendAliveMail(mailConnection,aliveMailOpt,sendMail);

    });
}

function sendMail(err,email){
    
    if(err){
        logger.error(err);
        return;
    }

    logger.debug('Sended Messages: ',email);
}

