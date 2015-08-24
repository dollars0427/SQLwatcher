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
 *
 */

function sendMail(mailConnection,mailOpt, callback) {

    mailConnection.send(mailOpt, callback);
}

module.exports = {
	sendMail: sendMail
}
