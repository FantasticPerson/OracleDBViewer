/****/
var isc = false;
// 以下代码用于维持进程，当子进程退出时，5秒后自动重新开启进程。
if(process.argv.length > 1) {
	// 这个if肯定会成立，其作用是为了把内部的变量的作用范围和外部分离开来，避免冲突
	var newArgv = [];
	var ifChild = false;
	process.argv.forEach(function(val, index, array) {
		if(val == '-run_in_child') {
			isc = ifChild = true;
		} else if(index > 0) newArgv.push(val); //第0个元素是命令/程序路径
	});
	if(!ifChild) {
		newArgv.push('-run_in_child'); //子进程需要一个命令标志：run_in_child
		start();

		function start() {
			console.log('master process is running.');
			var cp = require('child_process').spawn(process.argv[0], newArgv);
			cp.stdout.pipe(process.stdout);
			cp.stderr.pipe(process.stderr);
			cp.on('exit', function(code) {
				if(code == 0) {
					//正常退出进程
					process.exit(0);
					return;
				}
				//可以在此添加进程意外退出的处理逻辑
				delete(cp);
				console.log('child process exited with code ' + code);
				setTimeout(start, 5000);
			});
		}
		//return;
	}
}

//console.log('[*---Debug---*]:'+isc);
//my code
var express = require('express')
	,app = express()
	,cors = require('cors')
	,port = 3996
	,http = require('http').Server(app)
	,oracleDb = require('./class_oracledb').createTester();
	
var bodyParser = require('body-parser');
if(isc){
	http.listen(port, function() {
		console.log('listening on *:'+port);
	});
}else{
	return;
}

var fs = require('fs');
function readFile(file){
	var data = fs.readFileSync(file,"utf-8");
	//console.log(data);
	return data;
}
function writeFile(file,data,callback){
	fs.writeFile(file, data, {encoding:'utf-8'}, callback);
}

//设置跨域访问
app.use(cors());
//json解析
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//静态资源
app.use(express.static(__dirname + '/src'));
app.use(express.static(__dirname + '/public'));
//默认index页面
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/src/index.html');
});

//数据库查询接口
app.get('/query', function(req, res) {
	console.log('/query',req.query);
	if(req.query){
		if(req.query.sqlExp){
			var sql = req.query.sqlExp;
			oracleDb.query(sql, [], function(rows, msg){
				if(rows!==null && rows.length>0){
					res.send(rows);
				}else{
					console.log(msg);
					res.send(msg);
				}
			});
		}
	}
});

//数据库连接配置
app.get('/readTns', function(req, res) {
	console.log('/readTns',req.query);
	if(req.query){
		if(req.query.user){
			var data = readFile('/etc/tnsnames.ora');
			if(data){
				res.send(data);
			}else{
				res.send('NO');
			}
		}
	}
});
app.post('/saveTns', function(req, res) {
	console.log('/saveTns',req.body);
	if(req.body){
		if(req.body.user){
			var user = req.body.user,
				pwd = req.body.pwd,
				configTxt = req.body.configTxt;
			
			writeFile('/etc/tnsnames.ora',configTxt,function(r){
				//console.log('/saveTns-writefile-callback',r);
				if(r==null){
					res.send('OK');
				}else{
					console.log(r);
					res.send('NO');
				}
			});
		}
	}
});
app.post('/testTnsConn', function(req, res) {
	console.log('/testTnsConn',req.body);
	if(req.body){
		if(req.body.connectString){
			var params = req.body;
			oracleDb.setting(params);
			oracleDb.connectTest(function(info){
				if(info=='connected'){
					res.send('OK');
				}else{
					res.send(info);
				}
			});
		}
	}
});

//接口
//环保空气
var Main = require('./HB_dbMain').mainInit();
Main.init(app);
//chart builder
var ctMain = require('./CHART_dbMain').mainInit();
ctMain.init(app);
//宽屏环保
var mainHuanbao = require('./main_huanbao').mainInit();
mainHuanbao.init(app);
