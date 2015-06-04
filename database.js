//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');

/**
 * Excute mysql query and return the result.
 *
 * @Param {Object} db
 * @Param {String} query
 * @Param {function} callback
 * @Return {Object['affectedRows']} r
 * @Return {Object} err
 */

function excuteMySQLQuery (db,query,callback){

    logger.debug('Testing Query:', query);

    db.query(query,function(err,result){

        //If the result have error, return the error

        if(err){
            callback(err);
            return;
        }


        var r = {affectedRows :0};
        //If the result have affectedRows, save it in r return to be a result.
        if(result.affectedRows){

            r['affectedRows'] = result['affectedRows'];

        }

        callback(null,r);

    });
}

module.exports = {

    excuteMySQLQuery:excuteMySQLQuery
}
