'use strict';

//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');
var nconf = require('nconf');

nconf.argv()
.env()
.file({file:'./config/setting.json'})

var mysql = require('mysql');
var database = require('../database');

//Load Config File
var fs = require('fs');

var dbConfig = nconf.get('database');

var mysqlOpt = {
    host:dbConfig.host,
    port:dbConfig.port,
    user:dbConfig.username,
    password:dbConfig.password,
    database:dbConfig.dbName
}

var connection = mysql.createConnection(mysqlOpt);

exports['Establish DB connection'] = function(test){

    connection.connect(function(err){

        test.equal(err,null,'Cannot Connect To Database!');

        test.done();

    });
}

exports['Test SQL'] = {

    'Test SQL success(insert)': function(test){

        var query = 'INSERT INTO TestTable (FirstName, LastName, Age) VALUES ("Sardo", "Ip", "21")';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.equal(err,null,'The result should be success.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL fail(insert)': function(test){

        var query = 'Hello World';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL success(select)': function(test){

        var query = 'SELECT * FROM TestTable';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.equal(err,null,'The result should be success.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL failed(select)': function(test){

        var query = 'SELECT * FROM Hello';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },
    'Test SQL success(update)': function(test){

        var query = 'UPDATE TestTable SET FirstName ="Hiei" WHERE FirstName = "Sardo"';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.equal(err,null,'The result should be success.');
            test.ok(result.affectedRows !== 0,'The affectedRows should not be 0.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL failed(update)': function(test){

        var query = 'UPDATE Test SET FirstName ="Hiei" WHERE "Hello" = "S"';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');

            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL success(delete)': function(test){

        var query = 'DELETE FROM TestTable Where FirstName = "Hiei"';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(result.affectedRows !== 0,'The affectedRows should not be 0.');
            test.equal(err,null,'The result should be success.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL failed(delete)': function(test){

        var query = 'DELETE FROM Test Where FirstName = "Sardo"';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },
}

    exports['Terminate DB connection'] = function(test){

        connection.end(function(err){

            test.equal(err,null,'Cannot Close Connection !');

            test.done();

        });
}

