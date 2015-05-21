'use strict';

//Load Config File
var fs = require('fs');
var settingFile = JSON.parse(fs.readFileSync('../config/setting.json'));

var mailConfig = settingFile['mail'];

//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');

var mailer = require('emailjs');

var connection = mailer.server.connect({
    user:mailConfig.server.user,
    password:mailConfig.server.password,
    host:mailConfig.server.host,
    port:mailConfig.server.port,
    ssl:mailConfig.server.ssl,
    tls:mailConfig.server.tls
});

var email = require('../email');

exports['Test Email'] = {

    'Test alive messages success': function(test){

        var opt = {   
            text:    mailConfig.alive.text, 
            from:    mailConfig.alive.from, 
            to:      mailConfig.alive.to,
            subject: mailConfig.alive.subject
        };

        var result = email.sendAliveMail(connection,opt,function(err,email){

            test.equal(err,null,'The result should be success.');
            logger.debug('Sended Messages: ',email);

            test.done();
        });

    },

    'Test alive messages failed': function(test){

        var connection = mailer.server.connect({
            user:mailConfig.server.user,
            password:mailConfig.server.password,
            host:'stmp.testing.com',
            port:mailConfig.server.port,
            ssl:mailConfig.server.ssl,
            tls:mailConfig.server.tls
        });

        var opt = {   
            text:    mailConfig.alive.text, 
            from:    mailConfig.alive.from, 
            to:      mailConfig.alive.to,
            subject: mailConfig.alive.subject
        };

        email.sendAliveMail(connection,opt,function(err,email){
            test.ok(err != null,'The result should be failed.');
            logger.debug('Sended Messages: ',email);
            logger.error(err);
            test.done();
        });

    },
   'Test warning messages success': function(test){

        var opt = {   
            text:    mailConfig.dead.text, 
            from:    mailConfig.dead.from, 
            to:      mailConfig.dead.to,
            subject: mailConfig.dead.subject
        };

        var result = email.sendWarningMail(connection,opt,function(err,email){

            test.equal(err,null,'The result should be success.');
            logger.debug('Sended Messages: ',email);

            test.done();
        });

    },

    'Test warning messages failed(wrong connection setting)': function(test){

        var connection = mailer.server.connect({
            user:mailConfig.server.user,
            password:mailConfig.server.password,
            host:'stmp.testing.com',
            port:mailConfig.server.port,
            ssl:mailConfig.server.ssl,
            tls:mailConfig.server.tls
        });

        var opt = {   
            text:    mailConfig.dead.text, 
            from:    mailConfig.dead.from, 
            to:      mailConfig.dead.to,
            subject: mailConfig.dead.subject
        };

        var result = email.sendWarningMail(connection,opt,function(err,email){

            test.ok(err != null,'The result should be failed.');
            logger.error(err);
            logger.debug('Sended Messages: ',email);

            test.done();
        });

    },
}

