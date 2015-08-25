//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('sendNotification');
var promise = require('promised-io');
var mailer = require('emailjs');

/**
 *
 * Retry send mail action it with promise seq.
 * @param {object} connectionOpt
 * @param {object} mailOpt
 * @param {number} retry
 * @return {object} pRetry
 *
 */

function sendMail(connectionOpt, mailOpt, retry) {

	var funList = [];

	for (var i = 0; i < retry; i++) {

		funList.push(_sendMail);
	}

	var opt = {
		connectionOpt: connectionOpt,
		mailOpt: mailOpt,
		retry: retry
	};

	var pRetry = promise.seq(funList, opt);

	return pRetry;
}

/**
 *
 * Send notification mail.
 *
 * @param {object} opt
 * @return {object} p
 *
 */

function _sendMail(opt) {

	var p = promise.defer();

	if (!opt['retry']) {

		opt['retry'] = 0;

		p.resolve(opt);

		return p;

	}

	var mailOpt = opt['mailOpt'];
	var connectionOpt = opt['connectionOpt'];

	var mailConnection = mailer.server.connect({
		user: connectionOpt.user,
		password: connectionOpt.password,
		host: connectionOpt.host,
		port: connectionOpt.port,
		ssl: connectionOpt.ssl,
		tls: connectionOpt.tls
	});

	mailConnection.send(mailOpt, function(err, mail) {

		if (err) {

			logger.error(err);

			opt['retry'] -= 1;

			p.resolve(opt);

			return;
		}

		opt['mail'] = mail;

		opt['retry'] = 0;

		p.resolve(opt);
	});

	return p;
}

module.exports = {
	_sendMail: _sendMail,
	sendMail: sendMail,

}
