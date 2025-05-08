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

// Lắng nghe sự kiện từ Angular để lấy dữ liệu nhân viên

ipcMain.handle('getDevices', async () => await db.getDevices());
ipcMain.handle('addDevice', async (_, device) => await db.addDevice(device));
ipcMain.handle('deleteDevice', async (_, id) => await db.deleteDevice(id));
ipcMain.handle('updateDevice', async (_, id, device) => await db.updateDevice(id, device));

ipcMain.handle('getDepartments', async () => await db.getDepartments());
ipcMain.handle('addDepartment', async (_, code, name) => await db.addDepartment(code, name));
ipcMain.handle('deleteDepartment', async (_, id) => await db.deleteDepartment(id));
ipcMain.handle('updateDepartment', async (_, id, code, name) => await db.updateDepartment(id, code, name));

ipcMain.handle('getEmployees', async (_, filters) => await db.getEmployees(filters));
ipcMain.handle('addEmployee', async (_, code, name, departmentId, positionId) => await db.addEmployee(code, name, departmentId, positionId));
ipcMain.handle('deleteEmployee', async (_, id) => await db.deleteEmployee(id));
ipcMain.handle('updateEmployee', async (_, id, code, name, departmentId, positionId) => await db.updateEmployee(id, code, name, departmentId, positionId));

ipcMain.handle('getPositions', async () => await db.getPositions());
ipcMain.handle('addPosition', async (_, code, name) => await db.addPosition(code, name));
ipcMain.handle('deletePosition', async (_, id) => await db.deletePosition(id));
ipcMain.handle('updatePosition', async (_, id, code, name) => await db.updatePosition(id, code, name));



ipcMain.handle('getAttendance', async (_, filters) => {
  const attendancePages = await db.getAttendance(filters);
  
  const dataList = attendancePages.data;
  
  const employeeList = await db.getEmployees({});
  const departmentList = await db.getDepartments();
  const positionList = await db.getPositions();
  employeeList.forEach(employee => {
    employee.department = departmentList.find(department => department.id === employee.departmentId);
    employee.position = positionList.find(position => position.id === employee.positionId);
  });

  return {
    data: dataList.map(item => ({
      ...item,
      employee: employeeList.find(employee => employee.id === item.employeeId)
    })),
    total: attendancePages.pagination.total,
    page: attendancePages.pagination.page,
    limit: attendancePages.pagination.limit
  }
});
ipcMain.handle('addAttendance', async (_, attendanceData) => {
  return await db.addAttendance(attendanceData.employeeId, attendanceData.date, attendanceData.timeIn, attendanceData.timeOut,
    attendanceData.totalHours, attendanceData.lunchStart, attendanceData.lunchEnd, attendanceData.lunchHours, attendanceData.note);
}
);
ipcMain.handle('deleteAttendance', async (_, id) => await db.deleteAttendance(id))
ipcMain.handle('deleteAttendancesByIds', async (_, ids) => await db.deleteAttendancesByIds(ids));
ipcMain.handle('updateAttendance', async (_, id, attendanceData) => await db.updateAttendance(id, attendanceData));
ipcMain.handle('deleteAllAttendance', async (_, filters) => {
  return await db.deleteAllAttendance(filters);
})
ipcMain.handle('importAttendance', async (_, attendanceList) => {
  const BATCH_SIZE = 500;
  const employeeList = await db.getEmployees({});
  const departmentList = await db.getDepartments();
  const positionList = await db.getPositions();

  const departmentMap = new Map(departmentList.map(dep => [dep.name, dep]));
  const positionMap = new Map(positionList.map(pos => [pos.name, pos]));
  const employeeMap = new Map(employeeList.map(emp => [emp.code, emp]));

  let processedItems = [];
  
  for (let i = 0; i < attendanceList.length; i += BATCH_SIZE) {
    const batch = attendanceList.slice(i, i + BATCH_SIZE);
    for (const item of batch) {
      let department = departmentMap.get(item.departmentName);
      if (!department && item.departmentName?.length > 0) {
        const newDepartment = await db.addDepartment(item.departmentName, item.departmentName);
        department = { id: newDepartment.id, name: item.departmentName };
        departmentMap.set(item.departmentName, department);
      }

      let position = positionMap.get(item.positionName);
      if (!position && item.positionName?.length > 0) {
        const newPosition = await db.addPosition(item.positionName, item.positionName);
        position = { id: newPosition.id, name: item.positionName };
        positionMap.set(item.positionName, position);
      }

      let employee = employeeMap.get(item.employeeCode);
      if (!employee && item.employeeCode?.length > 0) {
        const newEmployee = await db.addEmployee(
          item.employeeCode,
          item.employeeName,
          department?.id,
          position?.id
        );
        employee = { id: newEmployee.id, code: item.employeeCode, name: item.employeeName };
        employeeMap.set(item.employeeCode, employee);
      }

      item.employeeId = employee?.id;
      processedItems.push(item);
    }
  }

  return await db.importAttendance(processedItems);
});



ipcMain.handle('getSettings', async () => await db.getSettings());
ipcMain.handle('setSetting', async (_, key, value) => await db.setSetting(key, value));


ipcMain.handle('openDevTools', () => {
  mainWindow.webContents.openDevTools()
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