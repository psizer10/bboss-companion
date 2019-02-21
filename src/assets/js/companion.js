'use strict';

const io = require('socket.io-client');

const {BrowserWindow, Notification, app, dialog} = require('electron').remote;

//const bbossURL = 'http://bboss.paul';
const bbossURL = 'https://dev.bboss.biz';
const fileSystem = require('fs');

angular.module('companionApp', []).

controller('CompanionController', ['$scope', '$http', '$interval',
	function($scope, $http, $interval){

		var bb = this;

		this.version = app.getVersion().toString();
	
		/*------------------- CONNECTION -------------------*/
		this.connection = undefined;

		this.token = undefined;

		this.connect = function(){
			bb.loading = true;
			//$http.get(bbossURL + '/companion/checkConnection/' + self.token)
			$http.get(bbossURL + '/companion/initialConnection/' + bb.token)
			.then(
				function(response){ //success
					bb.events.push(response.data.event);
					bb.connection = response.data;
					listen();
					bb.loading = false;
					new Audio('../src/assets/sounds/connected.mp3').play();
					ping();
				},
				function(response){ //error
					noConnection('failed');
				}
			);

		};

		function listen(){
			let socket = new io.connect(bbossURL + ':3000')
			socket.on('bboss:companion-' + bb.connection.token,
				function(event){
					console.log(event);
					if(event.type == 'connectionDestroyed'){
						noConnection('lost');
					}
					else{
						bb.events.unshift(event);
						$scope.$apply();
						addToEventQueue(event);
					}
				}
			);
		};

		function checkConnection(){
			$http.get(bbossURL + '/companion/checkConnection/' + bb.token)
			.then(
				function(response){ //success
					console.log(response);
				},
				function(response){ //error
					noConnection('lost');
				}
			)
		};

		function noConnection(type){
			bb.connectionError = (type == 'lost' ? 'Your connection to BBOSS has been lost.' : 'Could not connect to BBOSS.');
			bb.mask = true;
			bb.popUp = '../src/assets/html/noConnection.html';
			$scope.$apply();
			let not = new Notification(
				{
					title : 'Connection Error',
					body : bb.connectionError
				}
			);
			not.show();
		};

		// setTimeout(
		// 	function(){
		// 		noConnection('lost');
		// 	}, 2000
		// )

		this.reloadApp = function(){
			app.relaunch();
			app.exit(0);
		};

		/*--- Periodically check the connection ---*/
		var pingInterval;
		function ping(){
			$interval.cancel(pingInterval);
			pingInterval = $interval(
				function(){
					checkConnection();
				}, (1 * 60000) //1 minutes
			)
		};
		/*-----------------------------------------*/
		/*--------------------------------------------------*/

		/*--------------------- EVENTS ---------------------*/
		this.events = [];
		this.queue = [];
		var queueIgnore = ['connected', 'connectionDestroyed'];
		function addToEventQueue(evt){
			if(queueIgnore.indexOf(evt.type) == -1){
				bb.queue[bb.queue.length] = evt;
				if(bb.queue.length == 1){ //the queue doesnt have anything in when a new one is added, then it wont be worked already
					workEventQueue();
				}
			}
		};

		function workEventQueue(){

			if(bb.queue.length > 0){
				//only printing atm
				ping(); //reset the connection checker
				bb.currentEvent = angular.copy(bb.queue[0]);
				console.log(bb.currentEvent);
				print(angular.copy(bb.queue[0]),
					function(){
						bb.queue.shift(); //removes the event that has just been worked
						workEventQueue();
					}
				);
		
			}
		}

		this.eventIcon = function(event){
			if(event.type == 'connected'){
				return 'fa-broadcast-tower';
			}
			else{
				return 'fa-print';
			}
		};
		/*--------------------------------------------------*/

		/*-------------------- PRINTING --------------------*/
	//	let printWindow = [];
		function print(event, callback){
			getPrinter(event.type,
				function(printer){
					let not = new Notification(
						{
							title : 'BBOSS Companion',
							body : 'Printing: ' + event.description
						}
					);
					not.show();
					(function p(page){
						
						console.log(bbossURL + '/companion/request/' + event.requestToken  + '/' + bb.connection.token + '/' + page);
						let printWindow = new BrowserWindow({
							width: 600,
							height: 1000,
							webPreferences: {
								nodeIntegration: false, 
								webSecurity: false
							},
							show : false
							
						});
	
						// load PDF.
						printWindow.loadURL(bbossURL + '/companion/request/' + event.requestToken  + '/' + bb.connection.token + '/' + page);

						//Print the PDF once it has loaded
						printWindow.webContents.on('did-finish-load', () => {
							printWindow.webContents.print({silent: true, deviceName : printer},
								function(){
									//close window after print order.
									printWindow = null;

									//if there are more pages, call self with next
									if(page < event.pages){
										p(page + 1);
									}
									else{
										
										callback();
									}
								}
							);
						});
					})(1);
				}
			);
			return;
		};
		

		function getPrinter(type, callback){
			loadPrintSettings(false,
				function(){
					if(bb.printSettings[type] != undefined){
						//check printer still exists before returning!!!!
						listPrinters(true);
						for(var i in bb.printers){
							if(bb.printers[i].name == bb.printSettings[type]){
								callback(bb.printSettings[type]);
								return;
							}
						}
					}
					else{ 
						//printer hasnt been selected before
						selectPrinter(type,
							function(printer){
								callback(printer);
							}
						);
					}
				}
			);
		};

		/*-------- POP UP --------*/
		function selectPrinter(type, callback){
			bb.mask = true;
			listPrinters();
			bb.popUp = '../src/assets/html/selectPrinter.html';
			bb.confirmPrinterSelection = function(){
				if(bb.selectPrinter != undefined){
					callback(bb.selectPrinter);
					writeToPrintSettings(type, bb.selectPrinter);
					bb.mask = false;
					delete bb.popUp;
				}
			};
			$scope.$apply();

			let not = new Notification(
				{
					title : 'Action Required',
					body : 'You need to select a printer for ' + '...'
				}
			);
		};
		/*------------------------*/

		this.printers = null;
		function listPrinters(refresh){
			if(bb.printers == null || refresh){
				bb.printers = new BrowserWindow({show:false}).webContents.getPrinters();
			}
			console.log(bb.printers);
			return bb.printers;
		};

		this.printSettings = null;
		function loadPrintSettings(refresh, callback){
			if(bb.printSettings == null || refresh){
				if(fileSystem.existsSync('printSettings.json')){ //check settings file exists
					fileSystem.readFile('printSettings.json', 'utf8', 
						function readFileCallback(err, data){
							if(err){
								//TODO
								console.log(err);
								return;
							} 
							else{
								bb.printSettings = JSON.parse(data);
								if(callback) callback();
							}
						}
					);
				}
				else{
					fileSystem.writeFile('printSettings.json', '{}', 'utf8', function(){});
					bb.printSettings = {};
					if(callback) callback();
				}
				return;
			}
			if(callback) callback();
		};

		function writeToPrintSettings(type, printer){
			bb.printSettings[type] = printer;
			//write to the file and reload settings
			fileSystem.writeFile('printSettings.json', JSON.stringify(bb.printSettings), 'utf8', 
				function(){
					loadPrintSettings(true);
				}
			);
		}
		/*--------------------------------------------------*/

		
	}
]);