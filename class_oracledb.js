'use strict';
var oracledb = require('oracledb');
var config = {
	dbowner: 'ZHNJ.',
	dbconn: {
		user: 'huanbao',
		password: 'huanbao!@#321',
		connectString: 'ORCL_HB'
		//mv ./tnsnames.ora /etc/tnsnames.ora
	}
};

exports.createTester = function() {
	return new Tester();
};

function Tester() {

}

Tester.prototype = {
	setting:function(params){
		config.dbconn = params;
	},
	getting:function(){
		return config;
	},
	connectTest:function(callback){
		oracledb.getConnection(
			config.dbconn,
			function(err, connection) {
				if(err) {
					if(typeof callback == 'function') {
						callback(err.message);
					}
					return;
				}
				
				if(typeof callback == 'function') {
					callback('connected');
				}
				
				// 释放链接
				connection.release(function(err) {
					console.log('connection release.');
					if(err) {
						console.error(err.message);
					}
				});
			});
	},
	query: function(sql, params, callback) {
		//console.log('o-sql:>>>',sql);
		oracledb.getConnection(
			config.dbconn,
			function(err, connection) {
				if(err) {
					if(typeof callback == 'function') {
						callback(null, err.message);
					}
					return;
				}
				connection.execute(
					sql, params,
					function(err, result) {
						if(err) {
							if(typeof callback == 'function') {
								callback(null, err.message);
							}
						} else {
							if(typeof callback == 'function') {
								callback(result.rows, null);
							}
						}
						// 释放链接
						connection.release(function(err) {
							console.log('connection release.');
							if(err) {
								console.error(err.message);
							}
						});
					});
			});
	}
};

//var test = new Tester();
//test.query("select * from " + config.dbowner + "WATERFACTORY", [], function(rows,msg) {
//	console.log(rows,msg);
//});