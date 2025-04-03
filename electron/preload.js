const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDepartments: () => ipcRenderer.invoke('getDepartments'),
  addDepartment: (code, name) => ipcRenderer.invoke('addDepartment', code, name),
  deleteDepartment: (id) => ipcRenderer.invoke('deleteDepartment', id),

  getEmployees: () => ipcRenderer.invoke('getEmployees'),
  addEmployee: (code, name, departmentId) => ipcRenderer.invoke('addEmployee', code, name, departmentId),
  deleteEmployee: (id) => ipcRenderer.invoke('deleteEmployee', id),

  getAttendance: (filters) => ipcRenderer.invoke('getAttendance', filters),
  addAttendance: (attendanceData) => ipcRenderer.invoke('addAttendance', attendanceData),
  deleteAttendance: (id) => ipcRenderer.invoke('deleteAttendance', id),

  openDevTools: () => ipcRenderer.invoke('openDevTools'),
});

