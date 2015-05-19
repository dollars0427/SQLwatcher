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

log4js.configure({
    appenders:[
        {type:'console'}],
        replaceConsole:true
});

var mysqlDB = null;

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

    var queryList = queryConfig;
 
    for(var i = 0 ; i < queryList.length; i++){

        var query = queryList[i].query;

        startTesting(db,query);
    }
}

function startTesting(db,query){

    db.query(query,function(err){

        if(err){
            logger.error(err);
        }

        console.log(query);

    });
}

function sendAliveMail(){

    console.log('YES');
}

function sendWarningMail(){

    console.log('No!');
}
