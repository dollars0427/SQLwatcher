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

var settingPath = process.argv[2];
var queryListPath = process.argv[3];

if(!settingPath || !queryListPath){
    printUsage();
    process.exit(1);
}
nconf.argv()
.env()
.file({file:settingPath})

var database = require('./database');
var email = require('./email');
var processTimes = require('./processtimes');

function printUsage(){

    var out = "Usage: " + process.argv[1] + " [Setting file] [Query list file]"

    console.log(out);
}

var queryListFile = JSON.parse(fs.readFileSync(queryListPath));

var dbConfig = nconf.get('database');
var jobConfig = queryListFile['job'];
var selectRecordConfig = queryListFile['defaultSelectRec'];
var updateRecordConfig = queryListFile['defaultUpdateRec'];

var timerConfig = nconf.get('timer');
var mailConfig = nconf.get('mail');

var defaultSelectRec = 1;
var defaultUpdateRec = 1;

if (selectRecordConfig){
    
    defaultSelectRec = queryListFile['defaultSelectRec'];
}

if(!selectRecordConfig){

    defaultUpdateRec = queryListFile['defaultUpdateRec'];
}


var checkTimeFormat = processTimes.checkTimeFormat;
var getTimeMs = processTimes.getTimeMs;
var getInitTime = processTimes.getInitTime;
var checkKeepAliveTime = processTimes.checkKeepAliveTime;

var mysqlOpt = {
    host:dbConfig.host,
    port:dbConfig.port,
    user:dbConfig.username,
    password:dbConfig.password,
    database:dbConfig.dbname
}   

var workerFree = true;

var lastExecute = 0;

var lastAliveTime = null;

var time = timerConfig.repeattime;

var keepAliveTimes = timerConfig.keepalivetimes;

var timeZone = timerConfig.timezone;


//Convert the keepAliveTimes to ms and sort it.

for(var i = 0; i < keepAliveTimes.length; i++){

    var keepAliveTime = keepAliveTimes[i];

    checkTimeFormat(keepAliveTime);

    var keepAliveTimeMs = getTimeMs(keepAliveTime);

    keepAliveTimes[i] = keepAliveTimeMs;

}

keepAliveTimes.sort();

setInterval(runSQL,500);

/**
 *Check the worker status and lock it.
 *
 * @return {bool} true 
 *
 */

function getLock(){

    //If the worker status is not free, return false represent lock failed.

    if(!workerFree){

        return false;
    }

    //If the worker status is free, lock it and return true represent lock success.

    workerFree = false;

    return true;
}

/**
 * Reset last execute and set worker free 
 *
 * @param {boolean} reset
 *
 */

function release(reset){

    //If reset is defined, reset the lastExecute time

    if(reset){

        lastExecute = new Date().getTime();
    }

    //Set worker status to free.

    workerFree = true;
}

/*
 *Check current time, if it match the setted time will conncet to database.
 */

