const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/employees.db');

db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            name TEXT
        )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            name TEXT,
            departmentId INTEGER,
            FOREIGN KEY(departmentId) REFERENCES departments(id) ON DELETE SET NULL
        )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER,
            date TEXT,
            timeIn TEXT,
            timeOut TEXT,
            totalHours REAL,
            lunchStart TEXT,
            lunchEnd TEXT,
            lunchHours REAL,
            note TEXT,
            FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE CASCADE
        )
    `);
});

module.exports = {
  getDepartments: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM departments", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  addDepartment: (code, name) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO departments (code, name) VALUES (?, ?)",
        [code, name],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        });
    });
  },

  deleteDepartment: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM departments WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },

  getEmployees: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT e.*, d.name AS department FROM employees e LEFT JOIN departments d ON e.departmentId = d.id", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  addEmployee: (code, name, departmentId) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO employees (code, name, departmentId) VALUES (?, ?, ?)",
        [code, name, departmentId],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        });
    });
  },

  deleteEmployee: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM employees WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },

  getAttendance: (filters) => {
    let query = "SELECT a.*, e.name AS employee, e.code AS employeeCode, d.name AS department FROM attendance a JOIN employees e ON a.employeeId = e.id LEFT JOIN departments d ON e.departmentId = d.id WHERE 1=1";
    let params = [];

    if (filters.date) {
      query += " AND a.date = ?";
      params.push(filters.date);
    }
    if (filters.department) {
      query += " AND d.name = ?";
      params.push(filters.department);
    }
    if (filters.name) {
      query += " AND e.name LIKE ?";
      params.push(`%${filters.name}%`);
    }

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  addAttendance: (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO attendance (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        });
    });
  },

  deleteAttendance: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM attendance WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
};
