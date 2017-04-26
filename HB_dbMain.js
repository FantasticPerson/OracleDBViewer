'use strict';
var oracleDb = require('./class_oracledb').createTester();
oracleDb.maxRows = 5000;
var http = require('http');
//表名
var _prev = '';
var tableNames = {
	tb_yjsg:"GX_HB_NIGHT_WORK"//夜间施工
	,tb_hbck:"HB_JDC_HB_WINDOW"//环保窗口
	,tb_hbjcz:"HB_JDC_CHECK_SITE"//环保检测站
	,tb_gkyjk:"HB_ZDYZX_QY"//国控源监控//重点源在线监控企业名单
	,tb_fqjc:"HB_T_WRY_JCZF_FQ"//废气检测结果
	,tb_fsjc:"HB_T_WRY_ZDJC_FS"//废水检测结果
	,vw_fq:"V_NEW_ZDY_FQ"//废气
	,vw_fs:"V_NEW_ZDY_FS"//废水
	,tb_waterFacName:"HBJ_T_HJZL_OBJSTATION_WAT"//水厂
//	1007	远古水厂
//	1006	城南水厂
//	1004	林山
	,tb_waterDayData:"HBJ_T_HJZL_WAT_DAY"//水厂当日数据
	,tb_waterf:"HB_WARTERFACTORY"
	,tb_waters:"HB_WARTERSOURCE"
	,tb_watersmm:"HB_WARTERSOURCE_MONITOR_MONTHLY"
	,vw_wmm:"V_WS_MONITOR_MONTHLY"
}

var warter_day_dic = {
	"林山":1004,
	"城南水厂":1006,
	"远古水厂":1007
}

var Sqls = {
	//select t.*, t.rowid from ZHNJ.GX_HB_NIGHT_WORK t where START_DATE <= sysdate and END_DATE >= sysdate
	nightWork:"select t.WORK_PROJECT_NAME,t.DATA_JD,t.DATA_WD,t.START_DATE,t.END_DATE,t.LOCAT_LINKMAN,t.WORK_PROJECT_ADDRESS,t.WORK_PROJECT_CONTENT from "+tableNames.tb_yjsg+" t where START_DATE <= sysdate and END_DATE >= sysdate"
	,hbWindow:"select * from "+tableNames.tb_hbck
	,hbjc:"select * from "+tableNames.tb_hbjcz
	,gkyjc:"select * from "+tableNames.tb_gkyjk
	,fsjc:"select * from "+tableNames.tb_fsjc
	,fqjc:"select * from "+tableNames.tb_fqjc
	,vwfsjc:"select * from "+tableNames.vw_fs
	,vwfqjc:"select QYMC,JCRQ,JKDMC,RPFL,SO2RJZ,SO2BZXZ,NOXRJZ,NOXBZXZ,YCRJZ,YCBZXZ,BZ,HGQK from "+tableNames.vw_fq
	//水厂,时间,pH,水温,溶解氧,浊度,电导率,CODMn,氨氮
	,waterday:"select STATIONID,DAY,PH,SHUIWEN,RONGJIEYANG,ZHUODU,DIANDAOLV,CODMN,ANDAN from "+tableNames.tb_waterDayData+" t where t.day>= (select max(tt.day)-10 from "+tableNames.tb_waterDayData+" tt where t.stationid = tt.stationid) and t.stationid = '{stationid}' order by t.day desc"
}

var njhb_new_api = "http://58.213.141.220:8989/njhbindex";
var options = {host: "58.213.141.220", port: 8989, path: "/njhbindex", method: 'GET'};

exports.mainInit = function() {
	return new Main();
};

function Main() {
	
}

