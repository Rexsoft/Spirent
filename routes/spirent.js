var express = require('express');
var http 	= require('http');
var fs		= require('fs');
var router = express.Router();

var global_res;
/* GET users listing. */
router.get('/conversionRate', function(req, res) {
	var remote = req.query['remote'] ? req.query['remote'] : 1;
	var from_code = req.query['from_code'] ? req.query['from_code'] : "USD";
	var to_code = req.query['to_code'] ? req.query['to_code'] : "CNY";
	global_res = res;
  	//res.send('This is the api');
  	
  	if(remote == 1){
  		ConverionRate.getFromRemote(from_code, to_code);
  	}else{
  		ConverionRate.getFromLocal(from_code, to_code);
  	}
});

router.get('/currencyConversion', function(req, res) {
	var remote = req.query['remote'] ? req.query['remote'] : 1;
	var amount = req.query['amount'] ? req.query['amount'] : 0;
	amount = parseFloat(amount);
	var from_code = req.query['from_code'] ? req.query['from_code'] : "USD";
	var to_code = req.query['to_code'] ? req.query['to_code'] : "CNY";
	global_res = res;
  	
  	if(remote == 1){
  		ConverionRate.getFromRemote(from_code, to_code, amount);
  	}else{
  		ConverionRate.getFromLocal(from_code, to_code, amount);
  	}
});
router.get('/activity', function(req, res) {
	global_res = res;
  	DataBase.loadHistoryData();
});
router.post('/payment', function(req, res) {
	global_res = res;
	console.log(req.body.payment);
	var payment = JSON.parse(req.body.payment);
	console.log(payment);
  	DataBase.updateHistoryData(payment);
});

var ConverionRate = {
	getFromLocal : function (from_code, to_code, amount){
		var path = './storage/conversion_' + from_code + '.txt';
		var rate;
		var symbol = '';
		console.log(path);
		fs.exists(path,function(ifExist){
			console.log(ifExist);
			if(ifExist == true){
				fs.readFile(path,'UTF-8',function(err,data){
		        	if(err) 
		        		rate = 0;
		        	console.log(data);
		        	var rs = data.split('\n');
		        	var rates = Array();
		        	var symbols = Array();
		        	for(r in rs){
		        		var r_array = rs[r].split(' ');
		        		console.log(r_array);
		        		if(r_array[0] && r_array[1] && r_array[2]){
		        			rates[r_array[0]] = r_array[2];
		        			var s = r_array[1];
		        			symbols[r_array[0]] = s.substr(1,1);
		        		}
		        	}
		        	if(rates[to_code]){
						rate = parseFloat(rates[to_code]).toFixed(2);
						symbol = symbols[to_code];
					}else{
						rate = 0;
					}
					if(global_res){
						if(amount == null){
							global_res.send(rate);
						}else{
							var new_amount = parseFloat(rate * amount).toFixed(2);
							global_res.send(symbol + new_amount);
						}
					}
						
		    	});
			}else{
				ConverionRate.getFromRemote(from_code, to_code);
			}
		}); 
		
	},
	getFromRemote : function (from_code, to_code, amount){
		var rate;
		console.log('getFromRemote');
		var url = "http://openexchangerates.org/api/latest.json?app_id=b1f0b302490c4b9195dab56edbb6b041&base=" + from_code;
		console.log(url);
		http.get(url, function(res) {
		  	var content = '';
			res.on('data', function(data) {  
			  	//console.log("Got response: " + data); 
			  	content += data;
			}); 
			res.on('end', function() { 
			    //console.log("Got response: " + content); 
			  	if(content){
					var jsonObj = JSON.parse(content);
			    	if(jsonObj['rates']){
						var rates =  jsonObj['rates'];
						if(rates[to_code]){
							rate = parseFloat(rates[to_code]).toFixed(2);
						}else{
							rate = 0;
						}
						// Update the locale file
						DataBase.saveConversionRate('USD',rates);
						var symbol;
						switch(to_code){
							case 'USD':
								symbol = '$';
								break;
							case 'EUR':
								symbol = '€';
								break;
							case 'CAD':
								symbol = '$';
								break;
							case 'CNY':
								symbol = '元';
								break;
							case 'INR':
								symbol = '₹';
								break;
						}
						if(global_res){
							if(amount == null){
								global_res.send(rate);
							}else{
								var new_amount = parseFloat(rate * amount).toFixed(2);
								global_res.send(symbol + new_amount);
							}
						}
					}
				}
			}); 
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});
	}
}

var DataBase = {
	saveConversionRate : function (code, rates){
		var output = '';
		for(var key in rates){
			rate = parseFloat(rates[key]).toFixed(2);
			switch(key){
				case 'USD':
					output += key + ' =$ ' + rate + '\n';
					break;
				case 'EUR':
					output += key + ' =€ ' + rate + '\n';
					break;
				case 'CAD':
					output += key + ' =$ ' + rate + '\n';
					break;
				case 'CNY':
					output += key + ' =元 ' + rate + '\n';
					break;
				case 'INR':
					output += key + ' =₹ ' + rate + '\n';
					break;
			}
		}
		console.log(output);
		if(output){
			try{
				fs.writeFile('./storage/conversion_' + code + '.txt',output,'UTF-8',function(err){
		        	if(err) throw err;
		    	});
			}catch (ex){
				console.log(ex.message);
				return false;
			}
			return true;
		}else{
			return false;
		}
	},
	loadHistoryData : function (){
		var path = './storage/history.csv';
		var rate;
		var symbol = '';
		console.log(path);
		fs.exists(path,function(ifExist){
			console.log(ifExist);
			if(ifExist == true){
				fs.readFile(path,'UTF-8',function(err,data){
		        	if(err) 
		        		rate = 0;
		        	console.log(data);
		        	var hs = data.split('\r\n');
		        	var items = Array();
		        	var i = 0;
		        	for(r in hs){
		        		var r_array = hs[r].split(',');
		        		console.log(r_array);
		        		if(r_array[0] && r_array[1] && r_array[2]){
		        			var item = {
		        				time : r_array[0],
		        				name : r_array[1],
		        				amount : r_array[2]
		        			}
		        			items[i++] = item; //JSON.stringify(item);
		        		}
		        	}
		        	var json_string = items; //JSON.stringify(items);
		        	global_res.send(json_string);
		        });
		    }
		});
	},
	updateHistoryData : function (payment){
		var path = './storage/history.csv';
		fs.exists(path,function(ifExist){
			if(ifExist == true){
				var d = new Date();
				var dt = d.getDate() + "/" + d.getMonth() + "/" + d.getFullYear();
				var input = dt + ',' + payment.email + ',' + payment.amount + '\r\n';
		        try{
					fs.appendFile(path,input,'UTF-8',function(err){
			        	if(err) throw err;
			    	});
				}catch (ex){
					console.log(ex.message);
					global_res.send(404);
				}
		    }else{
		    	global_res.send(404);
		    }
		});
		global_res.send(200);
	},
};

module.exports = router;