import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class DataSeederService {

  constructor(private databaseService: DatabaseService) { }

  async seedInitialData() {
    try {
      // Sample ingredients based on note.txt requirements
      const sampleIngredients = [
        { name: 'Thịt bò', code: 'THIT_BO', unit: 'gram', currentStock: 0, costPrice: 500, lowStockAlert: 500 },
        { name: 'Thịt heo', code: 'THIT_HEO', unit: 'gram', currentStock: 0, costPrice: 400, lowStockAlert: 500 },
        { name: 'Mì gói', code: 'MI_GOI', unit: 'gói', currentStock: 0, costPrice: 5000, lowStockAlert: 20 },
        { name: 'Nước ngọt', code: 'NUOC_NGOT', unit: 'chai', currentStock: 0, costPrice: 8000, lowStockAlert: 10 },
        { name: 'Thuốc lá', code: 'THUOC_LA', unit: 'bao', currentStock: 0, costPrice: 18000, lowStockAlert: 5 },
        { name: 'Trứng', code: 'TRUNG', unit: 'quả', currentStock: 0, costPrice: 3000, lowStockAlert: 10 },
        { name: 'Cá viên', code: 'CA_VIEN', unit: 'viên', currentStock: 0, costPrice: 1000, lowStockAlert: 50 },
        { name: 'Xúc xích', code: 'XUC_XICH', unit: 'gram', currentStock: 0, costPrice: 300, lowStockAlert: 300 },
        { name: 'Khoai tây', code: 'KHOAI_TAY', unit: 'kg', currentStock: 0, costPrice: 25000, lowStockAlert: 2 }
      ];

      // Create ingredients
      for (const ingredient of sampleIngredients) {
        try {
          await this.databaseService.createIngredient(ingredient);
        } catch (error) {
          console.log(`Ingredient ${ingredient.name} already exists or error:`, error);
        }
      }

      // Create sample recipes (product-ingredient mapping)
      const products = await this.databaseService.getProducts();
      const ingredients = await this.databaseService.getIngredients();

      // Helper function to find ingredient and product by name
      const findIngredient = (name: string) => ingredients.find(i => i.name?.includes(name));
      const findProduct = (name: string) => products.find(p => p.name?.includes(name));

      const sampleRecipes = [
        // Mì xào các loại
        { product: 'Mỳ Xào Trứng', ingredients: [['Mì gói', 1], ['Trứng', 1]] },
        { product: 'Mỳ Xào Trứng + Xúc Xích', ingredients: [['Mì gói', 1], ['Trứng', 1], ['Xúc xích', 40]] },
        { product: 'Mỳ Xào Xúc Xích + Cá Viên', ingredients: [['Mì gói', 1], ['Xúc xích', 40], ['Cá viên', 5]] },
        { product: 'MÌ XÀO XÚC XÍCH + TRỨNG + CÁ VIÊN', ingredients: [['Mì gói', 1], ['Xúc xích', 40], ['Trứng', 1], ['Cá viên', 5]] },
        { product: 'Xáo Bò', ingredients: [['Mì gói', 1], ['Thịt bò', 65]] },
        { product: 'Mỳ Tôm', ingredients: [['Mì gói', 1]] },
        
        // Món khác
        { product: 'Khoai Tây Chiên', ingredients: [['Khoai tây', 0.2]] },
        { product: 'Xúc Xích Chiên(1 Cây)', ingredients: [['Xúc xích', 100]] },
      ];

      for (const recipeData of sampleRecipes) {
        const product = findProduct(recipeData.product);
        if (product) {
          for (const [ingredientName, quantity] of recipeData.ingredients) {
            const ingredient = findIngredient(ingredientName as string);
            if (ingredient) {
              try {
                await this.databaseService.createRecipe({
                  name: '',
                  productId: product.id!,
                  ingredientId: ingredient.id!,
                  quantity: quantity as number
                });
              } catch (error) {
                console.log(`Recipe ${product.name} - ${ingredient.name} already exists or error:`, error);
              }
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  }
}
