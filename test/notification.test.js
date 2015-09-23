'use strict';

//Require Module
var nconf = require('nconf');
nconf.argv()
	.env()
	.file({
		file: './config/setting.json'
	})

var log4js = require('log4js');
var promise = require('promised-io');
var notification = require('../sqlwatcher/notification');

var logger = log4js.getLogger('unit-test');
var mailConfig = nconf.get('mail');

var http = require('http');

var connectionOpt = {
	user: mailConfig.server.user,
	password: mailConfig.server.password,
	host: mailConfig.server.host,
	port: mailConfig.server.port,
	ssl: mailConfig.server.ssl,
	tls: mailConfig.server.tls
};

exports['Test _sendHttp'] = {

	'Test _sendHttp success(get)': function(test) {

		var type = ['get'];

		var p = notification._sendHttp(type, '127.0.0.1:/test');

		p.then(function(result) {

			test.equal(result.statusCode, 200, 'The result should be success.');

			logger.debug('Result: ', result);

		});
	},

	'Test _sendHttp success(post)': function(test) {

		var type = ['post']

		var p = notification.sendHttp(type, '127.0.0.1:/test');

		p.then(function(result) {

			test.equal(result.statusCode, 200, 'The result should be success.');

			logger.debug('Result: ', result);

			test.done();

		});
	}
}

exports['Test _sendMail'] = {

	'Test _sendMail success with retry 1': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		var opt = {
			connectionOpt: connectionOpt,
			mailOpt: mailOpt,
			retry: 1
		};

		var p = notification._sendMail(opt);

		p.then(function(result) {

			test.ok(result !== undefined, 'The result should be success.');

			logger.debug('Sended Messages: ', result['mail']);

			test.done();

		});
	},

	'Test _sendMail success with retry 2': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		var opt = {
			connectionOpt: connectionOpt,
			mailOpt: mailOpt,
			retry: 2
		};

		var p = notification._sendMail(opt);

		p.then(function(result) {

			test.ok(result !== undefined, 'The result should be success.');

			logger.debug('Sended Messages: ', result['mail']);

			test.done();

		});
	}
}

exports['Test sendMail'] = {

	'Test sendMail success with retry 0': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		var pRetry = notification.sendMail(connectionOpt, mailOpt, 0);

		promise.when(pRetry, function(result) {

			test.ok(result['retry'] === 0, 'The retry number should be 0.');

			test.ok(result['mail'] == undefined, 'The mail should be undefined.');

			logger.debug('Sended Messages: ', result['mail']);

			test.done();
		});
	},

	'Test send mail success with retry 1': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		var pRetry = notification.sendMail(connectionOpt, mailOpt, 1);

		promise.when(pRetry, function(result) {

			test.ok(result['retry'] === 0, 'The retry number should be 0.', result);

			test.ok(result['mail'] !== undefined, 'The mail should not be undefined.');

			logger.debug('Sended Messages: ', result['mail']);

			test.done();
		});
	},

	'Test send mail success with retry 2': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		var pRetry = notification.sendMail(connectionOpt, mailOpt, 2);

		promise.when(pRetry, function(result) {

			test.ok(result['retry'] === 0, 'The retry number should be 0.', result);

			test.ok(result['mail'] !== undefined, 'The mail should not be undefined.');

			logger.debug('Sended Messages: ', result['mail']);

			test.done();
		});
	},

	'Test send alive mail retry 2(With error)': function(test) {

		var mailOpt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		var connectionOpt = {
			user: mailConfig.server.user,
			password: 'wrongpassword',
			host: mailConfig.server.host,
			port: mailConfig.server.port,
			ssl: mailConfig.server.ssl,
			tls: mailConfig.server.tls
		};

		var pRetry = notification.sendMail(connectionOpt, mailOpt, 2);

		promise.when(pRetry, function(result) {

			test.ok(result['retry'] === 0, 'The retry number should be 0.', result);

			test.ok(result['mail'] == undefined, 'The mail should be undefined.');

			logger.debug('Sended Messages: ', result['mail']);

			test.done();
		});
	},
}
