//Require Module

var log4js = require('log4js');
var logger = log4js.getLogger('Logging');
var mysql = require('mysql');

var promise = require('promised-io');
var moment = require('moment-timezone');
var when = promise.when;
var fs = require('fs');
var nconf = require('nconf');

var settingPath = process.argv[2];
var queryListPath = process.argv[3];

if (!settingPath || !queryListPath) {
	printUsage();
	process.exit(1);
}
nconf.argv()
	.env()
	.file({
		file: settingPath
	})

var database = require('./database');
var notification = require('./notification');
var processTimes = require('./processtimes');
var sendNotification = notification.sendNotification;

function printUsage() {

	var out = "Usage: " + process.argv[1] + " [Setting file] [Query list file]"

	console.log(out);
}

var queryListFile = JSON.parse(fs.readFileSync(queryListPath));

var dbConfig = nconf.get('database');
var jobConfig = queryListFile['job'];
var selectRecordConfig = queryListFile['defaultSelectRec'];
var updateRecordConfig = queryListFile['defaultUpdateRec'];

var timerConfig = nconf.get('timer');
var mailConfig = nconf.get('mail');
var notiConfig = nconf.get('notification');
var httpConfig = nconf.get('http');

var defaultSelectRec = 1;
var defaultUpdateRec = 1;

if (!isNaN(selectRecordConfig)) {

	defaultSelectRec = queryListFile['defaultSelectRec'];
}

if (!isNaN(updateRecordConfig)) {

	defaultUpdateRec = queryListFile['defaultUpdateRec'];
}


var checkTimeFormat = processTimes.checkTimeFormat;
var getTimeMs = processTimes.getTimeMs;
var getInitTime = processTimes.getInitTime;
var checkKeepAliveTime = processTimes.checkKeepAliveTime;

var mysqlOpt = {
	host: dbConfig.host,
	port: dbConfig.port,
	user: dbConfig.username,
	password: dbConfig.password,
	database: dbConfig.dbname
}

var connectionOpt = {
	user: mailConfig.server.user,
	password: mailConfig.server.password,
	host: mailConfig.server.host,
	port: mailConfig.server.port,
	ssl: mailConfig.server.ssl,
	tls: mailConfig.server.tls
};

var workerFree = true;

var lastExecute = 0;

var lastAliveTime = null;

var time = timerConfig.repeattime;

var keepAliveTimes = timerConfig.keepalivetimes;

var timeZone = timerConfig.timezone;


//Convert the keepAliveTimes to ms and sort it.

for (var i = 0; i < keepAliveTimes.length; i++) {

	var keepAliveTime = keepAliveTimes[i];

	checkTimeFormat(keepAliveTime);

	var keepAliveTimeMs = getTimeMs(keepAliveTime);

	keepAliveTimes[i] = keepAliveTimeMs;

}

keepAliveTimes.sort();

setInterval(runSQL, 500);

/**
 *Check the worker status and lock it.
 *
 * @return {bool} true
 *
 */

function getLock() {

	//If the worker status is not free, return false represent lock failed.

	if (!workerFree) {

		return false;
	}

	//If the worker status is free, lock it and return true represent lock success.

	workerFree = false;

	return true;
}

/**
 * Reset last execute and set worker free
 *
 * @param {boolean} reset
 *
 */

function release(reset) {

	//If reset is defined, reset the lastExecute time

	if (reset) {

		lastExecute = new Date().getTime();
	}

	//Set worker status to free.

	workerFree = true;
}

/*
 *Check current time, if it match the setted time will conncet to database.
 */

