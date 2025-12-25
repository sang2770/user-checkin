# Hệ thống Quản lý Quán Net

Hệ thống quản lý toàn diện cho quán net bao gồm quản lý kho, bán hàng và báo cáo theo mô tả trong `note.txt`.

## Tính năng chính

### 🥩 Quản lý Nguyên liệu
- Thêm, sửa, xóa nguyên liệu (thịt, mì gói, nước, thuốc, trứng, cá viên...)
- Theo dõi tồn kho hiện tại
- Cảnh báo hết hàng
- Quản lý đơn vị tính (gram, chai, gói, quả, viên...)

### 🍜 Quản lý Sản phẩm  
- Quản lý menu món ăn/đồ uống
- Import sản phẩm từ file Excel `doanh-thu-theo-dich-vu.xlsx`
- Phân loại sản phẩm theo danh mục
- Định giá bán cho từng sản phẩm

### 📦 Nhập kho
- Nhập nguyên liệu vào kho
- Tự động cập nhật số lượng tồn kho
- Theo dõi giá nhập, nhà cung cấp
- Lịch sử nhập kho chi tiết

### 🛒 Bán hàng (POS)
- Giao diện bán hàng thân thiện
- Tìm kiếm sản phẩm theo tên/mã
- Lọc theo danh mục
- Tự động trừ kho theo công thức món ăn
- Tính toán tổng tiền tự động

### 📊 Báo cáo
- Báo cáo doanh thu theo ngày
- Sản phẩm bán chạy
- Báo cáo tồn kho và giá trị
- Cảnh báo nguyên liệu sắp hết

## Công thức món ăn (Tự động trừ kho)

Hệ thống có sẵn công thức cho các món theo yêu cầu:

- **1 tô mì bò** = 1 gói mì + 65g thịt bò
- **1 tô mì xào thịt xúc xích** = 1 gói mì + 40g thịt/xúc xích
- **1 phần cá viên** = 5 viên cá viên
- Và nhiều món khác...

Khi bán 1 món, hệ thống sẽ tự động:
1. Trừ nguyên liệu theo công thức
2. Cập nhật tồn kho
3. Cảnh báo nếu nguyên liệu sắp hết

## Hướng dẫn sử dụng

### Bước 1: Thiết lập dữ liệu ban đầu
1. Vào **"Nguyên liệu"** → Nhấn **"Import dữ liệu mẫu"**
2. Hệ thống sẽ tự động:
   - Import sản phẩm từ file Excel
   - Tạo nguyên liệu mẫu
   - Tạo công thức món ăn

### Bước 2: Nhập kho nguyên liệu
1. Vào **"Nhập kho"** → **"Nhập kho"**
2. Chọn nguyên liệu, nhập số lượng, giá nhập
3. Hệ thống tự động cập nhật tồn kho

### Bước 3: Bán hàng
1. Vào **"Bán hàng (POS)"**
2. Tìm và chọn sản phẩm để thêm vào giỏ hàng  
3. Điều chỉnh số lượng nếu cần
4. Nhấn **"Thanh toán"**
5. Hệ thống tự động trừ kho theo công thức

### Bước 4: Xem báo cáo
1. Vào **"Báo cáo"** để xem:
   - Doanh thu ngày
   - Top sản phẩm bán chạy
   - Tình hình tồn kho
   - Cảnh báo hết hàng

## Cấu trúc dữ liệu

### Nguyên liệu
- Tên, mã, đơn vị tính
- Số lượng tồn kho hiện tại
- Giá nhập, mức cảnh báo hết hàng

### Sản phẩm  
- Tên món, mã, giá bán
- Danh mục (đồ ăn, đồ uống, thuốc lá...)
- Trạng thái hoạt động

### Công thức (Recipes)
- Liên kết sản phẩm với nguyên liệu
- Định lượng nguyên liệu cần cho 1 món

### Đơn bán hàng
- Thông tin đơn hàng, nhân viên bán
- Chi tiết sản phẩm, số lượng, giá

## Chạy ứng dụng

```bash
# Development mode (Web)
npm start

# Electron app
npm run electron:start

# Build for production
npm run electron:build
```

## Cấu trúc thư mục

```
src/app/
├── ingredients/          # Quản lý nguyên liệu
├── products/            # Quản lý sản phẩm  
├── sales/              # POS bán hàng
├── stock-entries/      # Nhập kho
├── reports/            # Báo cáo
├── models/             # Data models
└── services/           # Services (database, seeder)

electron/
├── db/database.js      # SQLite database
├── main.js            # Electron main process  
└── preload.js         # IPC communication
```

## Lưu ý

- Dữ liệu được lưu trong SQLite database tại `%AppData%/user-checkin/employees.db`
- File Excel mẫu: `doanh-thu-theo-dich-vu.xlsx` 
- Backup dữ liệu định kỳ để tránh mất mát

Hệ thống được thiết kế đơn giản, dễ sử dụng cho nhân viên quán net với đầy đủ tính năng quản lý cần thiết theo yêu cầu.
