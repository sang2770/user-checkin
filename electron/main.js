const { app, BrowserWindow, ipcMain } = require('electron');
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

  // mainWindow.loadURL(
  //   url.format({
  //     pathname: path.join(__dirname, `dist/user-checkin/browser/index.html`),
  //     protocol: "file:",
  //     slashes: true
  //   })
  // );

  mainWindow.loadURL("http://localhost:4200");
  mainWindow.webContents.openDevTools();
  autoUpdater.checkForUpdatesAndNotify();
  // mainWindow.setMenuBarVisibility(false);
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