function runSQL() {

	if (!getLock()) {

		return;
	}

	/*
	 * If the difference of current time and last execute time is smaller
	 * than setted time, run release to reset the lastExecute time and exit.
	 */

	var now = new Date().getTime();

	if (now - lastExecute < time) {

		release();

		return;

	}

	var dbConnection = mysql.createConnection(mysqlOpt);

	function connectDatabase() {

		var p = new promise.defer();

		dbConnection.connect(function(err) {

			if (err) {
				logger.error('Cannot Connect To Database!', err);
				sendNotification({
					time: new Date(),
					err: new Error(err),
				});

				release(true);

				return;
			}

			logger.info('Connected to database.');

			p.resolve();

		});

		return p;
	}

	/**
	 *
	 * Get query from queryList from the index in the opt object,
	 * then excute it.
	 *
	 * @param {object["idx"]} opt
	 *
	 */

	function _runSQL(opt) {

		var p = new promise.defer();

		//Get query from queryList by the index.

		var query = jobConfig[opt["idx"]].sql;
		var rec = jobConfig[opt["idx"]].rec;

		if (!query) {

			p.resolve();

			return p;
		}

		database.excuteMySQLQuery(dbConnection, query, function(err, result) {

			if (err) {

				//If Detected any error, reject the promise with a object
				//which have time,error and excuted query.

				logger.error('Detected Error! ', err);

				p.reject({
					time: new Date(),
					err: new Error(err),
					sql: query
				});

				return;
			}

			if (isNaN(rec) || rec === null) {

				var checkRecordCountResult = database.checkRecordCount(result, defaultSelectRec, defaultUpdateRec);
				if (checkRecordCountResult === false) {

					p.reject({
						time: new Date(),
						err: new Error('REC_COUNT_NOT_MATCH'),
						sql: query
					});

					return;
				}

				logger.info('SQL success:', query);

				p.resolve({
					idx: opt["idx"] + 1
				});

				return p;

			}

			var checkRecordCountResult = database.checkRecordCount(result, null, null, rec);

			if (checkRecordCountResult === false) {

				p.reject({
					time: new Date(),
					err: 'The select/update result do not match default value.',
					sql: query
				});

				return;
			}

			//resolve the promise with the opt object which have index + 1.
			logger.info('SQL success:', query);

			p.resolve({
				idx: opt["idx"] + 1
			});

		});

		return p;

	}

	function complete() {

		/**
		 * After finish all the task, end the database connection and release the worker.
		 * */

		var p = new promise.defer();

		dbConnection.end(function(err) {

			if (err) {

				logger.error(err);

				connection.end();
			}

			logger.info('Complete!');

			release(true);

			p.resolve();

		});

		return p;

	}

	function runQueries() {

		var p = new promise.defer();

		//If all of query can be excute successful,Run runSucess.

		function runSucess() {

			/**
			 *Save the lastSucess time to opt amd resolve with this object
			 **/

			logger.warn('Run Sucess!');


			var opt = {
				time: new Date()
			};

			p.resolve(opt);

		}

		//If there are any query can not be excute successful, Run runFailed.

		function runFailed(opt) {

			/**
			 * Show the error and query in the object which called opt,
			 * then resolve it with this object.
			 * */

			logger.warn('Run Failed:');
			logger.warn(opt.err);
			logger.warn(opt.sql);

			p.resolve(opt);

		}

		// Create a function list and use promise.when to run it by order.

		var funList = [];

		for (var i = 0; i < jobConfig.length; i++) {

			funList.push(_runSQL);
		}

		var pSQL = promise.seq(funList, {
			idx: 0
		});

		when(pSQL, runSucess, runFailed);

		return p;
	}

	function sendHttp(sqlResult) {

		var p = new promise.defer();

		if (notiConfig.type.indexOf('http') !== -1) {

			var param = {};

			if (sqlResult['err']) {

				var type = httpConfig.dead.type;
				var baseParam = httpConfig.dead['baseparam'];
				var notiParam = httpConfig.dead['notiparam'];
				var method = httpConfig.dead.method;
				var url = httpConfig.dead.callurl;

				if (method === 'get') {

					url = url + '?';

					for (var i = 0; i < baseParam.length; i++) {

						var baseKey = Object.keys(baseParam[i])[0];
						var baseValue = baseParam[i][baseKey];

						url = url + baseKey + '=' + baseValue + '&';
					}

					var opt = {
						url: url,
						type: type
					}
				} else {

					for (var i = 0; i < baseParam.length; i++) {

						var baseKey = Object.keys(baseParam[i])[0];
						var baseValue = baseParam[i][baseKey];

						param[baseKey] = baseValue;
					}

					var notiKey = Object.keys(notiParam)[0];
					var notiValue = notiParam[notiKey];

					param[notiKey] = notiValue;

					var opt = {
						url: url,
						param: param,
						type: type
					}
				}

				var pRetry = notification.sendHttp(opt, 3);

				when(pRetry, function(result) {

					logger.debug('Result: ', result);

					p.resolve(sqlResult);

				});

				return p;
			}

			var type = httpConfig.alive.type;
			var baseParam = httpConfig.alive['baseparam'];
			var notiParam = httpConfig.alive['notiparam'];
			var method = httpConfig.alive.method;
			var url = httpConfig.alive.callurl;

			if (method === 'get') {

				url = url + '?';

				for (var i = 0; i < baseParam.length; i++) {

					var baseKey = Object.keys(baseParam[i])[0];
					var baseValue = baseParam[i][baseKey];

					url = url + baseKey + '=' + baseValue + '&';
				}

				var opt = {
					url: url,
					type: type
				}
			} else {
				for (var i = 0; i < baseParam.length; i++) {

					var baseKey = Object.keys(baseParam[i])[0];
					var baseValue = baseParam[i][baseKey];

					param[baseKey] = baseValue;
				}

				var notiKey = Object.keys(notiParam)[0];
				var notiValue = notiParam[notiKey];

				param[notiKey] = notiValue;

				var opt = {
					url: url,
					param: param,
					type: type
				}
			}

			var pRetry = notification.sendHttp(opt, 3);

			when(pRetry, function(result) {

				logger.debug('Result: ', result);

				p.resolve(sqlResult);

			});

			return p;
		}

		p.resolve(sqlResult);
		return p;
	}

	//Create a chain of function, let the script can run the function by order.
	var chain = new promise.defer();
	chain
		.then(connectDatabase)
		.then(runQueries)
		.then(sendHttp)
		.then(complete)

	chain.resolve();
}
