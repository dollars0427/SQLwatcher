'use strict';

//Load Config File
var fs = require('fs');
var settingFile = JSON.parse(fs.readFileSync('../config/setting.json'));

var mailConfig = settingFile['mail'];

//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('unit-test');

var server = email.server.connect({
    user:mailConfig.server.user,
    password:mailConfig.server.password,
    host:mailConfig.server.host,
    port:mailConfig.server.port,
    ssl:mailConfig.server.ssl,
    tls:mailConfig.server.tls
});

exports['Test Email'] = {

    'Test alive messages success(insert)': function(test){

    var opt = {   
        text:    mailConfig.alive.text, 
        from:    mailConfig.alive.from, 
        to:      mailConfig.alive.to,
        subject: mailConfig.alive.subject
    };

        });
    },

