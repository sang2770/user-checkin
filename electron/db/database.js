const { Database } = require('sqlite3').verbose();
const { app } = require('electron');
const path = require('path');
const XLSX = require('xlsx');
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

  // Add new columns for Ra 3 and Vào 3 if they don't exist
  db.run(`ALTER TABLE attendance ADD COLUMN timeOut2 TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding timeOut2 column:', err.message);
    }
  });

  db.run(`ALTER TABLE attendance ADD COLUMN timeIn2 TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding timeIn2 column:', err.message);
    }
  });
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

  // Inventory Management Tables
  db.run(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        unit TEXT NOT NULL,
        currentStock REAL DEFAULT 0,
        costPrice REAL DEFAULT 0,
        lowStockAlert REAL DEFAULT 0
      )
    `);

  db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        price REAL NOT NULL,
        category TEXT,
        isActive INTEGER DEFAULT 1
      )
    `);

  db.run(`
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        productId INTEGER,
        ingredientId INTEGER,
        quantity REAL NOT NULL,
        FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY(ingredientId) REFERENCES ingredients(id) ON DELETE CASCADE
      )
    `);

  db.run(`
      CREATE TABLE IF NOT EXISTS stock_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT NOT NULL,
        ingredientId INTEGER,
        quantity REAL NOT NULL,
        unitPrice REAL NOT NULL,
        totalCost REAL NOT NULL,
        supplier TEXT,
        note TEXT,
        FOREIGN KEY(ingredientId) REFERENCES ingredients(id) ON DELETE CASCADE
      )
    `);

  db.run(`
      CREATE TABLE IF NOT EXISTS sale_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        date TEXT NOT NULL,
        employeeId INTEGER,
        totalAmount REAL NOT NULL,
        note TEXT,
        FOREIGN KEY(employeeId) REFERENCES employees(id) ON DELETE SET NULL
      )
    `);

  db.run(`
      CREATE TABLE IF NOT EXISTS sale_order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        saleOrderId INTEGER,
        productId INTEGER,
        quantity REAL NOT NULL,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        FOREIGN KEY(saleOrderId) REFERENCES sale_orders(id) ON DELETE CASCADE,
        FOREIGN KEY(productId) REFERENCES products(id) ON DELETE CASCADE
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

  getAttendanceCount: (qu) => {

  },

  addAttendance: (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note, timeOut2, timeIn2) => {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO attendance (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note, timeOut2, timeIn2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note, timeOut2, timeIn2],
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

          db.run(query, batchIds, function (err) {
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
      db.run("UPDATE attendance SET employeeId = ?, date = ?, timeIn = ?, timeOut = ?, totalHours = ?, lunchStart = ?, lunchEnd = ?, lunchHours = ?, note = ?, timeOut2 = ?, timeIn2 = ? WHERE id = ?",
        [attendanceData.employeeId, attendanceData.date, attendanceData.timeIn, attendanceData.timeOut, attendanceData.totalHours, attendanceData.lunchStart, attendanceData.lunchEnd, attendanceData.lunchHours, attendanceData.note, attendanceData.timeOut2, attendanceData.timeIn2, id],
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
          (employeeId, date, timeIn, timeOut, totalHours, lunchStart, lunchEnd, lunchHours, note, timeOut2, timeIn2)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

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
            item.note,
            item.timeOut2,
            item.timeIn2
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
  },

  // ================ INVENTORY MANAGEMENT ================
  
  // Ingredients Management
  getIngredients: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM ingredients ORDER BY name", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  createIngredient: (ingredient) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO ingredients (name, code, unit, currentStock, costPrice, lowStockAlert) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        [ingredient.name, ingredient.code, ingredient.unit, ingredient.currentStock || 0, ingredient.costPrice || 0, ingredient.lowStockAlert || 0],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...ingredient });
        });
    });
  },

  updateIngredient: (id, ingredient) => {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE ingredients SET name = ?, code = ?, unit = ?, currentStock = ?, costPrice = ?, lowStockAlert = ? 
              WHERE id = ?`,
        [ingredient.name, ingredient.code, ingredient.unit, ingredient.currentStock, ingredient.costPrice, ingredient.lowStockAlert, id],
        (err) => {
          if (err) reject(err);
          resolve({ id, ...ingredient });
        });
    });
  },

  deleteIngredient: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM ingredients WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  },

  // Products Management
  getProducts: () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM products ORDER BY name", [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  createProduct: (product) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO products (name, code, price, category, isActive) 
              VALUES (?, ?, ?, ?, ?)`,
        [product.name, product.code, product.price, product.category, product.isActive ? 1 : 0],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...product });
        });
    });
  },

  updateProduct: (id, product) => {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE products SET name = ?, code = ?, price = ?, category = ?, isActive = ? 
              WHERE id = ?`,
        [product.name, product.code, product.price, product.category, product.isActive ? 1 : 0, id],
        (err) => {
          if (err) reject(err);
          resolve({ id, ...product });
        });
    });
  },

  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  },

  // Recipes Management
  getRecipes: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT r.*, p.name as productName, i.name as ingredientName, i.unit as ingredientUnit
              FROM recipes r
              LEFT JOIN products p ON r.productId = p.id
              LEFT JOIN ingredients i ON r.ingredientId = i.id
              ORDER BY p.name, i.name`, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  getRecipesByProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT r.*, i.name as ingredientName, i.unit as ingredientUnit
              FROM recipes r
              LEFT JOIN ingredients i ON r.ingredientId = i.id
              WHERE r.productId = ?`, [productId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  createRecipe: (recipe) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO recipes (name, productId, ingredientId, quantity) 
              VALUES (?, ?, ?, ?)`,
        [recipe.name || '', recipe.productId, recipe.ingredientId, recipe.quantity],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...recipe });
        });
    });
  },

  updateRecipe: (id, recipe) => {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE recipes SET name = ?, productId = ?, ingredientId = ?, quantity = ? 
              WHERE id = ?`,
        [recipe.name || '', recipe.productId, recipe.ingredientId, recipe.quantity, id],
        (err) => {
          if (err) reject(err);
          resolve({ id, ...recipe });
        });
    });
  },

  deleteRecipe: (id) => {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM recipes WHERE id = ?", [id], (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  },

  // Stock Entry Management
  getStockEntries: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT s.*, i.name as ingredientName, i.unit as ingredientUnit
              FROM stock_entries s
              LEFT JOIN ingredients i ON s.ingredientId = i.id
              ORDER BY s.date DESC`, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  createStockEntry: (stockEntry) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert stock entry
        db.run(`INSERT INTO stock_entries (name, date, ingredientId, quantity, unitPrice, totalCost, supplier, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [stockEntry.name || '', stockEntry.date, stockEntry.ingredientId, stockEntry.quantity, 
           stockEntry.unitPrice, stockEntry.totalCost, stockEntry.supplier, stockEntry.note],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const stockEntryId = this.lastID;
            
            // Update ingredient stock
            db.run(`UPDATE ingredients SET currentStock = currentStock + ? WHERE id = ?`,
              [stockEntry.quantity, stockEntry.ingredientId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return reject(err);
              }
              
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK');
                  return reject(commitErr);
                }
                resolve({ id: stockEntryId, ...stockEntry });
              });
            });
          });
      });
    });
  },

  // Sales Management
  getSaleOrders: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT s.*, e.name as employeeName
              FROM sale_orders s
              LEFT JOIN employees e ON s.employeeId = e.id
              ORDER BY s.date DESC`, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  createSaleOrder: (saleOrder, items) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert sale order
        db.run(`INSERT INTO sale_orders (name, date, employeeId, totalAmount, note) 
                VALUES (?, ?, ?, ?, ?)`,
          [saleOrder.name || '', saleOrder.date, saleOrder.employeeId, saleOrder.totalAmount, saleOrder.note],
          function (err) {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            
            const saleOrderId = this.lastID;
            let completedItems = 0;
            
            if (items.length === 0) {
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  db.run('ROLLBACK');
                  return reject(commitErr);
                }
                resolve({ id: saleOrderId, ...saleOrder });
              });
              return;
            }
            
            // Insert sale order items and update stock
            items.forEach((item) => {
              // Insert sale order item
              db.run(`INSERT INTO sale_order_items (name, saleOrderId, productId, quantity, unitPrice, totalPrice) 
                      VALUES (?, ?, ?, ?, ?, ?)`,
                [item.name || '', saleOrderId, item.productId, item.quantity, item.unitPrice, item.totalPrice],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                  
                  // Get recipes for this product and update ingredient stocks
                  db.all(`SELECT ingredientId, quantity FROM recipes WHERE productId = ?`, [item.productId], (err, recipes) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(err);
                    }
                    
                    let completedRecipes = 0;
                    
                    if (recipes.length === 0) {
                      completedItems++;
                      if (completedItems === items.length) {
                        db.run('COMMIT', (commitErr) => {
                          if (commitErr) {
                            db.run('ROLLBACK');
                            return reject(commitErr);
                          }
                          resolve({ id: saleOrderId, ...saleOrder });
                        });
                      }
                      return;
                    }
                    
                    recipes.forEach((recipe) => {
                      const consumedQuantity = recipe.quantity * item.quantity;
                      
                      db.run(`UPDATE ingredients SET currentStock = currentStock - ? WHERE id = ?`,
                        [consumedQuantity, recipe.ingredientId], (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return reject(err);
                        }
                        
                        completedRecipes++;
                        if (completedRecipes === recipes.length) {
                          completedItems++;
                          if (completedItems === items.length) {
                            db.run('COMMIT', (commitErr) => {
                              if (commitErr) {
                                db.run('ROLLBACK');
                                return reject(commitErr);
                              }
                              resolve({ id: saleOrderId, ...saleOrder });
                            });
                          }
                        }
                      });
                    });
                  });
                });
            });
          });
      });
    });
  },

  getSaleOrderItems: (saleOrderId) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT s.*, p.name as productName
              FROM sale_order_items s
              LEFT JOIN products p ON s.productId = p.id
              WHERE s.saleOrderId = ?`, [saleOrderId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  // Reports
  getDailyReport: (date) => {
    return new Promise((resolve, reject) => {
      const queries = {
        sales: `SELECT COUNT(*) as totalOrders, SUM(totalAmount) as totalRevenue
                FROM sale_orders WHERE date = ?`,
        topProducts: `SELECT p.name, SUM(i.quantity) as totalQuantity, SUM(i.totalPrice) as totalRevenue
                     FROM sale_order_items i
                     LEFT JOIN products p ON i.productId = p.id
                     LEFT JOIN sale_orders o ON i.saleOrderId = o.id
                     WHERE o.date = ?
                     GROUP BY p.id
                     ORDER BY totalRevenue DESC LIMIT 5`,
        lowStock: `SELECT * FROM ingredients WHERE currentStock <= lowStockAlert AND lowStockAlert > 0`
      };
      
      db.get(queries.sales, [date], (err, salesData) => {
        if (err) return reject(err);
        
        db.all(queries.topProducts, [date], (err, topProducts) => {
          if (err) return reject(err);
          
          db.all(queries.lowStock, [], (err, lowStock) => {
            if (err) return reject(err);
            
            resolve({
              date,
              totalOrders: salesData.totalOrders || 0,
              totalRevenue: salesData.totalRevenue || 0,
              topProducts: topProducts || [],
              lowStockAlerts: lowStock || []
            });
          });
        });
      });
    });
  },

  getInventoryReport: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT 
                i.*,
                COALESCE(SUM(s.quantity * s.unitPrice), 0) as totalInValue,
                COALESCE(i.currentStock * i.costPrice, 0) as currentValue
              FROM ingredients i
              LEFT JOIN stock_entries s ON i.id = s.ingredientId
              GROUP BY i.id
              ORDER BY i.name`, [], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });
  },

  // Import Sales from Excel
  importSalesFromExcel(fileBuffer) {
    return new Promise((resolve, reject) => {
      try {
        // Read Excel file
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
          return reject(new Error('File Excel không có dữ liệu'));
        }

        // Validate columns (flexible matching)
        const requiredColumns = ['productName', 'quantity', 'totalAmount', 'employee', 'date'];
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        
        // Map columns (flexible naming)
        const columnMap = {};
        requiredColumns.forEach(col => {
          let found = false;
          columns.forEach(excelCol => {
            const normalizedExcelCol = excelCol.toLowerCase().replace(/[^a-z]/g, '');
            const normalizedReqCol = col.toLowerCase().replace(/[^a-z]/g, '');
            
            if (normalizedExcelCol.includes(normalizedReqCol) || 
                (col === 'productName' && (normalizedExcelCol.includes('tensanpham') || normalizedExcelCol.includes('sanpham'))) ||
                (col === 'quantity' && (normalizedExcelCol.includes('soluong') || normalizedExcelCol.includes('quantity'))) ||
                (col === 'totalAmount' && (normalizedExcelCol.includes('thanhtien') || normalizedExcelCol.includes('amount'))) ||
                (col === 'employee' && (normalizedExcelCol.includes('nhanvien') || normalizedExcelCol.includes('employee'))) ||
                (col === 'date' && (normalizedExcelCol.includes('ngay') || normalizedExcelCol.includes('date')))) {
              columnMap[col] = excelCol;
              found = true;
            }
          });
          if (!found) {
            console.warn(`Column ${col} not found, using first available column`);
            columnMap[col] = columns[Math.min(requiredColumns.indexOf(col), columns.length - 1)];
          }
        });

        db.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) {
            return reject(beginErr);
          }

          let processedCount = 0;
          let errors = [];

          const processRow = (index) => {
            if (index >= data.length) {
              if (errors.length > 0) {
                db.run('ROLLBACK');
                return reject(new Error(`Lỗi import: ${errors.join(', ')}`));
              }
              
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  return reject(commitErr);
                }
                resolve(true);
              });
              return;
            }

            const row = data[index];
            const productName = row[columnMap.productName];
            const quantity = parseFloat(row[columnMap.quantity]) || 0;
            const totalAmount = parseFloat(row[columnMap.totalAmount]) || 0;
            const employee = row[columnMap.employee] || 'Unknown';
            let saleDate = row[columnMap.date];

            // Parse date
            if (saleDate) {
              if (typeof saleDate === 'number') {
                // Excel date number
                saleDate = new Date((saleDate - 25569) * 86400 * 1000);
              } else if (typeof saleDate === 'string') {
                saleDate = new Date(saleDate);
              }
            } else {
              saleDate = new Date(); // Use current date if not provided
            }

            if (!productName || quantity <= 0 || totalAmount <= 0) {
              errors.push(`Dòng ${index + 2}: Dữ liệu không hợp lệ`);
              processRow(index + 1);
              return;
            }

            // Find or create product
            this.findProductByName(productName).then(product => {
              if (!product) {
                // Create new product if not exists
                const newProduct = {
                  name: productName,
                  price: Math.round(totalAmount / quantity),
                  category: 'Imported',
                  description: 'Imported from Excel',
                  active: true
                };

                this.createProduct(newProduct).then(createdProduct => {
                  this.createImportedSaleOrder(createdProduct, quantity, totalAmount, employee, saleDate)
                    .then(() => {
                      processedCount++;
                      processRow(index + 1);
                    })
                    .catch(err => {
                      errors.push(`Dòng ${index + 2}: ${err.message}`);
                      processRow(index + 1);
                    });
                }).catch(err => {
                  errors.push(`Dòng ${index + 2}: Không thể tạo sản phẩm - ${err.message}`);
                  processRow(index + 1);
                });
              } else {
                this.createImportedSaleOrder(product, quantity, totalAmount, employee, saleDate)
                  .then(() => {
                    processedCount++;
                    processRow(index + 1);
                  })
                  .catch(err => {
                    errors.push(`Dòng ${index + 2}: ${err.message}`);
                    processRow(index + 1);
                  });
              }
            }).catch(err => {
              errors.push(`Dòng ${index + 2}: Không thể tìm sản phẩm - ${err.message}`);
              processRow(index + 1);
            });
          };

          processRow(0);
        });

      } catch (error) {
        reject(new Error(`Lỗi đọc file Excel: ${error.message}`));
      }
    });
  },

  findProductByName(name) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  createImportedSaleOrder(product, quantity, totalAmount, employee, saleDate) {
    return new Promise((resolve, reject) => {
      const saleOrder = {
        totalAmount: totalAmount,
        discount: 0,
        customerName: 'Import',
        notes: `Imported from Excel - ${employee}`,
        createdAt: saleDate.toISOString()
      };

      db.run(
        'INSERT INTO sale_orders (total_amount, discount, customer_name, notes, created_at) VALUES (?, ?, ?, ?, ?)',
        [saleOrder.totalAmount, saleOrder.discount, saleOrder.customerName, saleOrder.notes, saleOrder.createdAt],
        function(err) {
          if (err) {
            reject(err);
            return;
          }

          const saleOrderId = this.lastID;
          const unitPrice = Math.round(totalAmount / quantity);

          // Create sale order item
          db.run(
            'INSERT INTO sale_order_items (sale_order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [saleOrderId, product.id, quantity, unitPrice, totalAmount],
            (itemErr) => {
              if (itemErr) {
                reject(itemErr);
                return;
              }

              // Update stock based on recipes
              this.deductStockByRecipes(product.id, quantity)
                .then(() => resolve(saleOrderId))
                .catch(() => {
                  // If recipe not found, just log and continue
                  console.log(`No recipe found for product ${product.name}, skipping stock deduction`);
                  resolve(saleOrderId);
                });
            }
          );
        }
      );
    });
  },

  clearSalesHistory() {
    return new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          return reject(beginErr);
        }

        db.run('DELETE FROM sale_order_items', (err1) => {
          if (err1) {
            db.run('ROLLBACK');
            return reject(err1);
          }

          db.run('DELETE FROM sale_orders', (err2) => {
            if (err2) {
              db.run('ROLLBACK');
              return reject(err2);
            }

            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return reject(commitErr);
              }
              resolve(true);
            });
          });
        });
      });
    });
  }
};
