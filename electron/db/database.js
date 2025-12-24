const { Database } = require("sqlite3").verbose();
const { app } = require("electron");
const path = require("path");
const XLSX = require("xlsx");
const dbPath = path.join(app.getPath("userData"), "employees.db");
console.log("DB Path:", dbPath);

const db = new Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});
db.serialize(() => {
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
        employeeName TEXT,
        totalAmount REAL NOT NULL,
        note TEXT
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
      db.run(
        `INSERT INTO ingredients (name, code, unit, currentStock, costPrice, lowStockAlert) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ingredient.name,
          ingredient.code,
          ingredient.unit,
          ingredient.currentStock || 0,
          ingredient.costPrice || 0,
          ingredient.lowStockAlert || 0,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...ingredient });
        }
      );
    });
  },

  updateIngredient: (id, ingredient) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE ingredients SET name = ?, code = ?, unit = ?, currentStock = ?, costPrice = ?, lowStockAlert = ? 
              WHERE id = ?`,
        [
          ingredient.name,
          ingredient.code,
          ingredient.unit,
          ingredient.currentStock,
          ingredient.costPrice,
          ingredient.lowStockAlert,
          id,
        ],
        (err) => {
          if (err) reject(err);
          resolve({ id, ...ingredient });
        }
      );
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
      db.run(
        `INSERT INTO products (name, code, price, category, isActive) 
              VALUES (?, ?, ?, ?, ?)`,
        [
          product.name,
          product.code,
          product.price,
          product.category,
          product.isActive ? 1 : 0,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...product });
        }
      );
    });
  },

  updateProduct: (id, product) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE products SET name = ?, code = ?, price = ?, category = ?, isActive = ? 
              WHERE id = ?`,
        [
          product.name,
          product.code,
          product.price,
          product.category,
          product.isActive ? 1 : 0,
          id,
        ],
        (err) => {
          if (err) reject(err);
          resolve({ id, ...product });
        }
      );
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
      db.all(
        `SELECT r.*, p.name as productName, i.name as ingredientName, i.unit as ingredientUnit
              FROM recipes r
              LEFT JOIN products p ON r.productId = p.id
              LEFT JOIN ingredients i ON r.ingredientId = i.id
              ORDER BY p.name, i.name`,
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },

  getRecipesByProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, i.name as ingredientName, i.unit as ingredientUnit
              FROM recipes r
              LEFT JOIN ingredients i ON r.ingredientId = i.id
              WHERE r.productId = ?`,
        [productId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },

  createRecipe: (recipe) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO recipes (name, productId, ingredientId, quantity) 
              VALUES (?, ?, ?, ?)`,
        [
          recipe.name || "",
          recipe.productId,
          recipe.ingredientId,
          recipe.quantity,
        ],
        function (err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...recipe });
        }
      );
    });
  },

  updateRecipe: (id, recipe) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE recipes SET name = ?, productId = ?, ingredientId = ?, quantity = ? 
              WHERE id = ?`,
        [
          recipe.name || "",
          recipe.productId,
          recipe.ingredientId,
          recipe.quantity,
          id,
        ],
        (err) => {
          if (err) reject(err);
          resolve({ id, ...recipe });
        }
      );
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
      db.all(
        `SELECT s.*, i.name as ingredientName, i.unit as ingredientUnit
              FROM stock_entries s
              LEFT JOIN ingredients i ON s.ingredientId = i.id
              ORDER BY s.date DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },

  createStockEntry: (stockEntry) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Insert stock entry
        db.run(
          `INSERT INTO stock_entries (name, date, ingredientId, quantity, unitPrice, totalCost, supplier, note) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stockEntry.name || "",
            stockEntry.date,
            stockEntry.ingredientId,
            stockEntry.quantity,
            stockEntry.unitPrice,
            stockEntry.totalCost,
            stockEntry.supplier,
            stockEntry.note,
          ],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }

            const stockEntryId = this.lastID;

            // Update ingredient stock
            db.run(
              `UPDATE ingredients SET currentStock = currentStock + ? WHERE id = ?`,
              [stockEntry.quantity, stockEntry.ingredientId],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }

                db.run("COMMIT", (commitErr) => {
                  if (commitErr) {
                    db.run("ROLLBACK");
                    return reject(commitErr);
                  }
                  resolve({ id: stockEntryId, ...stockEntry });
                });
              }
            );
          }
        );
      });
    });
  },

  // Sales Management
  getSaleOrders: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.*
              FROM sale_orders s
              ORDER BY s.date DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },

  createSaleOrder: (saleOrder, items) => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Insert sale order
        db.run(
          `INSERT INTO sale_orders (name, date, employeeName, totalAmount, note) 
                VALUES (?, ?, ?, ?, ?)`,
          [
            saleOrder.name || "",
            saleOrder.date,
            saleOrder.employeeName,
            saleOrder.totalAmount,
            saleOrder.note,
          ],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }

            const saleOrderId = this.lastID;
            let completedItems = 0;

            if (items.length === 0) {
              db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  db.run("ROLLBACK");
                  return reject(commitErr);
                }
                resolve({ id: saleOrderId, ...saleOrder });
              });
              return;
            }

            // Insert sale order items and update stock
            items.forEach((item) => {
              // Insert sale order item
              db.run(
                `INSERT INTO sale_order_items (name, saleOrderId, productId, quantity, unitPrice, totalPrice) 
                      VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  item.name || "",
                  saleOrderId,
                  item.productId,
                  item.quantity,
                  item.unitPrice,
                  item.totalPrice,
                ],
                (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                  }

                  // Get recipes for this product and update ingredient stocks
                  db.all(
                    `SELECT ingredientId, quantity FROM recipes WHERE productId = ?`,
                    [item.productId],
                    (err, recipes) => {
                      if (err) {
                        db.run("ROLLBACK");
                        return reject(err);
                      }

                      let completedRecipes = 0;

                      if (recipes.length === 0) {
                        completedItems++;
                        if (completedItems === items.length) {
                          db.run("COMMIT", (commitErr) => {
                            if (commitErr) {
                              db.run("ROLLBACK");
                              return reject(commitErr);
                            }
                            resolve({ id: saleOrderId, ...saleOrder });
                          });
                        }
                        return;
                      }

                      recipes.forEach((recipe) => {
                        const consumedQuantity =
                          recipe.quantity * item.quantity;

                        db.run(
                          `UPDATE ingredients SET currentStock = currentStock - ? WHERE id = ?`,
                          [consumedQuantity, recipe.ingredientId],
                          (err) => {
                            if (err) {
                              db.run("ROLLBACK");
                              return reject(err);
                            }

                            completedRecipes++;
                            if (completedRecipes === recipes.length) {
                              completedItems++;
                              if (completedItems === items.length) {
                                db.run("COMMIT", (commitErr) => {
                                  if (commitErr) {
                                    db.run("ROLLBACK");
                                    return reject(commitErr);
                                  }
                                  resolve({ id: saleOrderId, ...saleOrder });
                                });
                              }
                            }
                          }
                        );
                      });
                    }
                  );
                }
              );
            });
          }
        );
      });
    });
  },

  getSaleOrderItems: (saleOrderId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT s.*, p.name as productName
              FROM sale_order_items s
              LEFT JOIN products p ON s.productId = p.id
              WHERE s.saleOrderId = ?`,
        [saleOrderId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },

  formatDateToLocalDate(date) {
    if (date instanceof Date) {
      const d = date;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } else if (typeof date === "string") {
      // normalize common delimiters to '/'
      return date.trim().replace(/[-.]/g, "/");
    } else {
      return reject(
        new Error('Invalid date format. Provide a Date or "dd/mm/yyyy" string.')
      );
    }
  },

  // Reports
  getDailyReport: (date) => {
    return new Promise((resolve, reject) => {
      const target = module.exports.formatDateToLocalDate(date);
      console.log("Formatted date:", target);

      const queries = {
        sales: `SELECT COUNT(*) as totalOrders, SUM(totalAmount) as totalRevenue
                FROM sale_orders WHERE strftime('%d/%m/%Y', date) = ?`,
        topProducts: `SELECT p.name, SUM(i.quantity) as totalQuantity, SUM(i.totalPrice) as totalRevenue
                     FROM sale_order_items i
                     LEFT JOIN products p ON i.productId = p.id
                     LEFT JOIN sale_orders o ON i.saleOrderId = o.id
                     WHERE strftime('%d/%m/%Y', o.date) = ?
                     GROUP BY p.id
                     ORDER BY totalRevenue DESC LIMIT 5`,
        lowStock: `SELECT * FROM ingredients WHERE currentStock <= lowStockAlert AND lowStockAlert > 0`,
      };

      db.get(queries.sales, [target], (err, salesData) => {
        if (err) return reject(err);

        db.all(queries.topProducts, [target], (err, topProducts) => {
          if (err) return reject(err);

          db.all(queries.lowStock, [], (err, lowStock) => {
            if (err) return reject(err);

            resolve({
              date: target,
              totalOrders: salesData.totalOrders || 0,
              totalRevenue: salesData.totalRevenue || 0,
              topProducts: topProducts || [],
              lowStockAlerts: lowStock || [],
            });
          });
        });
      });
    });
  },

  getInventoryReport: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
                i.*,
                COALESCE(SUM(s.quantity * s.unitPrice), 0) as totalInValue,
                COALESCE(i.currentStock * i.costPrice, 0) as currentValue
              FROM ingredients i
              LEFT JOIN stock_entries s ON i.id = s.ingredientId
              GROUP BY i.id
              ORDER BY i.name`,
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  },

  // Import Sales from Excel
  importSalesFromExcel(fileBuffer) {
    return new Promise((resolve, reject) => {
      try {
        // Read Excel file
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
          return reject(new Error("File Excel không có dữ liệu"));
        }

        // Validate columns (flexible matching)
        const firstRow = data[0];
        const columns = Object.keys(firstRow);

        // Map columns (flexible naming)
        const columnMap = {
          productName: columns[1],
          quantity: columns[4],
          totalAmount: columns[5],
          employee: columns[6],
          date: columns[2],
          time: columns[3],
        };

        console.log("Final column mapping:", columnMap);

        db.run("BEGIN TRANSACTION", (beginErr) => {
          if (beginErr) {
            return reject(beginErr);
          }

          let processedCount = 0;
          let errors = [];

          const processRow = (index) => {
            if (index >= data.length) {
              if (errors.length > 0) {
                db.run("ROLLBACK");
                return reject(new Error(`Lỗi import: ${errors.join(", ")}`));
              }

              db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                  return reject(commitErr);
                }
                resolve(true);
              });
              return;
            }

            const row = data[index];
            const productName = String(row[columnMap.productName] || "").trim();
            const quantity = parseFloat(row[columnMap.quantity]) || 0;
            const totalAmount = parseFloat(row[columnMap.totalAmount]) || 0;
            const employee = String(
              row[columnMap.employee] || "Unknown"
            ).trim();
            let saleDate = row[columnMap.date];
            let saleTime = row[columnMap.time];

            // Parse date
            if (saleDate) {
              if (typeof saleDate === "number") {
                // Excel date number
                saleDate = new Date((saleDate - 25569) * 86400 * 1000);
              } else if (typeof saleDate === "string") {
                saleDate = new Date(saleDate + " " + saleTime);
              }
            } else {
              saleDate = new Date(); // Use current date if not provided
            }

            // Validate data - more lenient validation
            if (!productName || productName.length === 0) {
              errors.push(
                `Dòng ${index + 2}: Tên sản phẩm không được để trống`
              );
              processRow(index + 1);
              return;
            }

            if (quantity <= 0) {
              errors.push(`Dòng ${index + 2}: Số lượng phải lớn hơn 0`);
              processRow(index + 1);
              return;
            }

            if (totalAmount <= 0) {
              errors.push(`Dòng ${index + 2}: Thành tiền phải lớn hơn 0`);
              processRow(index + 1);
              return;
            }

            // Find or create product
            this.findProductByName(productName)
              .then((product) => {
                if (!product) {
                  // Create new product if not exists
                  const unitPrice = Math.round(totalAmount / quantity);
                  const newProduct = {
                    name: productName,
                    price: unitPrice,
                    category: "Import từ Excel",
                    description: `Tự động tạo từ import Excel - ${new Date().toLocaleDateString()}`,
                    isActive: true,
                    code: `IMP-${productName.replace(/\s+/g, "-")}`,
                  };
                  this.createProduct(newProduct)
                    .then((createdProduct) => {
                      this.createImportedSaleOrder(
                        createdProduct,
                        quantity,
                        totalAmount,
                        employee,
                        saleDate
                      )
                        .then(() => {
                          processedCount++;
                          console.log(
                            `Đã tạo order cho sản phẩm mới: ${productName}`
                          );
                          processRow(index + 1);
                        })
                        .catch((err) => {
                          errors.push(`Dòng ${index + 2}: ${err.message}`);
                          processRow(index + 1);
                        });
                    })
                    .catch((err) => {
                      errors.push(
                        `Dòng ${index + 2}: Không thể tạo sản phẩm - ${
                          err.message
                        }`
                      );
                      processRow(index + 1);
                    });
                } else {
                  console.log(`Sử dụng sản phẩm có sẵn: ${product.name}`);
                  this.createImportedSaleOrder(
                    product,
                    quantity,
                    totalAmount,
                    employee,
                    saleDate
                  )
                    .then(() => {
                      processedCount++;
                      processRow(index + 1);
                    })
                    .catch((err) => {
                      errors.push(`Dòng ${index + 2}: ${err.message}`);
                      processRow(index + 1);
                    });
                }
              })
              .catch((err) => {
                errors.push(
                  `Dòng ${index + 2}: Không thể tìm sản phẩm - ${err.message}`
                );
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
      db.get(
        "SELECT * FROM products WHERE LOWER(name) = LOWER(?)",
        [name],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  },

  createImportedSaleOrder(product, quantity, totalAmount, employee, saleDate) {
    return new Promise((resolve, reject) => {
      const formattedDate = saleDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const note = `Import từ Excel - ${employee} - ${new Date().toLocaleDateString()}`;

      db.run(
        "INSERT INTO sale_orders (name, date, employeeName, totalAmount, note) VALUES (?, ?, ?, ?, ?)",
        [
          `Order Import ${Date.now()}`,
          formattedDate,
          employee,
          totalAmount,
          note,
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          const saleOrderId = this.lastID;
          const unitPrice = Math.round(totalAmount / quantity);

          // Create sale order item
          db.run(
            "INSERT INTO sale_order_items (name, saleOrderId, productId, quantity, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?)",
            [
              `Item Import ${Date.now()}`,
              saleOrderId,
              product.id,
              quantity,
              unitPrice,
              totalAmount,
            ],
            (itemErr) => {
              if (itemErr) {
                reject(itemErr);
                return;
              }

              // Update stock based on recipes
              module.exports
                .deductStockByRecipes(product.id, quantity)
                .then(() => resolve(saleOrderId))
                .catch(() => {
                  // If recipe not found, just log and continue
                  console.log(
                    `No recipe found for product ${product.name}, skipping stock deduction`
                  );
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
      db.run("BEGIN TRANSACTION", (beginErr) => {
        if (beginErr) {
          return reject(beginErr);
        }

        db.run("DELETE FROM sale_order_items", (err1) => {
          if (err1) {
            db.run("ROLLBACK");
            return reject(err1);
          }

          db.run("DELETE FROM sale_orders", (err2) => {
            if (err2) {
              db.run("ROLLBACK");
              return reject(err2);
            }

            db.run("COMMIT", (commitErr) => {
              if (commitErr) {
                return reject(commitErr);
              }
              resolve(true);
            });
          });
        });
      });
    });
  },

  // Get orders by date (compare only dd/mm/yyyy)
  getOrdersByDate: (date) => {
    return new Promise((resolve, reject) => {
      // Accept either "dd/mm/yyyy" string or Date object
      let target = module.exports.formatDateToLocalDate(date);

      db.all(
        `SELECT * FROM sale_orders WHERE strftime('%d/%m/%Y', date) = ? ORDER BY id DESC`,
        [target],
        (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        }
      );
    });
  },

  // Get profit/loss report for a specific date
  getProfitLossReport: (date) => {
    return new Promise((resolve, reject) => {
      // Get total revenue for the date
      db.get(
        `SELECT SUM(totalAmount) as totalRevenue, COUNT(*) as totalOrders FROM sale_orders WHERE date = ?`,
        [date],
        (err, revenueData) => {
          if (err) return reject(err);

          // Calculate total ingredient costs for products sold on this date
          db.get(
            `
          SELECT SUM(
            soi.quantity * r.quantity * i.costPrice
          ) as totalCost
          FROM sale_order_items soi
          LEFT JOIN sale_orders so ON soi.saleOrderId = so.id
          LEFT JOIN recipes r ON soi.productId = r.productId
          LEFT JOIN ingredients i ON r.ingredientId = i.id
          WHERE so.date = ?
        `,
            [date],
            (err, costData) => {
              if (err) return reject(err);

              const totalRevenue = revenueData.totalRevenue || 0;
              const totalCost = costData.totalCost || 0;
              const netProfit = totalRevenue - totalCost;
              const profitMargin =
                totalRevenue > 0 ? netProfit / totalRevenue : 0;

              resolve({
                date,
                totalRevenue,
                totalCost,
                netProfit,
                profitMargin,
                totalOrders: revenueData.totalOrders || 0,
              });
            }
          );
        }
      );
    });
  },

  // Get monthly profit/loss report
  getMonthlyProfitLossReport: (year, month) => {
    return new Promise((resolve, reject) => {
      const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
      const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

      // Get total revenue for the month
      db.get(
        `
        SELECT SUM(totalAmount) as totalRevenue, COUNT(*) as totalOrders 
        FROM sale_orders 
        WHERE date >= ? AND date <= ?
      `,
        [startDate, endDate],
        (err, revenueData) => {
          if (err) return reject(err);

          // Calculate total ingredient costs for products sold in this month
          db.get(
            `
          SELECT SUM(
            soi.quantity * r.quantity * i.costPrice
          ) as totalCost
          FROM sale_order_items soi
          LEFT JOIN sale_orders so ON soi.saleOrderId = so.id
          LEFT JOIN recipes r ON soi.productId = r.productId
          LEFT JOIN ingredients i ON r.ingredientId = i.id
          WHERE so.date >= ? AND so.date <= ?
        `,
            [startDate, endDate],
            (err, costData) => {
              if (err) return reject(err);

              const totalRevenue = revenueData.totalRevenue || 0;
              const totalCost = costData.totalCost || 0;
              const netProfit = totalRevenue - totalCost;
              const profitMargin =
                totalRevenue > 0 ? netProfit / totalRevenue : 0;

              resolve({
                year,
                month,
                totalRevenue,
                totalCost,
                netProfit,
                profitMargin,
                totalOrders: revenueData.totalOrders || 0,
              });
            }
          );
        }
      );
    });
  },

  deductStockByRecipes(productId, quantity) {
    return new Promise((resolve, reject) => {
      // Get recipes for this product
      db.all(
        "SELECT ingredientId, quantity FROM recipes WHERE productId = ?",
        [productId],
        (err, recipes) => {
          if (err) {
            return reject(err);
          }

          if (recipes.length === 0) {
            // No recipes found, resolve without error
            return resolve();
          }

          let completedRecipes = 0;
          let hasError = false;

          recipes.forEach((recipe) => {
            const consumedQuantity = recipe.quantity * quantity;

            db.run(
              "UPDATE ingredients SET currentStock = currentStock - ? WHERE id = ?",
              [consumedQuantity, recipe.ingredientId],
              (err) => {
                if (err && !hasError) {
                  hasError = true;
                  return reject(err);
                }

                completedRecipes++;
                if (completedRecipes === recipes.length && !hasError) {
                  resolve();
                }
              }
            );
          });
        }
      );
    });
  },
};
