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

var mysql = require('mysql');
var log4js = require('log4js');
var promise = require('promised-io');
var email = require('emailjs');

var server = email.server.connect({
    user:mailConfig.server.user,
    password:mailConfig.server.password,
    host:mailConfig.server.host,
    port:mailConfig.server.port,
    ssl:mailConfig.server.ssl,
    tls:mailConfig.server.tls
});

var logger = log4js.getLogger('Logging');

connectDatabase();

function connectDatabase(){

    //Create Connection with mysql database

    var connection = mysql.createConnection({

        host:dbConfig.host,
        port:dbConfig.port,
        user:dbConfig.username,
        password:dbConfig.password,
        database:dbConfig.dbName

    });

    connection.connect(startConnection);

    function startConnection(err){

        if(err){

            logger.error('Cannot Connect To Database !',err);
            process.exit(1);
        }

        testDatabase(connection);
    }
}

function testDatabase(db){

    var plist = [];

    var queryList = queryConfig;

    for(var i = 0; i < queryList.length; i++ ){

        var p = new promise.defer();

        plist.push(p);
    }

    var pAll = new promise.all(plist);
    pAll.then(sendAliveMail,sendWarningMail);

    for(var i = 0 ; i < queryList.length; i++){

        var p = plist[i];

        var query = queryList[i].query;

        startTesting(p,db,query);
    }
}

function startTesting(promise,db,query){

    var p = promise;

    logger.info('Testing Query:', query);

    db.query(query,function(err,result){

        if(err){
            logger.error(err);
            p.reject(err);
            return;
        }

        logger.debug('Sucess! The result is:',result);

        p.resolve();
    });

    return p;
}

function sendAliveMail(){

    var opt = {   
        text:    mailConfig.alive.text, 
        from:    mailConfig.alive.from, 
        to:      mailConfig.alive.to,
        subject: mailConfig.alive.subject
    };

    logger.info('Sending Alive Mail....');

    server.send(opt,sendMail);

}

function sendWarningMail(err){

    var text = mailConfig.dead.text + err;

    var opt = {   
        text:    mailConfig.dead.text, 
        from:    mailConfig.dead.from, 
        to:      mailConfig.dead.to,
        subject: mailConfig.dead.subject
    };

    logger.info('Sending Warning Mail.....');
    
    server.send(opt,sendMail);
}

function sendMail(err,message){

    if(err){

        logger.error(err);

        return;
    }

    logger.debug('Success! The result of messages is:');

    logger.debug(message);
}

module.exports = connectDatabase;
module.exports = testDatabase;
module.exports = startTesting;
module.exports = sendAliveMail;
module.exports = sendWarningMail;
