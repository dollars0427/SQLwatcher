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

function _sendMail(opt, callback) {

	var mailConnection = opt['mailConneciton'];
	var mailOpt = opt['mailOpt'];

	mailConnection.send(mailOpt, callback);
}

/**
 *
 * Receive callback function which will send email,
 * then retry it with promise seq.
 * @param {object} mailConnection
 * @param {object} mailOpt
 * @param {function} callback
 * @return {object} pRetry
 *
 */

function sendMail(mailConnection, mailOpt, retry, callback) {

	var funList = [];

	for (var i = 0; i < retry; i++) {

		funList.push(callback);
	}

	var pRetry = promise.seq(funList, {
		mailConnection: mailConnection,
		mailOpt: mailOpt,
		retry: retry
	});

	return pRetry;
}

module.exports = {
	_sendMail: _sendMail,
	sendMail: sendMail,

}
