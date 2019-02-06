'use strict';

import * as io from 'socket.io-client';

const {BrowserWindow, Menu, app, shell, dialog, session} = require('electron').remote;
const qs = require ("query-string");
const path = require(`path`);

const bbossURL = 'http://bboss.paul';
const fileSystem = require('fs');

const PDFWindow = require('electron-pdf-window');

angular.module('companionApp', []).

controller('CompanionController', ['$scope', '$http',
	function($scope, $http){

		var bb = this;
	
		/*------------------- CONNECTION -------------------*/
		this.connection = undefined;

		this.token = undefined;

		this.connect = function(){
			bb.loading = true;
			//$http.get(bbossURL + '/companion/checkConnection/' + self.token)
			$http.get(bbossURL + '/companion/checkConnection/' + bb.token)
			.then(
				function(response){ //success
					bb.events.push(response.data.event);
					bb.connection = response.data;
					listen();
					bb.loading = false;
					new Audio('../src/assets/sounds/connected.mp3').play();
				},
				function(response){ //error

				}
			);

		};

		function listen(){
			let socket = new io.connect(bbossURL + ':3000')
			socket.on('bboss:companion-' + bb.connection.token,
				function(event){
					bb.events.unshift(event);
					$scope.$apply();
					eventQueue(event);
				}
			);
		};
		/*--------------------------------------------------*/

		/*--------------------- EVENTS ---------------------*/
		this.events = [];

		this.eventIcon = function(event){
			if(event.type == 'connected'){
				return 'fa-broadcast-tower';
			}
			else{
				return 'fa-print';
			}
		};

		function eventQueue(evt){
			console.log(evt);
		
			print(evt);
		};


		
		/*--------------------------------------------------*/

		/*-------------------- PRINTING --------------------*/
		let printWindow = null;
		function print(event){
			// Create window
			getPrinter(event.type,
				function(printer){
					(function p(page){
						console.log(bbossURL + '/companion/request/' + event.requestToken  + '/' + bb.connection.token + '/' + page);
						printWindow = new BrowserWindow({
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
							printWindow.webContents.print({silent: true, deviceName : printer});
						
							//close window after print order.
							printWindow = null;

							//if there are more pages, call self with next
							if(page < event.pages){
								p(page + 1);
							}
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

		// (function initialise(){
		// 	listPrinters();
		// })();
		
	}
]);