const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const db = require("./db/database");
const url = require("url");
let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `dist/user-checkin/browser/index.html`),
      protocol: "file:",
      slashes: true
    })
  );

  // mainWindow.loadURL("http://localhost:4200");
  // mainWindow.webContents.openDevTools();
  autoUpdater.checkForUpdatesAndNotify();
  mainWindow.setMenuBarVisibility(false);
});

// Lắng nghe sự kiện từ Angular để lấy dữ liệu
ipcMain.handle('getSettings', async () => await db.getSettings());
ipcMain.handle('setSetting', async (_, key, value) => await db.setSetting(key, value));


ipcMain.handle('openDevTools', () => {
  mainWindow.webContents.openDevTools()
});

// ================ INVENTORY MANAGEMENT IPC HANDLERS ================

// Ingredients
ipcMain.handle('getIngredients', async () => await db.getIngredients());
ipcMain.handle('createIngredient', async (_, ingredient) => await db.createIngredient(ingredient));
ipcMain.handle('updateIngredient', async (_, id, ingredient) => await db.updateIngredient(id, ingredient));
ipcMain.handle('deleteIngredient', async (_, id) => await db.deleteIngredient(id));

// Products
ipcMain.handle('getProducts', async () => await db.getProducts());
ipcMain.handle('createProduct', async (_, product) => await db.createProduct(product));
ipcMain.handle('updateProduct', async (_, id, product) => await db.updateProduct(id, product));
ipcMain.handle('deleteProduct', async (_, id) => await db.deleteProduct(id));

// Recipes
ipcMain.handle('getRecipes', async () => await db.getRecipes());
ipcMain.handle('getRecipesByProduct', async (_, productId) => await db.getRecipesByProduct(productId));
ipcMain.handle('createRecipe', async (_, recipe) => await db.createRecipe(recipe));
ipcMain.handle('updateRecipe', async (_, id, recipe) => await db.updateRecipe(id, recipe));
ipcMain.handle('deleteRecipe', async (_, id) => await db.deleteRecipe(id));
ipcMain.handle('createProductFromIngredient', async (_, ingredientId) => await db.createProductFromIngredient(ingredientId));

// Stock Entries
ipcMain.handle('getStockEntries', async () => await db.getStockEntries());
ipcMain.handle('createStockEntry', async (_, stockEntry) => await db.createStockEntry(stockEntry));

// Sales
ipcMain.handle('getSaleOrders', async () => await db.getSaleOrders());
ipcMain.handle('createSaleOrder', async (_, saleOrder, items) => await db.createSaleOrder(saleOrder, items));
ipcMain.handle('getSaleOrderItems', async (_, saleOrderId) => await db.getSaleOrderItems(saleOrderId));

// Import Sales from Excel
ipcMain.handle('importSalesFromExcel', async (_, fileBuffer) => await db.importSalesFromExcel(fileBuffer));
ipcMain.handle('clearSalesHistory', async () => await db.clearSalesHistory());

// Reports
ipcMain.handle('getDailyReport', async (_, date) => await db.getDailyReport(date));
ipcMain.handle('getInventoryReport', async () => await db.getInventoryReport());
ipcMain.handle('getOrdersByDate', async (_, date) => await db.getOrdersByDate(date));
ipcMain.handle('getProfitLossReport', async (_, date) => await db.getProfitLossReport(date));
ipcMain.handle('getMonthlyProfitLossReport', async (_, year, month) => await db.getMonthlyProfitLossReport(year, month));

// Backup & Restore
ipcMain.handle('backupDatabase', async () => {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const defaultPath = `backup_${date}_${time}.db`;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Chọn vị trí lưu backup',
    defaultPath: defaultPath,
    filters: [
      { name: 'Database Files', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    throw new Error('Người dùng đã hủy backup');
  }

  return await db.backupDatabase(result.filePath);
});

ipcMain.handle('restoreDatabase', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn file backup để khôi phục',
    filters: [
      { name: 'Database Files', extensions: ['db'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled) {
    throw new Error('Người dùng đã hủy restore');
  }

  return await db.restoreDatabase(result.filePaths[0]);
});

ipcMain.handle('exportDatabaseToJson', async () => {
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const defaultPath = `backup_${date}_${time}.json`;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Xuất database ra JSON',
    defaultPath: defaultPath,
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    throw new Error('Người dùng đã hủy export');
  }

  const jsonData = await db.exportDatabaseToJson();
  const fs = require('fs');
  fs.writeFileSync(result.filePath, jsonData);

  return result.filePath;
});

ipcMain.handle('importDatabaseFromJson', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Chọn file JSON để import',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled) {
    throw new Error('Người dùng đã hủy import');
  }

  const fs = require('fs');
  const jsonData = fs.readFileSync(result.filePaths[0], 'utf8');

  return await db.importDatabaseFromJson(jsonData);
});


autoUpdater.on("update-available", () => {
  // show dialog
  dialog
    .showMessageBox({
      type: "info",
      title: "Cập nhật có sẵn",
      message: "Một bản cập nhật mới đã có sẵn. Bạn có muốn cập nhật ngay bây giờ không?",
      buttons: ["Có", "Không"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
});

autoUpdater.on("update-downloaded", () => {
  // show dialog
  dialog
    .showMessageBox({
      type: "info",
      title: "Cập nhật đã tải xuống",
      message: "Bản cập nhật đã được tải xuống. Bạn có muốn cài đặt ngay bây giờ không?",
      buttons: ["Có", "Không"],
    })
    .then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});