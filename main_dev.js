// Modules to control application life and create native browser window
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const MytyClient = require("./mytyClient");

var myty;
var mainWindow;
var processCommand;
var appName = "MYTY Camera Dev";
var protocol = "mytycamdev";

function runMytyCamera() {
  shell.openPath(appName + ".exe").then((r) => {
    app.quit();
  });
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(protocol, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(protocol);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    processCommand = commandLine;

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();
    myty = new MytyClient();
    processCommand = process.argv;

    app.on("activate", function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    myty.on("connected", function () {
      if (process.platform == "win32" && processCommand.length > 0) {
        // Keep only command line / deep linked arguments
        const deeplinkUrl = processCommand[processCommand.length - 1];

        if (deeplinkUrl.startsWith(protocol + "://") === true) {
          myty.linkDeeplink(deeplinkUrl);
        }
      }
    });

    myty.on("command", function (command) {
      if (command.cmd === "kill") {
        myty.close();
        app.quit();
      }
    });

    myty.on("connection-fail", function () {
      myty.close();
      runMytyCamera();
    });
  });

  app.on("open-url", (event, url) => {
    if (myty.connected && url.startsWith(protocol + "://") === true) {
      myty.linkDeeplink(url);
    }
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.
}
