var aSprientApp = angular.module('spirentApp', []);

function spirentRouteConfig($routeProvider) {
	$routeProvider.
	when('/',{
		controller: homeController,
		templateUrl: 'views/home.html'
	}).
	when('/success/', {
		controller: homeController,
		templateUrl: 'views/success.html'
	}).
	when('/history/', {
		controller: historyController,
		templateUrl: 'views/history.html'
	}).
	when('/send/', {
		controller: sendController,
		templateUrl: 'views/send.html'
	}).
	otherwise({
		redirectTo:'/'
	});
}
aSprientApp.config(spirentRouteConfig);

function homeController($scope,$location) {
	$scope.send = function(){
		$location.path('/send/');
	};
	$scope.history = function(){
		$location.path('/history/');
	}
}

function successController ($scope) {
	// body...
}

function historyController ($scope, $http, $location) {
	// body...
	$http.get('/spirent/activity').success(function (data, status, headers, config) {
		$scope.items = data;
	}).error(function (data, status, headers, config) {
		console.log('Error: '. status);
	});
	$scope.back = function(){
		$location.path('/');
	};
}

function sendController ($scope, $http, $location) {
	// body...
	$scope.code       = ['USD','EUR','CNY','CAD','INR'];
	$scope.if_right   = false;
	$scope.if_loading = false;
	$scope.sendPayment = function(){
		if($scope.if_right){
			$scope.toMoney(false);
			var postData = {payment: JSON.stringify($scope.payment)};
			$scope.if_loading = true;
			$http.post('/spirent/payment', postData).success(function (data, status, headers, config) {
				console.log('Success: '. status);
				$scope.if_loading = false;
				$location.path('/success/');
			}).error(function (data, status, headers, config) {
				console.log('Error: '. status);
				$scope.if_loading = false;
			});
		}else{
			alert('The email is not in right format!');
		}
	};
	$scope.clear = function(){
		$scope.payment = [];
	};
	$scope.submit = function(){
		return false;
	};
	$scope.isEmail = function(){
       var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
       if(reg.test($scope.payment.email) == true){
       		$scope.if_right = true;
       }else{
       		$scope.if_right = false;
       }
       console.log($scope.email + $scope.if_right);
	};
	$scope.toMoney = function(with_comma)   
	{   
	   var n = 2;
	   var s = $scope.payment.amount;   
	   var amount;
	   s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + ""; 
	   if(with_comma == true){
	   		if(s != 'NaN'){
		   	   var l = s.split(".")[0].split("").reverse(),   
			   r = s.split(".")[1];   
			   t = "";   
			   for(i = 0; i < l.length; i ++ )   
			   {   
			      t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");   
			   }   
			   amount = t.split("").reverse().join("") + "." + r; 
		   }  else{
		   	   amount = '';
		   }
	   }else{
	   		amount = s;
	   }
	   
	   var symbol = '';
	   switch($scope.payment.code){
	   		case 'USD':
   				symbol = '$'
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
	     $scope.payment.amount = symbol + amount;
	};
}