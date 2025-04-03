const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database'); // Import file quản lý SQLite

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://localhost:4200');
});

// Lắng nghe sự kiện từ Angular để lấy dữ liệu nhân viên

ipcMain.handle('getDepartments', async () => await db.getDepartments());
ipcMain.handle('addDepartment', async (_, code, name) => await db.addDepartment(code, name));
ipcMain.handle('deleteDepartment', async (_, id) => await db.deleteDepartment(id));

ipcMain.handle('getEmployees', async () => await db.getEmployees());
ipcMain.handle('addEmployee', async (_, code, name, departmentId) => await db.addEmployee(code, name, departmentId));
ipcMain.handle('deleteEmployee', async (_, id) => await db.deleteEmployee(id));

ipcMain.handle('getAttendance', async (_, filters) => await db.getAttendance(filters));
ipcMain.handle('addAttendance', async (_, attendanceData) =>
  await db.addAttendance(attendanceData.employeeId, attendanceData.date, attendanceData.timeIn, attendanceData.timeOut,
    attendanceData.totalHours, attendanceData.lunchStart, attendanceData.lunchEnd, attendanceData.lunchHours, attendanceData.note)
);
ipcMain.handle('deleteAttendance', async (_, id) => await db.deleteAttendance(id));

ipcMain.handle('openDevTools', () => mainWindow.webContents.openDevTools());
