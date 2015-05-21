//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');

function excuteMySQLQuery (db,query,callback){

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
