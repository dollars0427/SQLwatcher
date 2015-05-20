//Load the config file

var config = require('config');
var dbConfig = config.get('Database');
var queryConfig = config.get('QueryList');
var timerConfig = config.get('RepeatTimer');
var mailConfig = config.get('Mail');

//Require Module

var mysql = require('mysql');
var log4js = require('log4js');
var promise = require('promised-io');
var email = require('emailjs');

var server = email.server.connect({
    user:mailConfig.Server.user,
    password:mailConfig.Server.password,
    host:mailConfig.Server.host,
    port:mailConfig.Server.port,
    ssl:mailConfig.Server.ssl,
    tls:mailConfig.Server.tls
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

    var receiverList = mailConfig.Alive.to;

    var receiverListString = receiverList.toString();

    var opt = {   
        text:    mailConfig.Alive.text, 
        from:    mailConfig.Alive.from, 
        to:      mailConfig.Alive.to,
        subject: mailConfig.Alive.subject
    };

    logger.info('Sending Alive Mail....');

    server.send(opt,sendMail);

}

function sendWarningMail(err){


    var receiverList = mailConfig.Dead.to;

    var receiverListString = receiverList.toString();

    var text = mailConfig.Dead.text + err;

    var opt = {   
        text:    mailConfig.Dead.text, 
        from:    mailConfig.Dead.from, 
        to:      mailConfig.Dead.to,
        subject: mailConfig.Dead.subject
    };

    logger.info('Sending Warning Mail.....');
    
    server.send(opt,sendMail);
}

function sendMail(err,message){

    if(err){

        logger.error(err);

        return;
    }

    logger.debug('Sucess! The result of messages is:');

    logger.debug(message);
}