Main.prototype = {
	// 初始化
	init:function(app){
		console.log('main-init-------------->>>>>>>>>>>>>>>');
		this.app = app;
		this.apiList();
	},
	conn:function(){
		//通过取到的配置去链接对应的库
		oracleDb.setting({
			user:'njhb',
			password:'1',
			connectString:'ORCL_HB'
		})
	},
	//http接口列表
	apiList:function(){
		var that = this;
		
		//夜间施工
		this.app.get('/nightWork', function(req, res) {
			that.conn();
			oracleDb.query(Sqls.nightWork, [], function(rows, msg){
				var returnobj = {
					"error":null,
					"success":true,
					"data":[]
				};
				if(msg!==null){
					returnobj.error = msg;
					returnobj.success = false;
				}
				var arr=[];
				if(rows){
					for(var i=0,l=rows.length;i<l;i++){
						arr.push({
							"name":rows[i][0],
							"jd":rows[i][1],
							"wd":rows[i][2],
							"start_date":rows[i][3],
							"end_date":rows[i][4],
							"locat_linkman":rows[i][5],
							"work_project_address":rows[i][6],
							"work_project_content":rows[i][7]
						});
					}
				}
				returnobj.data = arr;
				res.send(returnobj);
			});
		});
		
		//环保监测站
		this.app.get('/hbjcz', function(req, res) {
			that.conn();
			oracleDb.query(Sqls.hbjc, [], function(rows, msg){
				var returnobj = {
					"error":null,
					"success":true,
					"data":[]
				};
				if(msg!==null){
					returnobj.error = msg;
					returnobj.success = false;
				}
				var arr=[];
				if(rows){
				for(var i=0,l=rows.length;i<l;i++){
					arr.push({
						"ckid":rows[i][1],
						"hbckmc":rows[i][2],
						"hbckaddress":rows[i][3],
						"lxdh":rows[i][5],
						"jd":rows[i][6],
						"wd":rows[i][7]
					});
				}
				}
				returnobj.data = arr;
				res.send(returnobj);
			});
		});
		
		//环保窗口
		this.app.get('/hbWindow', function(req, res) {
			that.conn();
			if(req.query.type){
				var sql = Sqls.hbWindow+" where YWLX like '%"+req.query.type+"%'";
			}else{
				var sql = Sqls.hbWindow;
			}
			oracleDb.query(sql, [], function(rows, msg){
				var returnobj = {
					"error":null,
					"success":true,
					"data":[]
				};
				if(msg!==null){
					returnobj.error = msg;
					returnobj.success = false;
				}
				var arr=[];
				if(rows){
				for(var i=0,l=rows.length;i<l;i++){
					arr.push({
						"name":rows[i][1],
						"type":rows[i][7],
						"jd":rows[i][5],
						"wd":rows[i][6],
						"place":rows[i][2],
						"tel":rows[i][4],
						"ywtype":rows[i][3]
					});
				}
				}
				returnobj.data = arr;
				res.send(returnobj);
			});
		});
		
		//国控源监控
		this.app.get('/gkyjc', function(req, res) {
			that.conn();
			if(req.query.name){
				var sql = Sqls.gkyjc+" where QY_NAME like '%"+req.query.name+"%'";
			}else{
				var sql = Sqls.gkyjc;
			}
			oracleDb.query(sql, [], function(rows, msg){
				var returnobj = {
					"error":null,
					"success":true,
					"data":[]
				};
				if(msg!==null){
					returnobj.error = msg;
					returnobj.success = false;
				}
				var arr=[];
				if(rows){
				for(var i=0,l=rows.length;i<l;i++){
					arr.push({
						"id":rows[i][0],
						"name":rows[i][1],
						"jd":rows[i][4],
						"wd":rows[i][5],
						"is_fs":rows[i][2],
						"is_fq":rows[i][3]
					});
				}
				}
				returnobj.data = arr;
				res.send(returnobj);
			});
		});
		
		//废水
		this.app.get('/fs', function(req, res) {
			that.conn();
			if(req.query.name){
				var sql = Sqls.vwfsjc+" where QYMC='"+req.query.name+"'";
				oracleDb.query(sql, [], function(rows, msg){
					var returnobj = {
						"error":null,
						"success":true,
						"data":[]
					};
					if(msg!==null){
						returnobj.error = msg;
						returnobj.success = false;
					}
					var arr=[];
					if(rows){
					for(var i=0,l=rows.length;i<l;i++){
						arr.push({
							"name":rows[i][3],
							"date":rows[i][2],
							"jkdmc":rows[i][4],
							"rpel":rows[i][5],
							"rjz_cod":rows[i][6],
							"bzxz_cod":rows[i][7],
							"rjz_nh3n":rows[i][8],
							"bzxz_nh3n":rows[i][9],
							"jcqk":rows[i][11],
							"bz":rows[i][12]
						});
					}
					}
					returnobj.data = arr;
					res.send(returnobj);
				});
			}else{
				res.send('参数异常');
			}
		});
		
		//废气
		this.app.get('/fq', function(req, res) {
			that.conn();
			if(req.query.name){
				var sql = Sqls.vwfqjc+" where QYMC='"+req.query.name+"'";
				oracleDb.query(sql, [], function(rows, msg){
					var returnobj = {
						"error":null,
						"success":true,
						"data":[]
					};
					if(msg!==null){
						returnobj.error = msg;
						returnobj.success = false;
					}
					var arr=[];
					if(rows){
					for(var i=0,l=rows.length;i<l;i++){
						arr.push({
							"qymc":rows[i][0],
							"jcrq":rows[i][1],
							"jkdmc":rows[i][2],
							"rpel":rows[i][3],
							"so2rjz":rows[i][4],
							"so2bzxz":rows[i][5],
							"noxrjz":rows[i][6],
							"noxbzxz":rows[i][7],
							"ycrjz":rows[i][8],
							"ycbzxz":rows[i][9],
							"bz":rows[i][10],
							"hgqk":rows[i][11]
						});
					}
					}
					returnobj.data = arr;
					res.send(returnobj);
				});
			}else{
				res.send('参数异常');
			}
		});
		
		//水厂当日详情
		this.app.get('/waterday', function(req, res) {
			that.conn();
			if(req.query.id){
				var sql = Sqls.waterday.replace('{stationid}',req.query.id);
				//var sql = Sqls.waterday+" where STATIONID="+req.query.id;
			}
			if(req.query.name){
				var id = warter_day_dic[req.query.name];
				//var sql = Sqls.waterday+" where STATIONID="+id;
				var sql = Sqls.waterday.replace('{stationid}',id);
			}
			
			if(typeof(sql)!=="undefined"){
				//var sql = Sqls.vwfqjc+" where QYMC='"+req.query.name+"'";
				oracleDb.query(sql, [], function(rows, msg){
					var returnobj = {
						"error":null,
						"success":true,
						"data":[]
					};
					if(msg!==null){
						returnobj.error = msg;
						returnobj.success = false;
					}
					var arr=[];
					if(rows){
					for(var i=0,l=rows.length;i<l;i++){
						arr.push({
							"id":rows[i][0],
							"time":(new Date(rows[i][1])).pattern("yyyy-MM-dd"),
							"ph":rows[i][2].toFixed(2),
							"shuiwen":rows[i][3],
							"rongjieyang":rows[i][4],
							"zhuodu":rows[i][5],
							"diandaolv":rows[i][6],
							"codmn":rows[i][7],
							"andan":rows[i][8]
						});
					}
					}
					returnobj.data = arr;
					res.send(returnobj);
				});
			}else{
				res.send('参数异常');
			}
		});
		
		//排名
		this.app.get('/map', function(req, res) {
			/*var url = njhb_new_api + '/map';
			http.request(options, function(res2){
				res2.setEncoding('utf8');
				res2.on('data', function(chunk){
        			res.send(chunk);
    			});
    			res2.on('error', function(err){
			        res.send(err);
			    });
			})*/
			
			var returndata = {"Success":true,"Data":[{"name":"呼伦贝尔市","aqi":"17"},{"name":"阿里","aqi":"20"},{"name":"兴安盟","aqi":"21"},{"name":"楚雄","aqi":"21"},{"name":"蓬莱市","aqi":"22"},{"name":"巢湖市","aqi":"22"},{"name":"那曲","aqi":"22"},{"name":"招远市","aqi":"23"},{"name":"西双版纳","aqi":"23"},{"name":"怒江傈","aqi":"23"},{"name":"临沧市","aqi":"23"},{"name":"香格里拉","aqi":"24"},{"name":"鄂尔多斯市","aqi":"24"},{"name":"日喀则","aqi":"24"},{"name":"乳山市","aqi":"25"},{"name":"阿坝","aqi":"25"},{"name":"文登市","aqi":"26"},{"name":"威海市","aqi":"26"},{"name":"承德市","aqi":"27"},{"name":"荣成市","aqi":"28"},{"name":"台东县","aqi":"28"},{"name":"保山市","aqi":"28"},{"name":"赤峰市","aqi":"29"},{"name":"北京市","aqi":"30"},{"name":"花莲县","aqi":"32"},{"name":"阳泉市","aqi":"32"},{"name":"烟台市","aqi":"32"},{"name":"张家口市","aqi":"33"},{"name":"巴彦淖尔市","aqi":"33"},{"name":"昭通市","aqi":"33"},{"name":"文山","aqi":"33"},{"name":"廊坊市","aqi":"34"},{"name":"韶关市","aqi":"34"},{"name":"三亚市","aqi":"34"},{"name":"攀枝花市","aqi":"34"},{"name":"南平市","aqi":"35"},{"name":"莱西市","aqi":"36"},{"name":"清远市","aqi":"36"},{"name":"锡林郭勒盟","aqi":"37"},{"name":"大同市","aqi":"37"},{"name":"山南","aqi":"37"},{"name":"澳门","aqi":"37"},{"name":"德宏","aqi":"38"},{"name":"宜兰县","aqi":"39"},{"name":"阿拉善盟","aqi":"39"},{"name":"牡丹江市","aqi":"39"},{"name":"甘孜","aqi":"39"},{"name":"迪庆","aqi":"39"},{"name":"基隆市","aqi":"39"},{"name":"台北市","aqi":"40"},{"name":"东莞市","aqi":"40"},{"name":"潮州市","aqi":"40"},{"name":"忻州市","aqi":"41"},{"name":"林芝","aqi":"41"},{"name":"大连市","aqi":"42"},{"name":"梅州市","aqi":"42"},{"name":"盘锦市","aqi":"43"},{"name":"大理","aqi":"43"},{"name":"平度市","aqi":"44"},{"name":"深圳市","aqi":"44"},{"name":"凉山","aqi":"44"},{"name":"惠州市","aqi":"45"},{"name":"黄山市","aqi":"45"},{"name":"唐山市","aqi":"46"},{"name":"莆田市","aqi":"46"},{"name":"自贡市","aqi":"46"},{"name":"珠海市","aqi":"47"},{"name":"河源市","aqi":"47"},{"name":"广州市","aqi":"47"},{"name":"中山市","aqi":"47"},{"name":"丽江市","aqi":"47"},{"name":"莱州市","aqi":"48"},{"name":"海口市","aqi":"48"},{"name":"佛山市","aqi":"48"},{"name":"新北市","aqi":"49"},{"name":"新竹县","aqi":"49"},{"name":"天津市","aqi":"49"},{"name":"秦皇岛市","aqi":"49"},{"name":"神农架","aqi":"50"},{"name":"义乌市","aqi":"50"},{"name":"澎湖县","aqi":"50"},{"name":"通辽市","aqi":"50"},{"name":"肇庆市","aqi":"51"},{"name":"遂宁市","aqi":"51"},{"name":"三明市","aqi":"52"},{"name":"泉州市","aqi":"52"},{"name":"龙岩市","aqi":"52"},{"name":"玉溪市","aqi":"52"},{"name":"内江市","aqi":"52"},{"name":"资阳市","aqi":"52"},{"name":"苗栗县","aqi":"53"},{"name":"嘉峪关市","aqi":"53"},{"name":"香港特别行政区","aqi":"53"},{"name":"朔州市","aqi":"54"},{"name":"呼和浩特市","aqi":"54"},{"name":"大庆市","aqi":"54"},{"name":"温州市","aqi":"54"},{"name":"揭阳市","aqi":"54"},{"name":"瓦房店市","aqi":"55"},{"name":"桃园县","aqi":"55"},{"name":"锦州市","aqi":"55"},{"name":"东营市","aqi":"55"},{"name":"曲靖市","aqi":"55"},{"name":"新竹市","aqi":"56"},{"name":"屏东县","aqi":"56"},{"name":"阳江市","aqi":"56"},{"name":"台州市","aqi":"56"},{"name":"汕头市","aqi":"56"},{"name":"南昌市","aqi":"56"},{"name":"茂名市","aqi":"56"},{"name":"丽水市","aqi":"56"},{"name":"江门市","aqi":"56"},{"name":"二连浩特市","aqi":"57"},{"name":"克拉玛依市","aqi":"57"},{"name":"金门","aqi":"58"},{"name":"衢州市","aqi":"58"},{"name":"景德镇市","aqi":"58"},{"name":"云浮市","aqi":"59"},{"name":"新余市","aqi":"59"},{"name":"汕尾市","aqi":"59"},{"name":"抚州市","aqi":"59"},{"name":"延安市","aqi":"59"},{"name":"富阳市","aqi":"60"},{"name":"即墨市","aqi":"60"},{"name":"台中市","aqi":"60"},{"name":"阜新市","aqi":"60"},{"name":"福州市","aqi":"60"},{"name":"铜陵市","aqi":"61"},{"name":"上饶市","aqi":"61"},{"name":"吕梁市","aqi":"62"},{"name":"鹰潭市","aqi":"62"},{"name":"厦门市","aqi":"62"},{"name":"漳州市","aqi":"64"},{"name":"赣州市","aqi":"64"},{"name":"乌海市","aqi":"65"},{"name":"彰化县","aqi":"66"},{"name":"吉安市","aqi":"66"},{"name":"绵阳市","aqi":"66"},{"name":"寿光市","aqi":"67"},{"name":"南投县","aqi":"67"},{"name":"宜春市","aqi":"67"},{"name":"重庆市","aqi":"67"},{"name":"泸州市","aqi":"67"},{"name":"拉萨市","aqi":"67"},{"name":"朝阳市","aqi":"68"},{"name":"广元市","aqi":"68"},{"name":"包头市","aqi":"69"},{"name":"九江市","aqi":"69"},{"name":"金华市","aqi":"69"},{"name":"杭州市","aqi":"69"},{"name":"宜宾市","aqi":"69"},{"name":"沧州市","aqi":"70"},{"name":"长治市","aqi":"70"},{"name":"宝鸡市","aqi":"70"},{"name":"库尔勒","aqi":"71"},{"name":"齐齐哈尔市","aqi":"71"},{"name":"湛江市","aqi":"71"},{"name":"临安市","aqi":"72"},{"name":"舟山市","aqi":"72"},{"name":"郴州市","aqi":"72"},{"name":"南宁市","aqi":"73"},{"name":"运城市","aqi":"74"},{"name":"济南市","aqi":"74"},{"name":"昆明市","aqi":"75"},{"name":"十堰市","aqi":"76"},{"name":"绍兴市","aqi":"76"},{"name":"黄冈市","aqi":"76"},{"name":"南充市","aqi":"76"},{"name":"丹东市","aqi":"77"},{"name":"萍乡市","aqi":"77"},{"name":"滨州市","aqi":"77"},{"name":"永州市","aqi":"79"},{"name":"广安市","aqi":"79"},{"name":"昌都","aqi":"79"},{"name":"章丘市","aqi":"80"},{"name":"晋城市","aqi":"80"},{"name":"北海市","aqi":"80"},{"name":"金昌市","aqi":"80"},{"name":"吉林市","aqi":"82"},{"name":"淄博市","aqi":"83"},{"name":"南京市","aqi":"84"},{"name":"潍坊市","aqi":"84"},{"name":"宁波市","aqi":"84"},{"name":"上海市","aqi":"85"},{"name":"桂林市","aqi":"85"},{"name":"恩施","aqi":"86"},{"name":"营口市","aqi":"87"},{"name":"安庆市","aqi":"87"},{"name":"六安市","aqi":"88"},{"name":"衡阳市","aqi":"88"},{"name":"兰州市","aqi":"89"},{"name":"吴江市","aqi":"91"},{"name":"海门市","aqi":"91"},{"name":"太仓市","aqi":"92"},{"name":"益阳市","aqi":"93"},{"name":"宣城市","aqi":"93"},{"name":"芜湖市","aqi":"93"},{"name":"无锡市","aqi":"95"},{"name":"长春市","aqi":"95"},{"name":"三门峡市","aqi":"95"},{"name":"马鞍山市","aqi":"95"},{"name":"湖州市","aqi":"95"},{"name":"昆山市","aqi":"96"},{"name":"太原市","aqi":"96"},{"name":"遵义市","aqi":"96"},{"name":"哈尔滨市","aqi":"97"},{"name":"贵阳市","aqi":"98"},{"name":"成都市","aqi":"98"},{"name":"巴中市","aqi":"98"},{"name":"晋中市","aqi":"99"},{"name":"岳阳市","aqi":"99"},{"name":"娄底市","aqi":"99"},{"name":"柳州市","aqi":"99"},{"name":"德州市","aqi":"99"},{"name":"葫芦岛市","aqi":"100"},{"name":"湘潭市","aqi":"100"},{"name":"莱芜市","aqi":"100"},{"name":"滁州市","aqi":"100"},{"name":"常熟市","aqi":"101"},{"name":"青岛市","aqi":"101"},{"name":"合肥市","aqi":"101"},{"name":"邵阳市","aqi":"103"},{"name":"江阴市","aqi":"104"},{"name":"诸暨市","aqi":"104"},{"name":"高雄市","aqi":"104"},{"name":"孝感市","aqi":"104"},{"name":"黄石市","aqi":"104"},{"name":"溧阳市","aqi":"105"},{"name":"张家港市","aqi":"106"},{"name":"台南市","aqi":"106"},{"name":"南通市","aqi":"106"},{"name":"仙桃","aqi":"107"},{"name":"嘉義","aqi":"108"},{"name":"嘉兴市","aqi":"108"},{"name":"咸宁市","aqi":"109"},{"name":"长沙市","aqi":"109"},{"name":"德阳市","aqi":"109"},{"name":"句容市","aqi":"110"},{"name":"红河哈尼族","aqi":"112"},{"name":"云林县","aqi":"113"},{"name":"苏州市","aqi":"113"},{"name":"随州市","aqi":"113"},{"name":"常州市","aqi":"115"},{"name":"本溪市","aqi":"115"},{"name":"池州市","aqi":"115"},{"name":"宜兴市","aqi":"116"},{"name":"鞍山市","aqi":"116"},{"name":"洛阳市","aqi":"119"},{"name":"潜江","aqi":"120"},{"name":"金坛市","aqi":"120"},{"name":"张家界市","aqi":"121"},{"name":"武汉市","aqi":"121"},{"name":"泰安市","aqi":"121"},{"name":"聊城市","aqi":"121"},{"name":"开封市","aqi":"121"},{"name":"鄂州市","aqi":"121"},{"name":"衡水市","aqi":"122"},{"name":"达州市","aqi":"122"},{"name":"雅安市","aqi":"124"},{"name":"株洲市","aqi":"125"},{"name":"常德市","aqi":"125"},{"name":"泰州市","aqi":"127"},{"name":"镇江市","aqi":"128"},{"name":"临汾市","aqi":"129"},{"name":"渭南市","aqi":"129"},{"name":"盐城市","aqi":"130"},{"name":"日照市","aqi":"131"},{"name":"抚顺市","aqi":"132"},{"name":"信阳市","aqi":"134"},{"name":"西安市","aqi":"134"},{"name":"鹤壁市","aqi":"135"},{"name":"辽阳市","aqi":"136"},{"name":"眉山市","aqi":"136"},{"name":"石家庄市","aqi":"137"},{"name":"郑州市","aqi":"138"},{"name":"济源","aqi":"138"},{"name":"荆州市","aqi":"138"},{"name":"南阳市","aqi":"140"},{"name":"胶州市","aqi":"147"},{"name":"临沂市","aqi":"147"},{"name":"阜阳市","aqi":"147"},{"name":"扬州市","aqi":"148"},{"name":"宿迁市","aqi":"150"},{"name":"蚌埠市","aqi":"152"},{"name":"乌鲁木齐市","aqi":"156"},{"name":"许昌市","aqi":"158"},{"name":"淮南市","aqi":"160"},{"name":"胶南市","aqi":"161"},{"name":"荆门市","aqi":"161"},{"name":"平顶山市","aqi":"162"},{"name":"淮北市","aqi":"168"},{"name":"邢台市","aqi":"169"},{"name":"西宁市","aqi":"169"},{"name":"淮安市","aqi":"172"},{"name":"咸阳市","aqi":"173"},{"name":"襄阳市","aqi":"174"},{"name":"枣庄市","aqi":"174"},{"name":"银川市","aqi":"176"},{"name":"铜川市","aqi":"177"},{"name":"保定市","aqi":"181"},{"name":"徐州市","aqi":"183"},{"name":"焦作市","aqi":"186"},{"name":"石嘴山市","aqi":"189"},{"name":"宜昌市","aqi":"190"},{"name":"乐山市","aqi":"191"},{"name":"连云港市","aqi":"196"},{"name":"周口市","aqi":"198"},{"name":"驻马店市","aqi":"199"},{"name":"宿州市","aqi":"207"},{"name":"漯河市","aqi":"207"},{"name":"菏泽市","aqi":"210"},{"name":"安阳市","aqi":"210"},{"name":"商丘市","aqi":"215"},{"name":"沈阳市","aqi":"225"},{"name":"亳州市","aqi":"226"},{"name":"济宁市","aqi":"229"},{"name":"濮阳市","aqi":"242"},{"name":"铁岭市","aqi":"256"},{"name":"邯郸市","aqi":"287"}],"Error":null}
			res.send(returndata);
		});
		this.app.get('/order', function(req, res) {
			var returndata = {"Success":true,"Data":[{"date":"12-15 18:00","so2":"22.0","no2":"60.0","pm10":"92.0","pm25":"63.0","co":"1.115","o3":"77.0","aqi":85,"first":"221","level":"二级","note":"良","iso2":8,"ino2":30,"ipm10":71,"ipm25":85,"ico":20,"io3":25}],"Error":null};
			res.send(returndata);
		});
		this.app.get('/order2', function(req, res) {
			var returndata = {"Success":true,"Data":[["序号","城市","综合指数","最大指数","主要污染物"],["1","舟山","2.19","0.73","O3"],["2","福州","2.48","0.58","NO2、O3"],["3","海口","2.57","0.73","O3"],["4","惠州","2.67","0.69","PM2.5"],["5","台州","2.73","0.69","O3"],["6","厦门","2.81","0.68","NO2"],["7","盐城","2.83","0.72","O3"],["8","丽水","2.87","0.74","PM2.5"],["9","南通","2.93","0.66","PM2.5"],["10","深圳","3.00","0.82","O3"],["11","上海","3.07","0.82","NO2"],["12","淮安","3.17","0.83","PM2.5"],["13","泰州","3.23","0.86","PM2.5"],["14","扬州","3.24","0.89","PM2.5"],["15","拉萨","3.30","1.14","PM10"],["16","镇江","3.36","0.78","NO2"],["17","宿迁","3.39","0.94","PM2.5"],["18","湖州","3.41","0.85","NO2"],["19","贵阳","3.44","0.89","PM2.5"],["20","珠海","3.47","0.98","O3"],["21","连云港","3.48","0.81","O3"],["22","嘉兴","3.53","0.88","NO2"],["23","衢州","3.53","0.94","PM2.5"],["24","南京","3.54","0.98","NO2"],["25","温州","3.56","0.92","NO2"],["26","东莞","3.56","0.91","PM2.5"],["27","昆明","3.57","0.83","PM10"],["28","广州","3.59","0.90","NO2"],["29","肇庆","3.61","0.97","PM2.5"],["30","宁波","3.63","0.92","NO2"],["31","常州","3.64","0.90","NO2"],["32","中山","3.67","0.93","O3"],["33","合肥","3.76","1.05","NO2"],["34","南昌","3.76","0.83","PM2.5、PM10"],["35","苏州","3.83","1.18","NO2"],["36","金华","3.84","1.00","PM2.5"],["37","杭州","3.88","1.10","NO2"],["38","绍兴","3.89","1.00","NO2"],["39","青岛","3.94","0.97","PM10"],["40","无锡","3.98","1.08","NO2"],["41","大连","4.01","0.91","O3"],["42","佛山","4.04","1.06","PM2.5"],["43","南宁","4.06","1.03","PM2.5"],["44","武汉","4.08","1.02","NO2"],["45","长沙","4.12","1.26","PM2.5"],["46","江门","4.18","1.07","O3"],["47","哈尔滨","4.21","1.26","PM2.5"],["48","乌鲁木齐","4.24","1.34","PM2.5"],["49","重庆","4.38","1.14","PM2.5"],["50","张家口","4.39","1.24","PM10"],["51","承德","4.79","1.27","PM10"],["52","长春","4.82","1.46","PM2.5"],["53","徐州","4.94","1.23","PM2.5"],["54","西宁","4.97","1.34","PM10"],["55","呼和浩特","4.98","1.30","NO2"],["56","秦皇岛","5.04","1.22","NO2"],["57","成都","5.25","1.49","PM2.5"],["58","沈阳","5.25","1.49","PM2.5"],["59","郑州","5.46","1.42","NO2"],["60","兰州","5.51","1.63","PM10"],["61","西安","5.52","1.51","PM2.5"],["62","银川","5.62","1.49","PM2.5"],["63","廊坊","5.68","1.60","PM2.5"],["64","天津","5.75","1.83","PM2.5"],["65","北京","6.23","2.40","PM2.5"],["66","济南","6.27","1.69","PM10"],["67","沧州","6.69","2.06","PM2.5"],["68","衡水","6.70","2.14","PM2.5"],["69","邯郸","6.73","1.84","PM10"],["70","太原","7.19","1.97","PM2.5"],["71","保定","7.85","2.74","PM2.5"],["72","唐山","7.86","2.09","PM2.5"],["73","邢台","8.20","2.37","PM2.5"],["74","石家庄","9.46","3.31","PM2.5"]],"Error":null};
			res.send(returndata);
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