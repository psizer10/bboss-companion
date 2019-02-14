import { app, BrowserWindow } from 'electron';
const path = require('path')
const glob = require('glob')

var nodeConsole = require('console');
var myConsole = new nodeConsole.Console(process.stdout, process.stderr);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
	app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {

	// Create the browser window.
	mainWindow = new BrowserWindow({
		name : 'BBOSS Companion',
		// width: 600,
		// height: 440,
		width: 600,
		height: 1000,
		webPreferences: {
			plugins: false,
			security : false
		},
		icon : path.join(__dirname, 'src/assets/images/bbossLogo.png')
	//	frame : false
	});

	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`);

	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});


	// let contents = mainWindow.webContents
	//contents.print({silent: true, printBackground: false, deviceName: 'EPSON_Stylus_Photo_1400'})
	//myConsole.log(contents.getPrinters());
//	sock();
//	openSettingsWindow();
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) {
		createWindow();
	}
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// function loadJS () {
//   const files = glob.sync(path.join(__dirname, 'assets/js/*.js'))
//   files.forEach((file) => { require(file) })
// }
function openSettingsWindow(){
	settingsWindow = new BrowserWindow({
		name : 'BBOSS Companion Settings',
		width: 200,
		height: 200,
		//frame : false
	});

	//settingsWindow.loadURL(`https://www.bboss.biz`);
}



