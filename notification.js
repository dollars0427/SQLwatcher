//Require Module
var log4js = require('log4js');
var logger = log4js.getLogger('sendNotification');
var promise = require('promised-io');
var mailer = require('emailjs');

/**
 *
 * Check the SQL excute reuslt and send notification mail.
 *
 * @param {object(time,err,sql,mailConfig)} result
 *
 */

function sendNotification(result) {

	var p = new promise.defer();

	var mailConfig = result['mailConfig'];

	var mailConnection = mailer.server.connect({
		user: mailConfig.server.user,
		password: mailConfig.server.password,
		host: mailConfig.server.host,
		port: mailConfig.server.port,
		ssl: mailConfig.server.ssl,
		tls: mailConfig.server.tls
	});

	//If the result of excute sql have error,
	//send warning mail with the text in config,result time and excuted query.

	if (result['err']) {

		var text = mailConfig.dead.text + ' \n' + ' \n'
        + 'Result Time: ' + result['time'] + ' \n' + ' \n'
        + ' Error: ' + result['err'] + '\n' + ' \n Excuted Query:'
        + result['sql'];

		var opt = {
			text: text,
			from: mailConfig.dead.from,
			to: mailConfig.dead.to,
			subject: mailConfig.dead.subject
		};

		logger.info('Sending Warning Mail......');

		var funList = [];

		for (var i = 0; i < 3; i++) {

			funList.push(sentMail);
		}

		var pSent = promise.seq(funList, {
			mailConnection: mailConnection,
			mailOpt: opt,
			retry: true
		});

		when(pSent, complete);

		return p;
	}

	var text = mailConfig.alive.text + ' \n' +
		' \n' + 'Last Sucess Time: ' + result['time'] + ' \n'

	var opt = {
		text: text,
		from: mailConfig.alive.from,
		to: mailConfig.alive.to,
		subject: mailConfig.alive.subject
	};

	//call the check alive time function to
	//check the last sucess time of excute query is match the keep alive time.

	var lastSuccessTime = result['time'].getTime();

	try {
		lastAliveTime = lastAliveTime.getTime();

	} catch (err) {}

	var checkKeepAliveTimeSuccess =
		checkKeepAliveTime(keepAliveTimes, lastAliveTime, lastSuccessTime, timeZone);

	//If checkTimeSuccess had return anything, send alive mail.

	if (checkKeepAliveTimeSuccess) {

		logger.info('Sending Alive Mail......');

		var funList = [];

		for (var i = 0; i < 3; i++) {

			funList.push(sentMail);
		}

		logger.info(checkKeepAliveTimeSuccess);

		lastAliveTime = new Date();

		var pSent = promise.seq(funList, {
			mailConnection: mailConnection,
			mailOpt: opt,
			retry: true
		});

		when(pSent, complete);

	} else {

		p.resolve();
	}

	return p;
}

function sendMail(opt) {

    var p = new promise.defer();

    if (!opt['retry']) {

        p.resolve({
            retry: false
        });

        return p;
    }

    var mailConnection = opt.mailConnection;
    var mailOpt = opt.mailOpt;

    mailConnection.send(mailOpt, _send);

    function _send(err, mail) {

        if (err) {

            logger.error(new Error(err));

            p.resolve(opt);

            return;
        }

        logger.info(mail);

        opt['retry'] = false;

        p.resolve(opt);

    }

    return p;
}

module.exports = {
	sendNotification: sendNotification;
}
