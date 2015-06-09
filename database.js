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

        r['record'] = result;

        callback(null,r);

    });
}

/**
 * Receive mysql query and result, check the record num of result is correct.
 *
 * @Param {String} query
 * @Param {Object['affectedRows','record']} result
 * @Param {Number} defaultSelectRec
 * @Param {Number} defaultUpdateRec
 * @Param {Number} rec
 * @Return {Bool} false
 * @Return {Bool} true
 *
 */


function checkRecordNum(query,result,defaultSelectRec,defaultUpdateRec,rec){

    var selectStatement = query.search("SELECT");
    var updateStatement = query.search("UPDATE");

    if(rec && selectStatement === 0 && result['record'].length !== rec){

        logger.error('Detected Error! ', 'Affcted Number of record not match! It must be ' + rec);

         return false;
     }

     if(rec && updateStatement === 0 && result['affectedRows'] !== rec){

        logger.error('Detected Error! ', 'Affcted Row not match! It must be ' + rec);

        return false;
    }

    if(!rec && selectStatement === 0 && result['record'].length !== defaultSelectRec){

        logger.error('Detected Error! ', 'Number of record not match! It must be ' + defaultSelectRec);

        return false;
    }

    if(!rec && updateStatement === 0 && result['affectedRows'] !== defaultUpdateRec){

        logger.error('Detected Error! ', 'Affcted Row not match! It must be ' + defaultUpdateRec);

        return false;
    }

    return true;
}

module.exports = {

    excuteMySQLQuery:excuteMySQLQuery,
    checkRecordNum:checkRecordNum
}
