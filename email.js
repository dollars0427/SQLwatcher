//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('Logging');

function sendAliveMail (connection,opt,callback){

    logger.debug('Sending Alive Mail......');

    connection.send(opt,callback);
}

function sendWarningMail(connection,opt,callback){

    logger.debug('Sending Warning Mail......');

    connection.send(opt,callback);
}

module.exports = {
    sendAliveMail:sendAliveMail,
    sendWarningMail:sendWarningMail
}
