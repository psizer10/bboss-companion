
const {BrowserWindow, app, Menu} = require('electron');
const path = require('path')
const glob = require('glob')

var nodeConsole = require('console');
var myConsole = new nodeConsole.Console(process.stdout, process.stderr);

require('update-electron-app')(
	{
		interval : '5 minutes'
	}
)

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
		 width: 600,
		 height: 500,
		// width: 600,
		// height: 1000,
		webPreferences: {
			plugins: false,
			security : false
		},
		icon : path.join(__dirname, 'src/assets/images/bbossLogo.png')
	//	frame : false
	});
	mainWindow.webContents.openDevTools();

	Menu.setApplicationMenu(
		Menu.buildFromTemplate(
			[
				{
					label : 'BBOSS Companion',
					submenu : [
						{
							label : 'Refresh',
							accelerator : 'CmdOrCtrl+R'
						},
						{ label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
					]
				},
				{
					label: "Edit",
					submenu: [
						{ label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
						{ label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
						{ type: "separator" },
						{ label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
						{ label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
						{ label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
						{ label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
					]
				}
			]
		)
	)


	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`);


	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
	createWindow()
});



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



