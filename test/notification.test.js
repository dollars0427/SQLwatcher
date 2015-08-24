'use strict';

//Require Module
var fs = require('fs');
var nconf = require('nconf');
nconf.argv()
	.env()
	.file({
		file: './config/setting.json'
	})

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');
var mailer = require('emailjs');
var promise = require('promised-io');
var mailConfig = nconf.get('mail');

var notification = require('../notification');

var mailConneciton = mailer.server.connect({
	user: mailConfig.server.user,
	password: mailConfig.server.password,
	host: mailConfig.server.host,
	port: mailConfig.server.port,
	ssl: mailConfig.server.ssl,
	tls: mailConfig.server.tls
});

exports['Test Send Mail'] = {

	'Test send alive mail success': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

        var opt = {mailConneciton:mailConneciton,mailOpt:mailOpt};

		notification._sendMail(opt, function(err, mail) {

			test.equal(err, null, 'The result should be success.');
			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},

	'Test send warning mail success': function(test) {

		var mailOpt = {
			text: mailConfig.dead.text,
			from: mailConfig.dead.from,
			to: mailConfig.dead.to,
			subject: mailConfig.dead.subject
		};

        var opt = {mailConneciton:mailConneciton,mailOpt:mailOpt};

		notification._sendMail(opt, function(err, mail) {

			test.equal(err, null, 'The result should be success.');
			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},

	'Test send alive mail failed(wrong mailConneciton setting)': function(test) {

		var mailConneciton = mailer.server.connect({
			user: mailConfig.server.user,
			password: mailConfig.server.password,
			host: 'stmp.testing.com',
			port: mailConfig.server.port,
			ssl: mailConfig.server.ssl,
			tls: mailConfig.server.tls
		});

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

        var opt = {mailConneciton:mailConneciton,mailOpt:mailOpt};

		notification._sendMail(opt, function(err, mail) {

			test.ok(err != null, 'The result should be failed.');

			logger.error(err);

			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},

	'Test send warning mail failed(wrong mailConneciton setting)': function(test) {

		var mailConneciton = mailer.server.connect({
			user: mailConfig.server.user,
			password: mailConfig.server.password,
			host: 'stmp.testing.com',
			port: mailConfig.server.port,
			ssl: mailConfig.server.ssl,
			tls: mailConfig.server.tls
		});

		var mailOpt = {
			text: mailConfig.dead.text,
			from: mailConfig.dead.from,
			to: mailConfig.dead.to,
			subject: mailConfig.dead.subject
		};

        var opt = {mailConneciton:mailConneciton,mailOpt:mailOpt};

		notification._sendMail(opt, function(err, mail) {

			test.ok(err != null, 'The result should be failed.');

			logger.error(err);

			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},
}

exports['Test Retry Mail'] = function(test) {

    var opt = {
        text: mailConfig.alive.text,
        from: mailConfig.alive.from,
        to: mailConfig.alive.to,
        subject: mailConfig.alive.subject
    };

	function testing(opt) {

		var p = new promise.defer();

        opt['retry'] = opt['retry'] -1;

        logger.debug(opt['retry']);

		p.resolve(opt);

		return p;

	}

    var retry = 3;

	var pRetry= notification.sendMail(mailConneciton,opt,retry,testing);

    promise.when(pRetry,function(result){

        logger.debug('Retry Time :' + result['retry']);

        test.equal(result['retry'], 0 , 'The result should be 0.');

        test.done();

    });

}
