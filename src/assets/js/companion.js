// import * as io from 'socket.io-client';
// const {BrowserWindow, Menu, app, shell, dialog} = require('electron')


// function sock(){
// 	let socket = new io.connect('https://bboss.biz:3000')
// 	console.log('socket');

// 	socket.on('bboss:refreshDespatchToday-2',
// 		function(t){
// 			console.log('refresh despatch today!!!!')
// 		}
// 	);
// };

// sock();
angular.module('companionApp', []).

controller('CompanionController', 
	function(){

	    var bb = this;
		
		/*------------------- CONNECTION -------------------*/
		this.connection = undefined;

		this.token = undefined;

		this.tokenChanged = function(){
			if(bb.token != undefined && bb.token.length == 19){
				console.log(bb.token);
				//CHECK TOKEN && CONNECT!
			}
		};
		/*--------------------------------------------------*/
		
	}
);