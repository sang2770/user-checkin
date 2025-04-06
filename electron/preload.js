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

  getDevices: () => ipcRenderer.invoke('getDevices'),
  addDevice: (device) => ipcRenderer.invoke('addDevice', device),
  updateDevice: (id, device) => ipcRenderer.invoke('updateDevice', id, device),
  deleteDevice: (id) => ipcRenderer.invoke('deleteDevice', id),

  importAttendance: (attendanceList) => ipcRenderer.invoke('importAttendance', attendanceList),

  openDevTools: () => ipcRenderer.invoke('openDevTools'),

  getSettings: () => ipcRenderer.invoke('getSettings'),
  setSetting: (key, value) => ipcRenderer.invoke('setSetting', key, value),
});

