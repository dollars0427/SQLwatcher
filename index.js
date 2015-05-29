//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var mysql = require('mysql');
var mailer = require('emailjs');
var promise = require('promised-io');
var moment = require('moment-timezone');
var when = promise.when;
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
var timerConfig = settingFile['timer'];
var mailConfig = settingFile['mail'];
var database = require('./database');
var email = require('./email');
var processTimes = require('./processtimes');

var checkTimeFormat = processTimes.checkTimeFormat;
var getTimeMs = processTimes.getTimeMs;
var getInitTime = processTimes.getInitTime;
var checkTime = processTimes.checkTime;

var mysqlOpt = {
    host:dbConfig.host,
    port:dbConfig.port,
    user:dbConfig.username,
    password:dbConfig.password,
    database:dbConfig.dbName
}   

var workerFree = true;
var lastExecute = 0;
var lastAliveTime = null;

var times = timerConfig.repeattime;
var keepAliveTimes = timerConfig.keepalivetimes;
var timeZoneOffset = timerConfig.timezoneoffset;

for(var i = 0; i < keepAliveTimes.length; i++){

    var keepAliveTime = keepAliveTimes[i];

    checkTimeFormat(keepAliveTime);

    var keepAliveTimeMs = getTimeMs(keepAliveTime);

    keepAliveTimes[i] = keepAliveTimeMs;

}

keepAliveTimes.sort();

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

        if(timeZoneOffset == ''){

            lastExecute = new Date().getTime();

        }

        else{

            lastExecute = new moment.tz(new Date(),timeZoneOffset).valueOf();
        }
    }

    workerFree = true;
}

function runSQL(){

    if(!getLock()){

        return;
    }

    if(timeZoneOffset == ''){

        var now = new Date().getTime();

    }

    else{

        var now = new moment.tz(new Date(),timeZoneOffset).valueOf();
    }

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


    function _runSQL(opt){

        var p = new promise.defer();

        var query = queryConfig[opt["idx"]];

        if(!query){

            p.resolve();

            return p;
        }

        database.excuteMySQLQuery(dbConnection,query,function(err,result){

            if(err){

                logger.error('Detected Error! ', err);

                p.reject({
                    time:new Date(),
                    err: new Error(err),
                    sql: query
                });

                return;
            }

            logger.info('SQL success:', query);

            p.resolve({ idx: opt["idx"] + 1});

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

    function runQueries(){

        var p = new promise.defer();

        function runSucess(){

            logger.warn('Run Sucess!');

            var opt = {
                time: new Date(),
            };

            p.resolve(opt);

        }

        function runFailed(opt){

            logger.warn('Run Failed:');
            logger.warn(opt.err);
            logger.warn(opt.sql);

            p.resolve(opt);

        }

        var funList = [];

        for(var i = 0; i< queryConfig.length; i++){

            funList.push(_runSQL);
        }

        var pSQL = promise.seq(funList, {idx: 0});

        when(pSQL,runSucess,runFailed);

        return p;
    }

    function sendNotification(result){

        var p = new promise.defer();

        var mailConnection =  mailer.server.connect({
            user:mailConfig.server.user,
            password:mailConfig.server.password,
            host:mailConfig.server.host,
            port:mailConfig.server.port,
            ssl:mailConfig.server.ssl,
            tls:mailConfig.server.tls
        });

        if(result['err']){

            var text = mailConfig.dead.text 
            + ' \n'
            + ' \n'
            +'Result Time: '
            + result['time']
            + ' \n'
            + ' \n Excuted Query:'
            + result['sql'];

            var opt = {   
                text:    text, 
                from:    mailConfig.dead.from, 
                to:      mailConfig.dead.to,
                subject: mailConfig.dead.subject
            };

            email.sendWarningMail(mailConnection,opt,function(err,email){

                if(err){
                    logger.error(err);
                }               

                logger.info(email);

                p.resolve();
            });

            return;
        }

        var text = mailConfig.alive.text 
        + ' \n'
        + ' \n'
        +'Last Sucess Time: '
        + result['time']
        +' \n'

        var opt = {   
            text:    text, 
            from:    mailConfig.alive.from, 
            to:      mailConfig.alive.to,
            subject: mailConfig.alive.subject
        };

        var checkTimeSuccess = checkTime(keepAliveTimes,lastAliveTime,result['time'],timeZoneOffset);

        if(checkTimeSuccess){

            email.sendAliveMail(mailConnection,opt,function(err,mail){

                if(err){

                    logger.error(err);

                    return;
                }

                logger.info(mail);

                logger.info(checkTimeSuccess);

                lastAliveTime = new Date();

                p.resolve();

            });
        }

        else{

            p.resolve();
        }

        return p;
    }

    var chain = new promise.defer();
    chain
    .then(connectDatabase)
    .then(runQueries)
    .then(sendNotification)
    .then(complete)

    chain.resolve();

}
