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

    db.query(query,function(err){

        if(err){
            logger.error(err);
            p.reject();
            return;
        }

        p.resolve();
    });

    return p;
}

function sendAliveMail(){

    console.log('Yes!');

function sendWarningMail(){

    console.log('No!');
}
