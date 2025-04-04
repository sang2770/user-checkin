const { app, BrowserWindow, ipcMain } = require('electron');
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
});

// Lắng nghe sự kiện từ Angular để lấy dữ liệu nhân viên

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
  const dataList = await db.getAttendance(filters);
  const employeeList = await db.getEmployees({});
  const departmentList = await db.getDepartments();
  const positionList = await db.getPositions();
  employeeList.forEach(employee => {
    employee.department = departmentList.find(department => department.id === employee.departmentId);
    employee.position = positionList.find(position => position.id === employee.positionId);
  });

  return dataList.map(item => ({
    ...item,
    employee: employeeList.find(employee => employee.id === item.employeeId)
  }));
});
ipcMain.handle('addAttendance', async (_, attendanceData) => {
  return await db.addAttendance(attendanceData.employeeId, attendanceData.date, attendanceData.timeIn, attendanceData.timeOut,
    attendanceData.totalHours, attendanceData.lunchStart, attendanceData.lunchEnd, attendanceData.lunchHours, attendanceData.note);
}
);
ipcMain.handle('deleteAttendance', async (_, id) => await db.deleteAttendance(id))
ipcMain.handle('updateAttendance', async (_, id, attendanceData) => await db.updateAttendance(id, attendanceData));
ipcMain.handle('importAttendance', async (_, attendanceList) => {
  const employeeList = await db.getEmployees({});
  const departmentList = await db.getDepartments();
  const positionList = await db.getPositions();

  // Tạo map để tra cứu nhanh
  const departmentMap = new Map(departmentList.map(dep => [dep.name, dep]));
  const positionMap = new Map(positionList.map(pos => [pos.name, pos]));

  // Dùng employeeCode làm key
  const employeeMap = new Map(employeeList.map(emp => [emp.code, emp]));

  for (const item of attendanceList) {
    // Tạo department nếu chưa có
    let department = departmentMap.get(item.departmentName);
    if (!department && item.departmentName?.length > 0) {
      const newDepartment = await db.addDepartment(item.departmentName, item.departmentName);
      department = { id: newDepartment.id, name: item.departmentName };
      departmentMap.set(item.departmentName, department);
    }

    // Tạo position nếu chưa có (nếu cần)
    let position = positionMap.get(item.positionName);
    if (!position && item.positionName?.length > 0) {
      const newPosition = await db.addPosition(item.positionName, item.positionName);
      position = { id: newPosition.id, name: item.positionName };
      positionMap.set(item.positionName, position);
    }

    // Tạo employee nếu chưa có — theo employeeCode
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

    // Cập nhật employeeId để insert vào bảng attendance
    item.employeeId = employee?.id;
  }

  // Insert danh sách attendance
  return await db.importAttendance(attendanceList);
});



ipcMain.handle('openDevTools', () => mainWindow.webContents.openDevTools());
