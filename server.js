/****/
// 以下代码用于维持进程，当子进程退出时，5秒后自动重新开启进程。
if (process.argv.length > 1) {
// 这个if肯定会成立，其作用是为了把内部的变量的作用范围和外部分离开来，避免冲突
    var newArgv = [];
    var ifChild = false;
    process.argv.forEach(function (val, index, array) {
        if (val == '-run_in_child') {
            ifChild = true;
        }
        else if (index > 0) newArgv.push(val);//第0个元素是命令/程序路径
    });
    if (!ifChild) {
        newArgv.push('-run_in_child');//子进程需要一个命令标志：run_in_child
        start();
        function start() {
            console.log('master process is running.');
            var cp = require('child_process').spawn(process.argv[0], newArgv);
            cp.stdout.pipe(process.stdout);
            cp.stderr.pipe(process.stderr);
            cp.on('exit', function (code) {
                if (code == 0) {
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
        return;
    }
}

//my code
var crypto = require('crypto');
var express = require('express')
    , cors = require('cors')
    , app = express()
    , bodyParser = require('body-parser')
    , server = require('http').Server(app)
    , oracledb = require('oracledb')
    , port = 3998
    , modeler = require('./model').createModel()
    , tasker = require('./tasker').createTasker()
    , crawler = require('./crawler').createCrawler()
    , xlsxer = require('./xlsx').createXLSX()
    , tester = require('./dbtest').createTester();

var cache = {};
server.listen(port, function () {
    console.log('listening on *:', port);
});
//每天清晨4点清除缓存，释放内存
tasker.addTask('clearCache', function () {
    console.log('clearCache', (new Date()).pattern("yyyy-MM-dd HH:mm:ss"));
    modeler.cache = {};
    crawler.cache = {};
});
tasker.init();
/**
 * Web App Server Code
 */
//设置跨域访问
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))
// parse application/json
app.use(bodyParser.json())

app.use(express.static(__dirname + '/src'));

// 网络接口
var nginx_proxy = '*';
// 空气质量监测
// 默认请求,API说明
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/src/index.html');
});
// oracle查询
app.get(nginx_proxy + '/data', function (req, res) {
    var model = req.query.act,
        callback = req.query.callback,
        params = req.query;
    delete params['act'];
    delete params['callback'];
    var url = '/data?act=' + model;
    modeler.query(model, params, url, function (result) {
        if (callback) {
            res.send(';' + callback + '(' + result + ');');
        } else {
            res.send(result);
        }
    });
});
function checkParams(model, params) {
    var params = modeler.models[model]
}
// 天气查询
app.get(nginx_proxy + '/weather', function (req, res) {
    var callback = req.query.callback;
    crawler.getWeather('weather', function (result) {
        if (callback) {
            res.send(';' + callback + '(' + result + ');');
        } else {
            res.send(result);
        }
    });
});
// 地图查询
app.get(nginx_proxy + '/map', function (req, res) {
    var callback = req.query.callback;
    crawler.getCitys('mapaqi', function (result) {
        if (callback) {
            res.send(';' + callback + '(' + result + ');');
        } else {
            res.send(result);
        }
    });
});

// xlsx查询
app.get(nginx_proxy + '/xlsx', function (req, res) {
    var callback = req.query.callback;
    var model = req.query.act;
    var month = req.query.month;
    var data = xlsxer.query(model, month);
    var result = {Success: true, Data: data, Error: null};
    if (callback) {
        res.send(';' + callback + '(' + result + ');');
    } else {
        res.send(result);
    }
});

// sql查询
app.get(nginx_proxy + '/sql', function (req, res) {
    var callback = req.query.callback;
    var sql = req.query.sql;
    var params = req.query.params;
    params = params != undefined ? JSON.parse(params) : [];
    // if(sql!=undefined){
    //   tester.query(sql,params,function(data,error,metaData){
    //     if(error==null){
    //       res.send({Success:false,Data:data,MetaData:metaData,Error:null});
    //     }else{
    //       res.send({Success:false,Data:null,Error:error});
    //     }
    //   });
    // }else{
    //   res.send(';'+callback+'({Success:false,Data:null,Error:"参数错误"});');
    // }
    res.send(';' + callback + '({Success:false,Data:null,Error:"测试接口已经停用"});');
});

app.get(nginx_proxy + '/clearcache', function (req, res) {
    var key = req.query.key;
    var target = req.query.target;
    if (key !== 'trueway@2016-' + new Date().getDay()) {
        res.send('params error.');
        return
    }
    if (target === 'both') {
        modeler.cache = {};
        crawler.cache = {};
    } else if (target === 'model') {
        modeler.cache = {};
    } else if (target === 'crawl') {
        crawler.cache = {};
    }
    res.send(target + ': clear the cache.');
});


//new huanbao
//环保空气
var Main = require('./HB_dbMain').mainInit();
Main.init(app);


function md5(text) {
    return crypto.createHash('md5').update(text).digest('hex');
};

/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q) 可以用 1-2 个占位符
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * eg:
 * (new Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04
 * (new Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04
 * (new Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04
 * (new Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var week = {
        "0": "\u65e5",
        "1": "\u4e00",
        "2": "\u4e8c",
        "3": "\u4e09",
        "4": "\u56db",
        "5": "\u4e94",
        "6": "\u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "星期" : "") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}