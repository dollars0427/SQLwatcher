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

var mailConfig = nconf.get('mail');

var notification = require('../notification');

var connection = mailer.server.connect({
	user: mailConfig.server.user,
	password: mailConfig.server.password,
	host: mailConfig.server.host,
	port: mailConfig.server.port,
	ssl: mailConfig.server.ssl,
	tls: mailConfig.server.tls
});

exports['Test Notification'] = {

	'Test send alive mail success': function(test) {

		var opt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		notification.sendMail(connection, opt, function(err, mail) {

			test.equal(err, null, 'The result should be success.');
			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},

	'Test send warning mail success': function(test) {

		var opt = {
			text: mailConfig.dead.text,
			from: mailConfig.dead.from,
			to: mailConfig.dead.to,
			subject: mailConfig.dead.subject
		};

		notification.sendMail(connection, opt, function(err, mail) {

			test.equal(err, null, 'The result should be success.');
			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},

	'Test send alive mail failed(wrong connection setting)': function(test) {

		var connection = mailer.server.connect({
			user: mailConfig.server.user,
			password: mailConfig.server.password,
			host: 'stmp.testing.com',
			port: mailConfig.server.port,
			ssl: mailConfig.server.ssl,
			tls: mailConfig.server.tls
		});

		var opt = {
			text: mailConfig.alive.text,
			from: mailConfig.alive.from,
			to: mailConfig.alive.to,
			subject: mailConfig.alive.subject
		};

		notification.sendMail(connection, opt, function(err, mail) {

			test.ok(err != null, 'The result should be failed.');

			logger.error(err);

			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},

	'Test send warning mail failed(wrong connection setting)': function(test) {

		var connection = mailer.server.connect({
			user: mailConfig.server.user,
			password: mailConfig.server.password,
			host: 'stmp.testing.com',
			port: mailConfig.server.port,
			ssl: mailConfig.server.ssl,
			tls: mailConfig.server.tls
		});

		var opt = {
			text: mailConfig.dead.text,
			from: mailConfig.dead.from,
			to: mailConfig.dead.to,
			subject: mailConfig.dead.subject
		};

		notification.sendMail(connection, opt, function(err, mail) {

			test.ok(err != null, 'The result should be failed.');

			logger.error(err);

			logger.debug('Sended Messages: ', mail);

			test.done();

		});
	},
}
