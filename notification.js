//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('sendNotification');
var promise = require('promised-io');
var mailer = require('emailjs');

/**
 *
 * Send notification mail.
 *
 * @param {object} opt
 * @param {function} callback
 *
 *
 */

function sendMail(opt,callback) {

    var mailConnection = opt['mailConneciton'];
    var mailOpt= opt['mailOpt'];

    mailConnection.send(mailOpt, callback);
}

/**
 *
 * Retry send mail action with promise seq.
 * @param {object} mailConnection
 * @param {object} mailOpt
 * @param {function} action
 * @return {object} pRetry
 *
 */

function retrySendMail(mailConnection,mailOpt,action){

    var funList = [];

    for (var i = 0; i < 3; i++) {

        funList.push(action);
    }

    var pRetry = promise.seq(funList, {
            mailConnection: mailConnection,
            mailOpt: mailOpt,
            retry: 0
        });

        return pRetry;
}

module.exports = {
	sendMail: sendMail,
    retrySendMail:retrySendMail,

}