function runSQL(){

    if(!getLock()){

        return;
    }

    /*
     * If the difference of current time and last execute time is smaller
     * than setted time, run release to reset the lastExecute time and exit.
     */

    var now = new Date().getTime();

    if (now - lastExecute < time){

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

    /**
     *
     * Get query from queryList from the index in the opt object,
     * then excute it.
     *
     * @param {object["idx"]} opt
     *
     */

    function _runSQL(opt){

        var p = new promise.defer();

        //Get query from queryList by the index.

        var query = jobConfig[opt["idx"]].sql;
        var rec = jobConfig[opt["idx"]].rec;

        var selectStatement = query.search("SELECT");
        var updateStatement = query.search("UPDATE");

        if(!query){

            p.resolve();

            return p;
        }

        database.excuteMySQLQuery(dbConnection,query,function(err,result){

            if(err){                

                //If Detected any error, reject the promise with a object
                //which have time,error and excuted query. 

                logger.error('Detected Error! ', err);

                p.reject({
                    time:new Date(),
                    err: new Error(err),
                    sql: query
                });

                return;
            }

            if(rec && selectStatement === 0 && result['record'].length !== rec){

                logger.error('Detected Error! ', 'Affcted Number of record not match! It must be ' + defaultSelectRec);

                p.reject({
                    time:new Date(),
                    err: 'The number of record not match',
                    sql: query
                });

                return;
            }

            if(rec && updateStatement === 0 && result['affectedRows'] !== defaultUpdateRec){

                logger.error('Detected Error! ', 'Affcted Row not match! It must be ' + defaultUpdateRec);

                p.reject({
                    time:new Date(),
                    err: 'Affcted Row not match! It must be ' + defaultUpdateRec,
                    sql: query
                });

                return;
            }

            if(!rec && selectStatement === 0 && result['record'].length !== defaultSelectRec){

                logger.error('Detected Error! ', 'Number of record not match! It must be ' + defaultSelectRec);

                p.reject({
                    time:new Date(),
                    err: 'The number of record not match',
                    sql: query
                });

                return;
            }

            if(!rec && updateStatement === 0 && result['affectedRows'] !== defaultUpdateRec){

                logger.error('Detected Error! ', 'Affcted Row not match! It must be ' + defaultUpdateRec);

                p.reject({
                    time:new Date(),
                    err: 'Affcted Row not match! It must be ' + defaultUpdateRec,
                    sql: query
                });

                return;
            }

            //resolve the promise with the opt object which have index + 1.
            logger.info('SQL success:', query);

            p.resolve({ idx: opt["idx"] + 1});

        });

        return p;
    }

    function complete(){

        /**
         * After finish all the task, end the database connection and release the worker.
         * */

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

        //If all of query can be excute successful,Run runSucess.

        function runSucess(){

            /**
             *Save the lastSucess time to opt amd resolve with this object
             **/

            logger.warn('Run Sucess!');


            var opt = {
                time: new Date(),
            };

            p.resolve(opt);

        }

        //If there are any query can not be excute successful, Run runFailed.

        function runFailed(opt){

            /**
             * Show the error and query in the object which called opt, 
             * then resolve it with this object.
             * */

            logger.warn('Run Failed:');
            logger.warn(opt.err);
            logger.warn(opt.sql);

            p.resolve(opt);

        }

        // Create a function list and use promise.when to run it by order.

        var funList = [];

        for(var i = 0; i< jobConfig.length; i++){

            funList.push(_runSQL);
        }

        var pSQL = promise.seq(funList, {idx: 0});

        when(pSQL,runSucess,runFailed);

        return p;
    }

    /**
     *
     * Check the SQL excute reuslt and send notification mail.
     *
     * @param {object(time,err,sql)} result
     *
     */

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
         
        //If the result of excute sql have error, 
        //send warning mail with the text in config,result time and excuted query.

        if(result['err']){

            var text = mailConfig.dead.text 
            + ' \n'
            + ' \n'
            +'Result Time: '
            + result['time']
            + ' \n'
            + ' \n'
            +' Error: '
            + result['err']
            + '\n'
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

        //call the check alive time function to
        //check the last sucess time of excute query is match the keep alive time.

        var lastSuccessTime = result['time'].getTime();

        try{
            lastAliveTime = lastAliveTime.getTime();
        }catch(err){}

        var checkKeepAliveTimeSuccess = 
            checkKeepAliveTime(keepAliveTimes,lastAliveTime,lastSuccessTime,timeZone);

        //If checkTimeSuccess had return anything, send alive mail.

        if(checkKeepAliveTimeSuccess){

            email.sendAliveMail(mailConnection,opt,function(err,mail){

                if(err){

                    logger.error(err);

                    return;
                }

                logger.info(mail);

                logger.info(checkKeepAliveTimeSuccess);

                lastAliveTime = new Date();

                p.resolve();

            });
        }

        else{

            p.resolve();
        }

        return p;
    }

    //Create a chain of function, let the script can run the function by order.

    var chain = new promise.defer();
    chain
    .then(connectDatabase)
    .then(runQueries)
    .then(sendNotification)
    .then(complete)

    chain.resolve();

}
