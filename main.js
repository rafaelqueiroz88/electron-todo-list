const electron = require('electron')
const url = require('url')
const path = require('path')

var MongoClient = require('mongodb').MongoClient
var mongoUrl = "mongodb://localhost:27017/"

const {app, BrowserWindow, Menu, ipcMain} = electron

MongoClient.connect(mongoUrl, function(err, db) {
    if (err) throw err
    var dbo = db.db("todo")
    dbo.createCollection("todo_items", function(err, res) {
        if (err) throw err
        console.log("Collection created!")
        db.close()
    });
})

// Keep it in mongoDb
function CreateTODOItem(object) {
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) throw err
        var dbo = db.db("todo")
        dbo.collection("todo_items").insertOne(object, function(err, res) {
            if (err) throw err
            db.close()
        })
    })
}

// Get from mongoDb
function GetTODOItems() {
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) throw err
        var dbo = db.db("todo")
        dbo.collection("todo_items").find({}).sort({_id: -1}).toArray(function(err, result) {
            if (err) throw err
            db.close()
            mainWindow.webContents.send('item:add', result)
        })        
    })
}

let mainWindow
let addCardWindow

// Listen for app to be ready
app.on('ready', function(){
    // Create a window
    mainWindow = new BrowserWindow({})

    // Load html inside this window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Quit app once mainWindow is closed
    mainWindow.on('closed', function(){
        app.quit()
    })

    // Load menu from template
    const mainMenu = Menu.buildFromTemplate(mainAppMenu)

    // Insert Menu
    Menu.setApplicationMenu(mainMenu)
})

// Populate TODO list once the application starts
GetTODOItems()

// Create a window to add cards
function createAddCardWindow(){
    // Create a window
    addCardWindow = new BrowserWindow({
        width: 320,
        height: 210,
        title: 'Adicionar Nova Carta'
    })

    // Load html inside this window
    addCardWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'newTODOWindow.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Garbage collector after close addCardWindow
    addCardWindow.on('close', function(){
        addCardWindow = null
    })

    // Load menu from template
    const mainMenu = Menu.buildFromTemplate(mainAppMenu)

    // Insert Menu
    Menu.setApplicationMenu(mainMenu)
}

// Create a menu
const mainAppMenu = [
    {
        label: 'Arquivo',
        submenu: [
            {
                label: 'Nova Tarefa',
                accelerator: process.platform == 'darwin' ? 'Command+N' : 'Ctrl+N',
                click(){
                    createAddCardWindow()
                }
            },
            {
                label: 'Excluir Tarefas',
                click(){
                    mainWindow.webContents.send('item:clear')
                }
            },
            {
                label: 'Fechar',
                // Verifica se é MAC ou Win/Linux, se for Mac acrescenta o atalho para a tecla command
                // Se não, acrescenta o atalho para a tecla Ctrl
                accelerator: process.platform == 'darwin' ? 'Command+F' : 'Ctrl+F',
                click(){
                    app.quit()
                }
            }
        ]
    }
]

// If running on mac, add empty object
if(process.platform == 'darwin'){
    mainAppMenu.unshift({})
}

// Add developer tools if not in production
if(process.env.NODE_ENV !== 'production'){
    mainAppMenu.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle Dev Tools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

// Catch item:add
ipcMain.on('item:add', function(e, items){
    var myobj = {item: items, type: "tarefa a fazer"}

    CreateTODOItem(myobj)
    GetTODOItems()
    
    addCardWindow.close()
})

// Populate aplication on load
ipcMain.on('ready', function(e){
    GetTODOItems()
})