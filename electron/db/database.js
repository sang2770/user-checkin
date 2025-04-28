const { Database } = require("sqlite3").verbose();
const { app } = require("electron");
const path = require("path");
const dbPath = path.join(app.getPath("userData"), "employees.db");
const db = new Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
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
      db.run(
        "INSERT INTO positions (code, name) VALUES (?, ?)",
        [code, name],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  },

  updatePosition: (id, code, name) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE positions SET code = ?, name = ? WHERE id = ?",
        [code, name, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
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
      db.run(
        "INSERT INTO departments (code, name) VALUES (?, ?)",
        [code, name],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  },

  updateDepartment: (id, code, name) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE departments SET code = ?, name = ? WHERE id = ?",
        [code, name, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
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
      db.run(
        "INSERT INTO employees (code, name, departmentId, positionId) VALUES (?, ?, ?, ?)",
        [code, name, departmentId, positionId],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        }
      );
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
      db.run(
        "UPDATE employees SET code = ?, name = ?, departmentId = ?, positionId = ? WHERE id = ?",
        [code, name, departmentId, positionId, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  },

  getAttendance: (filters) => {
    let query = `SELECT a.*, e.id as employeeId, e.name as employeeName, e.code as employeeCode,
                 e.departmentId as departmentId, e.positionId as positionId
                 FROM attendance a
                 LEFT JOIN employees e ON a.employeeId = e.id
                 WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM attendance a 
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
    if (filters.startDate) {
      const vnDate = new Date(filters.startDate.getTime() + 7 * 60 * 60 * 1000);
      filters.startDate = vnDate.toISOString().split("T")[0];
      const condition = " AND a.date >= ?";
      query += condition;
      countQuery += condition;
      params.push(filters.startDate);
      countParams.push(filters.startDate);
    }
    if (filters.endDate) {
      filters.endDate = new Date(
        filters.endDate.getTime() + 7 * 60 * 60 * 1000
      );
      filters.endDate = filters.endDate.toISOString().split("T")[0];
      const condition = " AND a.date <= ?";
      query += condition;
      countQuery += condition;
      params.push(filters.endDate);
      countParams.push(filters.endDate);
    }

    if (Array.isArray(filters.employeeIds) && filters.employeeIds.length > 0) {
      const placeholders = filters.employeeIds.map(() => "?").join(", ");
      const condition = ` AND a.employeeId IN (${placeholders})`;
      query += condition;
      countQuery += condition;
      params.push(...filters.employeeIds);
      countParams.push(...filters.employeeIds);
    }

    if (
      Array.isArray(filters.departmentIds) &&
      filters.departmentIds.length > 0
    ) {
      const placeholders = filters.departmentIds.map(() => "?").join(", ");
      const condition = ` AND e.departmentId IN (${placeholders})`;
      query += condition;
      countQuery += condition;
      params.push(...filters.departmentIds);
      countParams.push(...filters.departmentIds);
    }

    if (Array.isArray(filters.positionIds) && filters.positionIds.length > 0) {
      const placeholders = filters.positionIds.map(() => "?").join(", ");
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

    console.log("Qurty:", query, params);
    let page = 1;
    let limit = 10;
    // Add pagination
    if (filters.page !== undefined && filters.limit !== undefined) {
      page = filters.page || 1;
      limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    return new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, countRow) => {
        if (err) return reject(err);

        db.all(query, params, (err, rows) => {
          if (err) return reject(err);

          resolve({
            data: rows,
            pagination: {
              total: countRow.total,
              page: page,
              limit: limit,
              totalPages: Math.ceil(countRow.total / limit),
            },
          });
        });
      });
    });
  },

  getAttendanceCount: (qu) => {},

  addAttendance: (
    employeeId,
    date,
    timeIn,
    timeOut,
    totalHours,
    lunchStart,
    lunchEnd,
    lunchHours,
    note
  ) => {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO attendance (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          employeeId,
          date,
          timeIn,
          timeOut,
          totalHours,
          lunchStart,
          lunchEnd,
          lunchHours,
          note,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        }
      );
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
        db.run("BEGIN TRANSACTION");

        // Process in batches to avoid too many parameters
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batchIds = ids.slice(i, i + BATCH_SIZE);
          const placeholders = batchIds.map(() => "?").join(",");
          const query = `DELETE FROM attendance WHERE id IN (${placeholders})`;

          db.run(query, batchIds, function (err) {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }
            totalDeleted += this.changes;
          });
        }

        db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            db.run("ROLLBACK");
            return reject(commitErr);
          }
          resolve({ deletedCount: totalDeleted });
        });
      });
    });
  },

  updateAttendance: (id, attendanceData) => {
    return new Promise((resolve, reject) => {
      db.run(
        "UPDATE attendance SET employeeId = ?, date = ?, timeIn = ?, timeOut = ?, totalHours = ?, lunchStart = ?, lunchEnd = ?, lunchHours = ?, note = ? WHERE id = ?",
        [
          attendanceData.employeeId,
          attendanceData.date,
          attendanceData.timeIn,
          attendanceData.timeOut,
          attendanceData.totalHours,
          attendanceData.lunchStart,
          attendanceData.lunchEnd,
          attendanceData.lunchHours,
          attendanceData.note,
          id,
        ],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  },

  importAttendance: (attendanceList) => {
    return new Promise((resolve, reject) => {
      const BATCH_SIZE = 500;
      const totalBatches = Math.ceil(attendanceList.length / BATCH_SIZE);

      if (
        !attendanceList ||
        !Array.isArray(attendanceList) ||
        attendanceList.length === 0
      ) {
        return reject(new Error("Invalid or empty attendance list"));
      }

      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Chuẩn bị câu lệnh INSERT với nhiều giá trị
        const placeholders = "(?, ?, ?, ?, ?, ?, ?, ?, ?)";
        const stmt = db.prepare(`INSERT OR IGNORE INTO attendance 
          (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note) 
          VALUES ${placeholders}`);

        let insertedCount = 0;

        try {
          for (let i = 0; i < totalBatches; i++) {
            const batch = attendanceList.slice(
              i * BATCH_SIZE,
              (i + 1) * BATCH_SIZE
            );

            for (const item of batch) {
              // Kiểm tra dữ liệu đầu vào
              if (!item.employeeId || !item.date) {
                console.warn(
                  `Skipping invalid item: employeeId=${item.employeeId}, date=${item.date}`
                );
                continue;
              }

              // Chèn bản ghi
              stmt.run(
                [
                  item.employeeId,
                  item.date,
                  item.timeIn || null,
                  item.timeOut || null,
                  item.totalHours || null,
                  item.lunchStart || null,
                  item.lunchEnd || null,
                  item.lunchHours || null,
                  item.note || null,
                ],
                (err) => {
                  if (err) {
                    console.error(
                      `Error inserting attendance for employeeId=${item.employeeId}:`,
                      err
                    );
                  } else {
                    insertedCount++;
                  }
                }
              );
            }
          }

          stmt.finalize((err) => {
            if (err) {
              db.run("ROLLBACK");
              return reject(
                new Error(`Failed to finalize statement: ${err.message}`)
              );
            }

            db.run("COMMIT", (commitErr) => {
              if (commitErr) {
                db.run("ROLLBACK");
                return reject(
                  new Error(
                    `Failed to commit transaction: ${commitErr.message}`
                  )
                );
              }
              resolve({ insertedCount, total: attendanceList.length });
            });
          });
        } catch (error) {
          db.run("ROLLBACK");
          reject(new Error(`Transaction failed: ${error.message}`));
        }
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
      db.run(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [key, value, value],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
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
      db.run(
        `
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
          device.command,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // Cập nhật thiết bị
  updateDevice: (id, device) => {
    return new Promise((resolve, reject) => {
      db.run(
        `
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
          id,
        ],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
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
  },
};
