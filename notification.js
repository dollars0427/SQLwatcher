//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('sendNotification');
var promise = require('promised-io');
var mailer = require('emailjs');

/**
 *
 * Send notification mail.
 *
 * @param {object} mailConneciton
 * @param {object} mailOpt
 * @param {function} callback
 * @param {object} p
 *
 */

function sendMail(mailConnection,mailOpt, callback) {

    mailConnection.send(mailOpt, callback);
}

/**
 *
 * Retry send mail action with promise seq.
 *
 * @param {function} action
 * @return {object} pRetry
 *
 */

function retrySendMail(action){

    var funList = [];

    for (var i = 0; i < 2; i++) {

        funList.push(action);
    }

    var pRetry = promise.seq(funList, {
            mailConnection: mailConnection,
            mailOpt: opt,
            retry: true
        });

        return pRetry;
}

module.exports = {
	sendMail: sendMail
    retrySendMail:retrySendMail
}
