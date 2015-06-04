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

var queryListFile = JSON.parse(fs.readFileSync(queryListPath));

var dbConfig = nconf.get('database');
var queryConfig = queryListFile['query'];
var timerConfig = nconf.get('timer');
var mailConfig = nconf.get('mail');

var checkTimeFormat = processTimes.checkTimeFormat;
var getTimeMs = processTimes.getTimeMs;
var getInitTime = processTimes.getInitTime;
var checkTime = processTimes.checkTime;

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

/*
 * Convert the keepAliveTimes to ms and sort it.
 * 
* */

for(var i = 0; i < keepAliveTimes.length; i++){

    var keepAliveTime = keepAliveTimes[i];

    checkTimeFormat(keepAliveTime);

    var keepAliveTimeMs = getTimeMs(keepAliveTime);

    keepAliveTimes[i] = keepAliveTimeMs;

}

keepAliveTimes.sort();

setInterval(runSQL,time);

function getLock(){

    /**If the workerFree variable had not defined, return false.
    *Otherwise, set it to false and return true.
    */

    if(!workerFree){

        return false;
    }

    workerFree = false;

    return true;
}

function release(reset){

    /*If reset is defined, reset the lastExecute time
     * Otherwise, set worker to free
     * */

    if(reset){

        lastExecute = new Date().getTime();
    }


    workerFree = true;
}

function runSQL(){

    /* Lock the worker,if cannot getLock, it will be exit.
     * Otherwise, it will check the time of now and last excute, 
     * if the difference of them is smaller then setted time,
     * release the worker and exit.
     * */

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

        /**
         * It will receive a opt object which havd a index,
         * And get query from queryList by the index.
         * If there are no any query,it will resolve the promise.
         * Otherwise, call the excuteMySQLQuery function by passing
         * dbConnection,query and callback function.
         * 
         * If Detected any error, reject the promise with a object
         * which have time,error and excuted query.
         *
         * Otherwise, resolve the promise with the opt object which have index + 1.
         *
         **/

        var p = new promise.defer();

        var query = queryConfig[opt["idx"]];

        if(!query){

            p.resolve();

            return p;
        }

        database.excuteMySQLQuery(dbConnection,query,function(err,result){

            if(err){                logger.error('Detected Error! ', err);

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

        /**
         * If all of query can be excute successful,Run runSucess.
         * Otherwise, run runFailed.
         *
         * If there no any query excuted,
         * Store all of the _runSQL function in a array, 
         * and using promise.then to run them by order.
         * */

        var p = new promise.defer();

        function runSucess(){

            /**
             *
             *Save the lastSucess time to opt amd resolve with this object
             *
             **/

            logger.warn('Run Sucess!');


            var opt = {
                time: new Date(),
            };

            p.resolve(opt);

        }

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

        var funList = [];

        for(var i = 0; i< queryConfig.length; i++){

            funList.push(_runSQL);
        }

        var pSQL = promise.seq(funList, {idx: 0});

        when(pSQL,runSucess,runFailed);

        return p;
    }

    function sendNotification(result){

        /**
         * Receive a result which have time and may have error.
         * If the result of excute sql have error, 
         * send warning mail with the text in config,result time and excuted query.
         *
         * Otherwise, call the check alive time function to
         * check the last sucess time of excute query is match the keep alive time.
         * If checkTimeSuccess had return anything, send alive mail and resolve the promise. 
         * */

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

    //Create a chain of function, let the script can run the function by order.

    var chain = new promise.defer();
    chain
    .then(connectDatabase)
    .then(runQueries)
    .then(sendNotification)
    .then(complete)

    chain.resolve();

}
