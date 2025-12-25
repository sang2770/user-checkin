const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDepartments: () => ipcRenderer.invoke('getDepartments'),
  addDepartment: (code, name) => ipcRenderer.invoke('addDepartment', code, name),
  updateDepartment: (id, code, name) => ipcRenderer.invoke('updateDepartment', id, code, name),
  deleteDepartment: (id) => ipcRenderer.invoke('deleteDepartment', id),

  getPositions: () => ipcRenderer.invoke('getPositions'),
  addPosition: (code, name) => ipcRenderer.invoke('addPosition', code, name),
  updatePosition: (id, code, name) => ipcRenderer.invoke('updatePosition', id, code, name),
  deletePosition: (id) => ipcRenderer.invoke('deletePosition', id),

  getEmployees: (filters) => ipcRenderer.invoke('getEmployees', filters),
  addEmployee: (code, name, departmentId, positionId) => ipcRenderer.invoke('addEmployee', code, name, departmentId, positionId),
  updateEmployee: (id, code, name, departmentId, positionId) => ipcRenderer.invoke('updateEmployee', id, code, name, departmentId, positionId),
  deleteEmployee: (id) => ipcRenderer.invoke('deleteEmployee', id),

  getAttendance: (filters) => ipcRenderer.invoke('getAttendance', filters),
  addAttendance: (attendanceData) => ipcRenderer.invoke('addAttendance', attendanceData),
  deleteAttendance: (id) => ipcRenderer.invoke('deleteAttendance', id),
  updateAttendance: (id, attendanceData) => ipcRenderer.invoke('updateAttendance', id, attendanceData),
  deleteAttendancesByIds: (ids) => ipcRenderer.invoke('deleteAttendancesByIds', ids),
  deleteAllAttendance: () => ipcRenderer.invoke('deleteAllAttendance'),

  getDevices: () => ipcRenderer.invoke('getDevices'),
  addDevice: (device) => ipcRenderer.invoke('addDevice', device),
  updateDevice: (id, device) => ipcRenderer.invoke('updateDevice', id, device),
  deleteDevice: (id) => ipcRenderer.invoke('deleteDevice', id),

  importAttendance: (attendanceList) => ipcRenderer.invoke('importAttendance', attendanceList),

  openDevTools: () => ipcRenderer.invoke('openDevTools'),

  getSettings: () => ipcRenderer.invoke('getSettings'),
  setSetting: (key, value) => ipcRenderer.invoke('setSetting', key, value),

  // ================ INVENTORY MANAGEMENT ================

  // Ingredients
  getIngredients: () => ipcRenderer.invoke('getIngredients'),
  createIngredient: (ingredient) => ipcRenderer.invoke('createIngredient', ingredient),
  updateIngredient: (id, ingredient) => ipcRenderer.invoke('updateIngredient', id, ingredient),
  deleteIngredient: (id) => ipcRenderer.invoke('deleteIngredient', id),

  // Products
  getProducts: () => ipcRenderer.invoke('getProducts'),
  createProduct: (product) => ipcRenderer.invoke('createProduct', product),
  updateProduct: (id, product) => ipcRenderer.invoke('updateProduct', id, product),
  deleteProduct: (id) => ipcRenderer.invoke('deleteProduct', id),

  // Recipes
  getRecipes: () => ipcRenderer.invoke('getRecipes'),
  getRecipesByProduct: (productId) => ipcRenderer.invoke('getRecipesByProduct', productId),
  createRecipe: (recipe) => ipcRenderer.invoke('createRecipe', recipe),
  updateRecipe: (id, recipe) => ipcRenderer.invoke('updateRecipe', id, recipe),
  deleteRecipe: (id) => ipcRenderer.invoke('deleteRecipe', id),
  createProductFromIngredient: (ingredientId) => ipcRenderer.invoke('createProductFromIngredient', ingredientId),

  // Stock Entries
  getStockEntries: () => ipcRenderer.invoke('getStockEntries'),
  createStockEntry: (stockEntry) => ipcRenderer.invoke('createStockEntry', stockEntry),

  // Sales
  getSaleOrders: () => ipcRenderer.invoke('getSaleOrders'),
  createSaleOrder: (saleOrder, items) => ipcRenderer.invoke('createSaleOrder', saleOrder, items),
  getSaleOrderItems: (saleOrderId) => ipcRenderer.invoke('getSaleOrderItems', saleOrderId),

  // Import Sales from Excel
  importSalesFromExcel: (fileBuffer) => ipcRenderer.invoke('importSalesFromExcel', fileBuffer),
  clearSalesHistory: () => ipcRenderer.invoke('clearSalesHistory'),

  // Reports
  getDailyReport: (date) => ipcRenderer.invoke('getDailyReport', date),
  getInventoryReport: () => ipcRenderer.invoke('getInventoryReport'),
  getOrdersByDate: (date) => ipcRenderer.invoke('getOrdersByDate', date),
  getProfitLossReport: (date) => ipcRenderer.invoke('getProfitLossReport', date),
  getMonthlyProfitLossReport: (year, month) => ipcRenderer.invoke('getMonthlyProfitLossReport', year, month),

});

