//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');

function excuteMySQLQuery (db,query,callback){

    /**
     * Receive the database connection, query and callback function, 
     * Then show the query which will be test at first.
     * After that, excute the query.
     * If the result have error, return the error,
     * Else if the result have affectedRows, save it in r return it.
     * Else,it will return null.
     * */

    logger.debug('Testing Query:', query);


    db.query(query,function(err,result){


        if(err){
            callback(err);
            return;
        }


        var r = {affectedRows :0};

        if(result.affectedRows){

            r['affectedRows'] = result['affectedRows'];

        }

        callback(null,r);

    });
}

module.exports = {

    excuteMySQLQuery:excuteMySQLQuery
}
