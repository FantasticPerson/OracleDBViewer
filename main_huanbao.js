'use strict';
exports.mainInit = function() {
	return new Main();
};

var request = require('request');
var post_HuanBao = __dirname+'/public/huanbao/Post_HuanBao';
var post_Manager = __dirname+'/public/huanbao/Post_Manager';
var get_maps_tile = __dirname+'/public/huanbao/MapTile';

function Main() {
	
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

Main.prototype = {
	// 初始化
	init:function(app){
		console.log('main-huanbao-init-------------->>>>>>>>>>>>>>>');
		this.app = app;
		this.apiList();
	},
	//http接口列表
	apiList:function(){
		this.postFileBackJson('/huanbao/Manager/Get_GYWR_TOP',post_Manager+'/Get_GYWR_TOP');
		this.postFileBackJson('/huanbao/Manager/Get_GY_SITE',post_Manager+'/Get_GY_SITE');
		this.postFileBackJson('/huanbao/Manager/Get_time',post_Manager+'/Get_time');
		this.postFileBackJson('/huanbao/Manager/Get_weather_year',post_Manager+'/Get_weather_year');
		this.postFileBackJson('/huanbao/Manager/Get_YDL',post_Manager+'/Get_YDL');
		this.postFileBackJson('/huanbao/Manager/Get_JS_FS',post_Manager+'/Get_JS_FS');
		this.postFileBackJson('/huanbao/Manager/Get_WQ_Station',post_Manager+'/Get_WQ_Station');
		this.postFileBackJson('/huanbao/Manager/Get_Obj_Station',post_Manager+'/Get_Obj_Station');
		this.postFileBackJson('/huanbao/Manager/Get_CantonAverageAQI',post_Manager+'/Get_CantonAverageAQI');
		this.postFileBackJson('/huanbao/Manager/Aqi_Day_Get',post_Manager+'/Aqi_Day_Get');
		this.postFileBackJson('/huanbao/Manager/Aqi_hours_Get',post_Manager+'/Aqi_hours_Get');
		this.postFileBackJson('/huanbao/Manager/Get_AQI_Year',post_Manager+'/Get_AQI_Year');
		this.postFileBackJson('/huanbao/Manager/Get_FS_TOP',post_Manager+'/Get_FS_TOP');
		this.postFileBackJson('/huanbao/Manager/Get_SZ_INFO',post_Manager+'/Get_SZ_INFO');
		
		this.getFileBackJson('/huanbao/HuanBao/GetForecast',post_HuanBao+'/GetForecast');
		this.getFileBackJson('/huanbao/HuanBao/GetTodayAir',post_HuanBao+'/GetTodayAir');
		this.getFileBackJson('/huanbao/HuanBao/GetMainPollutionDays',post_HuanBao+'/GetMainPollutionDays');
		this.getFileBackJson('/huanbao/HuanBao/GetAirQualityDays',post_HuanBao+'/GetAirQualityDays');
		
		this.app.get('/huanbao/Home/LoadMapGetPng', function(req, res) {
			var data = [];
			var url = "http://www.tuhuitech.com:1011/huanbao/Home/LoadMapGetPng?type=autonavi&x={x}&y={y}&z={z}";
			
			if(req.query){
				var type = req.query.type;
				var x = req.query.x;
				var y = req.query.y;
				var z = req.query.z;
				//console.log(x,y,z);
				url = url.replace('{x}',x);
				url = url.replace('{y}',y);
				url = url.replace('{z}',z);
				//console.log(url);
				var tilesrc = '/tile-'+x+'-'+y+'-'+z+'.png';
				//request(url).pipe(fs.createWriteStream(get_maps_tile+tilesrc));
				//测试请求原地址
				request(url, function(error, response, body) {
					//console.log(body);
					if(!error && response.statusCode == 200) {
						//能成功请求的话发起302重定向，同时将缓存文件下载到服务器上
						request(url).pipe(fs.createWriteStream(get_maps_tile+tilesrc));
						res.redirect(url);
						//res.status(200).send(body);
					}else{
						//请求不通时读取服务器缓存文件
						res.redirect('/huanbao/MapTile'+tilesrc);
					}
				})
				//res.status(200).send(tilesrc);
				//res.sendFile(tilesrc);
				//res.redirect('/huanbao/MapTile'+tilesrc);
				//res.download('/huanbao/MapTile'+tilesrc);
			}
		});
	},
	getFileBackJson:function(rute,files){
		this.app.get(rute, function(req, res) {
			var temp = files;//post_HuanBao+'/GetForecast';
			var data = [];
			fs.exists(temp,function(exists){
				if(exists){
					var temp_file = readFile(temp);
					if(temp_file){
						data = temp_file;
					}
			  	}else{
			  		console.log(temp+' : NOT exists!!!\r\n');
			  	}
				res.status(200).send(JSON.parse(data));
			})
		});
	},
	postFileBackJson:function(rute,files){
		this.app.post(rute, function(req, res) {
			//console.log('this is a post req.');
			var temp = files;//post_Manager+'/Get_GYWR_TOP';
			var data = [];
			fs.exists(temp,function(exists){
				if(exists){
					var temp_file = readFile(temp);
					if(temp_file){
						data = temp_file;
					}
			  	}else{
			  		console.log(temp+' : NOT exists!!!\r\n');
			  	}
				res.status(200).send(JSON.parse(data));
			})
		});
	}
};

/**
 * 对Date的扩展，将 Date 转化为指定格式的String 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
 * 可以用 1-2 个占位符 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) eg: (new
 * Date()).pattern("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 (new
 * Date()).pattern("yyyy-MM-dd E HH:mm:ss") ==> 2009-03-10 二 20:09:04 (new
 * Date()).pattern("yyyy-MM-dd EE hh:mm:ss") ==> 2009-03-10 周二 08:09:04 (new
 * Date()).pattern("yyyy-MM-dd EEE hh:mm:ss") ==> 2009-03-10 星期二 08:09:04 (new
 * Date()).pattern("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.pattern = function(fmt) {
	var o = {
		"M+" : this.getMonth() + 1, // 月份
		"d+" : this.getDate(), // 日
		"h+" : this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, // 小时
		"H+" : this.getHours(), // 小时
		"m+" : this.getMinutes(), // 分
		"s+" : this.getSeconds(), // 秒
		"q+" : Math.floor((this.getMonth() + 3) / 3), // 季度
		"S" : this.getMilliseconds()
	// 毫秒
	};
	var week = {
		"0" : "\u65e5",
		"1" : "\u4e00",
		"2" : "\u4e8c",
		"3" : "\u4e09",
		"4" : "\u56db",
		"5" : "\u4e94",
		"6" : "\u516d"
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "")
				.substr(4 - RegExp.$1.length));
	}
	if (/(E+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1,
				((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "星期" : "")
						: "")
						+ week[this.getDay() + ""]);
	}
	for ( var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k])
					: (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
};