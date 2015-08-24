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

var mailConnection = mailer.server.connect({
	user: mailConfig.server.user,
	password: mailConfig.server.password,
	host: mailConfig.server.host,
	port: mailConfig.server.port,
	ssl: mailConfig.server.ssl,
	tls: mailConfig.server.tls
});

exports['Test _sendMail'] = {

	'Test send alive mail success': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

        var opt = {mailConnection:mailConnection,mailOpt:mailOpt,retry:1};

		var p = notification._sendMail(opt);

        p.then(function(result){

            test.ok(result !== undefined,'The result should be success.');

            logger.debug('Sended Messages: ', result);

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

        var opt = {mailConnection:mailConnection,mailOpt:mailOpt,retry:1};

		var p = notification._sendMail(opt);

        p.then(function(result){

            test.ok(result !== undefined,'The result should be success.');

            logger.debug('Sended Messages: ', result);

            test.done();

        });
	}
}

exports['Test sendMail'] = {

    'Test send alive mail success': function(test){

        var mailOpt = {
            text: mailConfig.alive.text,
            from: mailConfig.alive.from,
            to: mailConfig.alive.to,
            subject: mailConfig.alive.subject
        };

        var pRetry = notification.sendMail(mailConnection,mailOpt,3);

        promise.when(pRetry,function(result){

            test.ok(result['retry'] === 0 ,'The retry number should be 0.');

            test.ok(result['mail'] !== null ,'The mail should not be null.');

            logger.debug('Sended Messages: ', result['mail']);

            test.done();
        });
    },

    'Test send warning mail success': function(test){

        var mailOpt = {
            text: mailConfig.dead.text,
            from: mailConfig.dead.from,
            to: mailConfig.dead.to,
            subject: mailConfig.dead.subject
        };

        var pRetry = notification.sendMail(mailConnection,mailOpt,3);

        promise.when(pRetry,function(result){

            test.ok(result['retry'] === 0 ,'The retry number should be 0.');

            test.ok(result['mail'] !== null ,'The mail should not be null.');

            logger.debug('Sended Messages: ', result['mail']);

            test.done();
        });
    }
}
