import { IModel } from './common.model';

// Nguyên liệu kho
export interface IIngredient extends IModel {
  unit: string; // gram, chai, gói, quả, viên, etc.
  currentStock: number; // số lượng hiện có
  costPrice: number; // giá nhập
  lowStockAlert?: number; // cảnh báo hết hàng
}

// Món ăn/dịch vụ
export interface IProduct extends IModel {
  price: number; // giá bán
  category?: string; // loại: đồ ăn, đồ uống, thuốc lá, etc.
  isActive?: boolean;
}

// Công thức món ăn (định lượng nguyên liệu cho từng món)
export interface IRecipe extends IModel {
  productId: number;
  product?: IProduct;
  ingredientId: number;
  ingredient?: IIngredient;
  quantity: number; // số lượng nguyên liệu cần cho 1 món
}

// Phiếu nhập kho
export interface IStockEntry extends IModel {
  date: Date;
  ingredientId: number;
  ingredient?: IIngredient;
  quantity: number; // số lượng nhập
  unitPrice: number; // giá nhập của 1 đơn vị
  totalCost: number; // tổng tiền nhập
  supplier?: string; // nhà cung cấp
  note?: string;
}

// Hóa đơn bán hàng
export interface ISaleOrder extends IModel {
  date: Date;
  employeeId?: number;
  employee?: any; // reference to Employee
  totalAmount: number;
  note?: string;
}

// Chi tiết hóa đơn
export interface ISaleOrderItem extends IModel {
  saleOrderId: number;
  saleOrder?: ISaleOrder;
  productId: number;
  product?: IProduct;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Báo cáo tồn kho
export interface IInventoryReport {
  ingredient: IIngredient;
  currentStock: number;
  totalInValue: number; // tổng giá trị nhập
  totalOutValue: number; // tổng giá trị xuất
  profitLoss: number; // lời lỗ
}

// Báo cáo doanh thu theo ngày
export interface IDailyReport {
  date: Date;
  totalRevenue: number; // tổng doanh thu
  totalCost: number; // tổng chi phí nguyên liệu
  profit: number; // lời
  topSellingProducts: { product: IProduct; quantity: number; revenue: number }[];
  inventoryAlerts: IIngredient[]; // nguyên liệu sắp hết
}
