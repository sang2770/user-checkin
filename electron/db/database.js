const { Database } = require('sqlite3').verbose();
const { app } = require('electron');
const path = require('path');
const dbPath = path.join(app.getPath('userData'), 'employees.db');
const db = new Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});
db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE,
            name TEXT
        )
    `);

  db.run(`
        CREATE TABLE IF NOT EXISTS positions (
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
            positionId INTEGER,
            FOREIGN KEY(departmentId) REFERENCES departments(id) ON DELETE SET NULL,
            FOREIGN KEY(positionId) REFERENCES positions(id) ON DELETE SET NULL
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
  db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE,
            value TEXT
        )
    `);
  db.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        serial_number TEXT UNIQUE,
        area TEXT,
        ip_address TEXT,
        status TEXT,
        last_active DATE,
        user TEXT,
        fingerprint TEXT,
        face TEXT,
        palm TEXT,
        event TEXT,
        command TEXT
      )
    `);
});

module.exports = {
  getPositions: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM positions", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },
  addPosition: (code, name) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO positions (code, name) VALUES (?, ?)",
        [code, name],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        });
    });
  },

  updatePosition: (id, code, name) => {
    return new Promise((resolve, reject) => {
      db.run("UPDATE positions SET code = ?, name = ? WHERE id = ?",
        [code, name, id],
        (err) => {
          if (err) reject(err);
          resolve();
        });
    });
  },

  deletePosition: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM positions WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  },
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

  updateDepartment: (id, code, name) => {
    return new Promise((resolve, reject) => {
      db.run("UPDATE departments SET code = ?, name = ? WHERE id = ?",
        [code, name, id],
        (err) => {
          if (err) reject(err);
          resolve();
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

  getEmployees: (filters) => {
    let query = "SELECT e.* FROM employees e WHERE 1=1";
    let params = [];
    if (filters.departmentId) {
      query += " AND e.departmentId = ?";
      params.push(filters.departmentId);
    }
    if (filters.positionId) {
      query += " AND e.positionId = ?";
      params.push(filters.positionId);
    }
    if (filters.keyword) {
      query += " AND (e.name LIKE ? OR e.code LIKE ?)";
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    if (filters.ids) {
      query += " AND e.id IN (?)";
      params.push(filters.ids);
    }


    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  addEmployee: (code, name, departmentId, positionId) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO employees (code, name, departmentId, positionId) VALUES (?, ?, ?, ?)",
        [code, name, departmentId, positionId],
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

  updateEmployee: (id, code, name, departmentId, positionId) => {
    return new Promise((resolve, reject) => {
      db.run("UPDATE employees SET code = ?, name = ?, departmentId = ?, positionId = ? WHERE id = ?",
        [code, name, departmentId, positionId, id],
        (err) => {
          if (err) reject(err);
          resolve();
        });
    });
  },

  getAttendance: (filters) => {
    let query = `SELECT a.*, e.id as employeeId, e.name as employeeName, e.code as employeeCode,
                 e.departmentId as departmentId, e.positionId as positionId
                 FROM attendance a
                 LEFT JOIN employees e ON a.employeeId = e.id
                 WHERE 1=1`;
    let countQuery = `SELECT COUNT(DISTINCT a.id) as total FROM attendance a 
                      LEFT JOIN employees e ON a.employeeId = e.id 
                      WHERE 1=1`;
    let params = [];
    let countParams = [];
    
    if (filters.date) {
      const condition = " AND a.date = ?";
      query += condition;
      countQuery += condition;
      params.push(filters.date);
      countParams.push(filters.date);
    }
    const formatDate = (isoString) => {
      return new Date(isoString).toISOString().split("T")[0]; // "2025-04-30"
    };
    if (filters.startDate) {
      const startDate = formatDate(filters.startDate);
      const condition = " AND a.date >= ?";
      query += condition;
      countQuery += condition;
      params.push(startDate);
      countParams.push(startDate);
    }
    if (filters.endDate) {
      const endDate = formatDate(filters.endDate);
      const condition = " AND a.date <= ?";
      query += condition;
      countQuery += condition;
      params.push(endDate);
      countParams.push(endDate);
    }

    if (Array.isArray(filters.employeeIds) && filters.employeeIds.length > 0) {
      const placeholders = filters.employeeIds.map(() => '?').join(', ');
      const condition = ` AND a.employeeId IN (${placeholders})`;
      query += condition;
      countQuery += condition;
      params.push(...filters.employeeIds);
      countParams.push(...filters.employeeIds);
    }

    if (Array.isArray(filters.departmentIds) && filters.departmentIds.length > 0) {
      const placeholders = filters.departmentIds.map(() => '?').join(', ');
      const condition = ` AND e.departmentId IN (${placeholders})`;
      query += condition;
      countQuery += condition;
      params.push(...filters.departmentIds);
      countParams.push(...filters.departmentIds);
    }

    if (Array.isArray(filters.positionIds) && filters.positionIds.length > 0) {
      const placeholders = filters.positionIds.map(() => '?').join(', ');
      const condition = ` AND e.positionId IN (${placeholders})`;
      query += condition;
      countQuery += condition;
      params.push(...filters.positionIds);
      countParams.push(...filters.positionIds);
    }

    if (filters.keyword) {
      const condition = " AND (e.name LIKE ? OR e.code LIKE ?)";
      query += condition;
      countQuery += condition;
      params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
      countParams.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
    }

    // Add pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, countRow) => {
        if (err) return reject(err);
        
        db.all(query, params, (err, rows) => {
          if (err) return reject(err);

          console.log("countRow", countRow);
          
          resolve({
            data: rows,
            pagination: {
              total: countRow.total,
              page: page,
              limit: limit,
              totalPages: Math.ceil(countRow.total / limit)
            }
          });
        });
      });
    });
  },

  getAttendanceCount: (qu ) => {
    
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

  deleteAllAttendance: () => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM attendance", (err) => {
        if (err) reject(err);
        resolve();
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
  },

  deleteAttendancesByIds: (ids) => {
    return new Promise((resolve, reject) => {
      if (!ids || ids.length === 0) {
        return resolve({ deletedCount: 0 }); // không có gì để xóa
      }
  
      const BATCH_SIZE = 500;
      let totalDeleted = 0;
  
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
  
        // Process in batches to avoid too many parameters
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batchIds = ids.slice(i, i + BATCH_SIZE);
          const placeholders = batchIds.map(() => '?').join(',');
          const query = `DELETE FROM attendance WHERE id IN (${placeholders})`;
  
          db.run(query, batchIds, function(err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            totalDeleted += this.changes;
          });
        }
  
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            db.run('ROLLBACK');
            return reject(commitErr);
          }
          resolve({ deletedCount: totalDeleted });
        });
      });
    });
  },

  updateAttendance: (id, attendanceData) => {
    return new Promise((resolve, reject) => {
      db.run("UPDATE attendance SET employeeId = ?, date = ?, timeIn = ?, timeOut = ?, totalHours = ?, lunchStart = ?, lunchEnd = ?, lunchHours = ?, note = ? WHERE id = ?",
        [attendanceData.employeeId, attendanceData.date, attendanceData.timeIn, attendanceData.timeOut, attendanceData.totalHours, attendanceData.lunchStart, attendanceData.lunchEnd, attendanceData.lunchHours, attendanceData.note, id],
        (err) => {
          if (err) reject(err);
          resolve();
        });
    });
  },

  importAttendance: (attendanceList) => {    
    return new Promise((resolve, reject) => {

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(`INSERT INTO attendance
          (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

          for (const item of attendanceList) {
            stmt.run([
              item.employeeId,
              item.date,
              item.timeIn,
              item.timeOut,
              item.totalHours,
              item.lunchStart,
              item.lunchEnd,
              item.lunchHours,
              item.note
            ]);
          }

        stmt.finalize((err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              db.run('ROLLBACK');
              return reject(commitErr);
            }
            resolve();
          });
        });
      });
    });
  },

  getSettings: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  setSetting: (key, value) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [key, value, value],
        (err) => {
          if (err) reject(err);
          resolve();
        });
    });
  },
  getDevices: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM devices", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  // Thêm thiết bị mới
  addDevice: (device) => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO devices (
          name, serial_number, area, ip_address, status, last_active,
          user, fingerprint, face, palm, event, command
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          device.name,
          device.serial_number,
          device.area,
          device.ip_address,
          device.status,
          device.last_active,
          device.user,
          device.fingerprint,
          device.face,
          device.palm,
          device.event,
          device.command
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        });
    });
  },

  // Cập nhật thiết bị
  updateDevice: (id, device) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE devices SET
          name = ?, serial_number = ?, area = ?, ip_address = ?, status = ?, last_active = ?,
          user = ?, fingerprint = ?, face = ?, palm = ?, event = ?, command = ?
        WHERE id = ?`,
        [
          device.name,
          device.serial_number,
          device.area,
          device.ip_address,
          device.status,
          device.last_active,
          device.user,
          device.fingerprint,
          device.face,
          device.palm,
          device.event,
          device.command,
          id
        ],
        (err) => {
          if (err) reject(err);
          resolve();
        });
    });
  },

  // Xóa thiết bị
  deleteDevice: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM devices WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
};
