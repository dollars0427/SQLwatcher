//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var mysql = require('mysql');
var mailer = require('emailjs');
var promise = require('promised-io');
var moment = require('moment-timezone');
var when = promise.when;
var fs = require('fs');
var nconf = require('nconf');

nconf.argv()
    .env()
    .file({file:settingPath})

var database = require('./database');
var email = require('./email');
var processTimes = require('./processtimes');

//Get the path of config file and querylist list from argv

var settingPath = process.argv[2];
var queryListPath = process.argv[3];

//If user had not input the path of config file or querylist, print usage and exit

if(!settingPath || !queryListPath){
    printUsage();
    process.exit(1);
}

function printUsage(){

    var out = "Usage: " + process.argv[1] + " [Setting file] [Query list file]"

    console.log(out);
}

//Loading query list and get the config from file

var queryListFile = JSON.parse(fs.readFileSync(queryListPath));

var dbConfig = nconf.get('database');
var queryConfig = queryListFile['query'];
var timerConfig = nconf.get('timer');
var mailConfig = nconf.get('mail');

//Store the function from processTimes in variable
var checkTimeFormat = processTimes.checkTimeFormat;
var getTimeMs = processTimes.getTimeMs;
var getInitTime = processTimes.getInitTime;
var checkTime = processTimes.checkTime;

//Stroe the database config in a object
var mysqlOpt = {
    host:dbConfig.host,
    port:dbConfig.port,
    user:dbConfig.username,
    password:dbConfig.password,
    database:dbConfig.dbname
}   

//In default, the status of worker is free.

var workerFree = true;

//In default, the last execute time is 0.

var lastExecute = 0;

//In default, the last alive time is null.

var lastAliveTime = null;

//Get the time when will the script run again.

var time = timerConfig.repeattime;

//Get the time when will the script send keep alive mail.
var keepAliveTimes = timerConfig.keepalivetimes;

//Get the timezone, and the script will send keep alive mail by this.
var timeZone = timerConfig.timezone;

//Convert the keepAliveTimes to ms and sort it.
for(var i = 0; i < keepAliveTimes.length; i++){

    var keepAliveTime = keepAliveTimes[i];

    checkTimeFormat(keepAliveTime);

    var keepAliveTimeMs = getTimeMs(keepAliveTime);

    keepAliveTimes[i] = keepAliveTimeMs;

}

keepAliveTimes.sort();

//The script will run again after the setted time.

setInterval(runSQL,time);

function getLock(){

    //If the workerFree variable had not defined, return false.
    //Otherwise, set it to false and return true.

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