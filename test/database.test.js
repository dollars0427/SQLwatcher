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
    database:dbConfig.dbname
}

var connection = mysql.createConnection(mysqlOpt);

exports['Establish DB connection'] = function(test){

    connection.connect(function(err){

        test.equal(err,null,'Cannot Connect To Database!');

        test.done();

    });
},

exports['Drop and establish DB Table'] = {

    'Drop Table':function(test){

        var query = 'DROP TABLE TestTable;';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err === null || err.errno === 1051,'The table should be not found or result should be success.');

            test.done();

        });
    },

    'Create table':function(test){

        var query = 'CREATE TABLE TestTable(Firstname VARCHAR(30) NOT NULL,Lastname VARCHAR(30) NOT NULL,Age INT(100) NOT NULL)';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.equal(err,null,'The result should be success.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },   
},

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


    'Test SQL success(select with defaultSelectRec)': function(test){

        var defaultSelectRec = 1 

        var runQueryResult = {record:[{Hello:'Hello'}]};

        var result = database.checkRecordNum(runQueryResult,defaultSelectRec);

        test.equal(result,true,'The result should be true!');

        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL success(select with rec)': function(test){

        var query = 'SELECT * FROM TestTable';

        var rec = 1

        var runQueryResult = {record:[{Hello:'Hello'}]}

        var result = database.checkRecordNum(runQueryResult,null,null,rec);

        test.equal(result,true,'The result should be true!');

        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL failed(select)': function(test){

        var query = 'SELECT * FROM Hello';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL failed(select with defaultSelectRec)': function(test){

        var defaultSelectRec = 2

        var query = 'SELECT * FROM TestTable';

        var runQueryResult = {record:[{Hello:'Hello'}]}

        var result = database.checkRecordNum(runQueryResult,defaultSelectRec);

        test.equal(result,false,'The result should be false');

        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL failed(select with rec)': function(test){

        var rec = 2

        var query = 'SELECT * FROM TestTable';

        var runQueryResult = {record:[{Hello:'Hello'}]}

        var result = database.checkRecordNum(runQueryResult,null,null,rec);

        test.equal(result,false,'The result should be false');

        logger.debug('Excute Query Result: ',result);

        test.done();
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

    'Test SQL success(update with defaultUpdateRec)': function(test){

        var defaultUpdateRec = 1 

        var query = 'UPDATE TestTable SET FirstName ="Hiei" WHERE FirstName = "Sardo"';

        var runQueryResult = {affectedRows:1}

        var result = database.checkRecordNum(runQueryResult,null,defaultUpdateRec);

        test.equal(result,true,'The result should be true!');

        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL success(update with rec)': function(test){

        var rec = 1 

        var runQueryResult = {affectedRows:1}

        var result = database.checkRecordNum(runQueryResult,null,null,rec);

        test.equal(result,true,'The result should be true!');

        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL failed(update)': function(test){

        var query = 'UPDATE TestTable SET Name ="Hiei" WHERE FirstName = "Sardo"';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');

            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL failed(update with defaultUpdateRec)': function(test){

        var defaultUpdateRec = 1 

        var runQueryResult = {affectedRows:0}

        var result = database.checkRecordNum(runQueryResult,null,defaultUpdateRec);

        test.equal(result,false,'The result should be false!');

        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL failed(update with rec)': function(test){

        var rec = 1

        var runQueryResult = {affectedRows:0}

        var result = database.checkRecordNum(runQueryResult,null,null,rec);

        test.equal(result,false,'The result should be false!');

        logger.debug('Excute Query Result: ',result);

        test.done();
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

    'Test SQL success(delete with checkRecordCount)': function(test){

        var rec = 1;

        var runQueryResult = undefined;

        var result = database.checkRecordNum(runQueryResult,null,null,rec);

        test.equal(result,true,'The result should be success.');
        logger.debug('Excute Query Result: ',result);

        test.done();
    },

    'Test SQL failed(delete)': function(test){

        var query = 'DELETE FROM Test Where FirstName = "Sardo"';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.ok(err !== null,'The result should be failed.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL success(drop)': function(test){

        var query = 'DROP TABLE TestTable;';

        var result = database.excuteMySQLQuery(connection,query,function(err,result){

            test.equal(err,null,'The result should be success.');
            logger.debug('Excute Query Result: ',result);

            test.done();

        });
    },

    'Test SQL failed(drop)': function(test){

        var query = 'DROP TABLE TestTable;';

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

