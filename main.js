const electron = require('electron')
const url = require('url')
const path = require('path')

const {app, BrowserWindow, Menu, ipcMain} = electron

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
        accelerator: process.platform == 'darwin' ? 'Command+A' : 'Ctrl+A',
        submenu: [
            {
                label: 'Nova Tarefa',
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
ipcMain.on('item:add', function(e, item){
    mainWindow.webContents.send('item:add', item)
    addCardWindow.close()
})