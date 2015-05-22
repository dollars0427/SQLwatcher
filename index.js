//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var mysql = require('mysql');
var mailer = require('emailjs');
var promise = require('promised-io');
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
var timerConfig = settingFile['repeatTimer'];
var mailConfig = settingFile['mail'];
var database = require('./database');
var email = require('./email');

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

var times = timerConfig.ms;

var keepAliveTimes = timerConfig.time;

function checkTimeFormat(time){

    var checking = time.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/);

    if(!checking){

        throw new Error('The format of time Is no correct!');
    }
}

function getTimeMs(time){

    checkTimeFormat(time);

    var splitedTime = time.split(':');

    var hour = splitedTime[0];

    var minute = splitedTime[1]; 

    var hourMs = hour * 60 * 60 * 1000;

    var minMs = minute * 60 *1000;

    var totalMs = hourMs + minMs; 

    return totalMs;

}

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

        var checkTimeSuccess = checkTime(opt,result['time']);

        if(checkTimeSuccess === true){

           email.sendAliveMail(mailConnection,opt,function(err,mail){

               if(err){

                   logger.error(err);

                   return;
               }

               logger.info(mail);

               lastAliveTime = new Date();

               p.resolve();

           });
        }

        else{

            p.resolve();
        }

        return p;
    }

    function checkTime(opt,lastSuccessTime){

        for(var i =0; i < keepAliveTimes.length; i++){

            var currentDateInited = getInitTime();
            var lastSuccessTimeMs = lastSuccessTime.getTime();
            var keepAliveTimesMs = keepAliveTimes[i];
            var totalKeepAliveTimesMs = keepAliveTimesMs + currentDateInited.getTime();

            var keepAliveTimesDate = new Date(totalKeepAliveTimesMs);

            if(lastSuccessTimeMs >= totalKeepAliveTimesMs){

                if(lastAliveTime === null){

                    return true;
                }
                var keepAliveTimesMonth = keepAliveTimesDate.getMonth();
                var keepAliveTimesDate = keepAliveTimesDate.getDate();

                var lastAliveTimeMonth = lastAliveTime.getMonth();
                var lastAliveTimeDate = lastAliveTime.getDate();

                if(lastAliveTimeMonth !== keepAliveTimesMonth && lastAliveTimeDate !== keepAliveTimesDate){

                    return true;

                }
            }
        }
    }

    function getInitTime(){

        var currentDate = new Date();

        currentDate.setHours(0);
        currentDate.setMinutes(0);
        currentDate.setSeconds(0);
        currentDate.setMilliseconds(0);

        return currentDate;
    }

    var chain = new promise.defer();
    chain
    .then(connectDatabase)
    .then(runQueries)
    .then(sendNotification)
    .then(complete)

    chain.resolve();
}
