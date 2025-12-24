import { Injectable } from '@angular/core';
import { IIngredient, IProduct, IRecipe, IStockEntry, ISaleOrder, ISaleOrderItem } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor() {}

  async getEmployees() {
    return await (window as any).electronAPI.getEmployees();
  }

  // Ingredients Management
  async getIngredients(): Promise<IIngredient[]> {
    return await (window as any).electronAPI.getIngredients();
  }

  async createIngredient(ingredient: Omit<IIngredient, 'id'>): Promise<IIngredient> {
    return await (window as any).electronAPI.createIngredient(ingredient);
  }

  async updateIngredient(id: number, ingredient: Partial<IIngredient>): Promise<IIngredient> {
    return await (window as any).electronAPI.updateIngredient(id, ingredient);
  }

  async deleteIngredient(id: number): Promise<boolean> {
    return await (window as any).electronAPI.deleteIngredient(id);
  }

  // Products Management
  async getProducts(): Promise<IProduct[]> {
    return await (window as any).electronAPI.getProducts();
  }

  async createProduct(product: Omit<IProduct, 'id'>): Promise<IProduct> {
    return await (window as any).electronAPI.createProduct(product);
  }

  async updateProduct(id: number, product: Partial<IProduct>): Promise<IProduct> {
    return await (window as any).electronAPI.updateProduct(id, product);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return await (window as any).electronAPI.deleteProduct(id);
  }

  // Recipes Management
  async getRecipes(): Promise<IRecipe[]> {
    return await (window as any).electronAPI.getRecipes();
  }

  async getRecipesByProduct(productId: number): Promise<IRecipe[]> {
    return await (window as any).electronAPI.getRecipesByProduct(productId);
  }

  async createRecipe(recipe: Omit<IRecipe, 'id'>): Promise<IRecipe> {
    return await (window as any).electronAPI.createRecipe(recipe);
  }

  async updateRecipe(id: number, recipe: Partial<IRecipe>): Promise<IRecipe> {
    return await (window as any).electronAPI.updateRecipe(id, recipe);
  }

  async deleteRecipe(id: number): Promise<boolean> {
    return await (window as any).electronAPI.deleteRecipe(id);
  }

  // Stock Entry Management
  async getStockEntries(): Promise<IStockEntry[]> {
    return await (window as any).electronAPI.getStockEntries();
  }

  async createStockEntry(stockEntry: Omit<IStockEntry, 'id'>): Promise<IStockEntry> {
    return await (window as any).electronAPI.createStockEntry(stockEntry);
  }

  // Sales Management
  async getSaleOrders(): Promise<ISaleOrder[]> {
    return await (window as any).electronAPI.getSaleOrders();
  }

  async createSaleOrder(saleOrder: Omit<ISaleOrder, 'id'>, items: Omit<ISaleOrderItem, 'id' | 'saleOrderId'>[]): Promise<ISaleOrder> {
    return await (window as any).electronAPI.createSaleOrder(saleOrder, items);
  }

  async getSaleOrderItems(saleOrderId: number): Promise<ISaleOrderItem[]> {
    return await (window as any).electronAPI.getSaleOrderItems(saleOrderId);
  }

  // Reports
  async getDailyReport(date: string): Promise<any> {
    return await (window as any).electronAPI.getDailyReport(date);
  }

  async getInventoryReport(): Promise<any[]> {
    return await (window as any).electronAPI.getInventoryReport();
  }

  // Import Sales from Excel
  async importSalesFromExcel(fileBuffer: ArrayBuffer): Promise<boolean> {
    return await (window as any).electronAPI.importSalesFromExcel(fileBuffer);
  }

  async clearSalesHistory(): Promise<boolean> {
    return await (window as any).electronAPI.clearSalesHistory();
  }
}
