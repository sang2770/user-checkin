import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';
import { IRecipe, IProduct, IIngredient } from '../models/inventory.model';
import { RecipeDialogComponent } from './recipe-dialog.component';

@Component({
  selector: 'app-recipes',
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.css']
})
export class RecipesComponent implements OnInit {
  recipes: IRecipe[] = [];
  products: IProduct[] = [];
  ingredients: IIngredient[] = [];
  loading = false;
  displayedColumns: string[] = ['productName', 'ingredientName', 'quantity', 'unit', 'actions'];

  constructor(
    private databaseService: DatabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading = true;
    try {
      await Promise.all([
        this.loadRecipes(),
        this.loadProducts(),
        this.loadIngredients()
      ]);
    } catch (error) {
      this.snackBar.open('Lỗi khi tải dữ liệu', 'Đóng', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async loadRecipes() {
    this.recipes = await this.databaseService.getRecipes();
  }

  async loadProducts() {
    this.products = await this.databaseService.getProducts();
  }

  async loadIngredients() {
    this.ingredients = await this.databaseService.getIngredients();
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product?.name || 'N/A';
  }

  getIngredientName(ingredientId: number): string {
    const ingredient = this.ingredients.find(i => i.id === ingredientId);
    return ingredient?.name || 'N/A';
  }

  getIngredientUnit(ingredientId: number): string {
    const ingredient = this.ingredients.find(i => i.id === ingredientId);
    return ingredient?.unit || '';
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(RecipeDialogComponent, {
      width: '600px',
      data: {
        recipe: null,
        products: this.products,
        ingredients: this.ingredients
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRecipes();
      }
    });
  }

  openEditDialog(recipe: IRecipe) {
    const dialogRef = this.dialog.open(RecipeDialogComponent, {
      width: '600px',
      data: {
        recipe: recipe,
        products: this.products,
        ingredients: this.ingredients
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRecipes();
      }
    });
  }

  async deleteRecipe(recipe: IRecipe) {
    if (confirm(`Bạn có chắc chắn muốn xóa công thức "${this.getProductName(recipe.productId)} - ${this.getIngredientName(recipe.ingredientId)}"?`)) {
      try {
        await this.databaseService.deleteRecipe(recipe.id!);
        this.snackBar.open('Đã xóa công thức', 'Đóng', { duration: 3000 });
        await this.loadRecipes();
      } catch (error) {
        this.snackBar.open('Lỗi khi xóa công thức', 'Đóng', { duration: 3000 });
      }
    }
  }

  async seedSampleRecipes() {
    if (confirm('Bạn có chắc chắn muốn tạo dữ liệu mẫu? Điều này sẽ thêm các công thức mẫu.')) {
      try {
        this.loading = true;

        // Ensure we have sample products and ingredients
        await this.loadProducts();
        await this.loadIngredients();

        if (this.products.length === 0 || this.ingredients.length === 0) {
          this.snackBar.open('Vui lòng tạo sản phẩm và nguyên liệu trước', 'Đóng', { duration: 3000 });
          return;
        }

        // Find products and ingredients for sample recipes
        const miBoProduct = this.products.find(p => p.name && (p.name.toLowerCase().includes('mì bò') || p.name.toLowerCase().includes('mi bo')));
        const miXaoProduct = this.products.find(p => p.name && (p.name.toLowerCase().includes('mì xào') || p.name.toLowerCase().includes('mi xao')));
        const caVienProduct = this.products.find(p => p.name && (p.name.toLowerCase().includes('cá viên') || p.name.toLowerCase().includes('ca vien')));
        
        const miGoiIngredient = this.ingredients.find(i => i.name && (i.name.toLowerCase().includes('mì gói') || i.name.toLowerCase().includes('mi goi')));
        const thitIngredient = this.ingredients.find(i => i.name && (i.name.toLowerCase().includes('thịt') || i.name.toLowerCase().includes('thit')));
        const caVienIngredient = this.ingredients.find(i => i.name && (i.name.toLowerCase().includes('cá viên') || i.name.toLowerCase().includes('ca vien')));

        const sampleRecipes = [];

        // 1 tô mì bò = 1 gói mì + 65g thịt
        if (miBoProduct && miGoiIngredient) {
          sampleRecipes.push({
            productId: miBoProduct.id!,
            ingredientId: miGoiIngredient.id!,
            quantity: 1
          });
        }
        if (miBoProduct && thitIngredient) {
          sampleRecipes.push({
            productId: miBoProduct.id!,
            ingredientId: thitIngredient.id!,
            quantity: 65
          });
        }

        // 1 tô mì xào = 1 gói mì + 40g thịt
        if (miXaoProduct && miGoiIngredient) {
          sampleRecipes.push({
            productId: miXaoProduct.id!,
            ingredientId: miGoiIngredient.id!,
            quantity: 1
          });
        }
        if (miXaoProduct && thitIngredient) {
          sampleRecipes.push({
            productId: miXaoProduct.id!,
            ingredientId: thitIngredient.id!,
            quantity: 40
          });
        }

        // 1 phần cá viên = 5 viên
        if (caVienProduct && caVienIngredient) {
          sampleRecipes.push({
            productId: caVienProduct.id!,
            ingredientId: caVienIngredient.id!,
            quantity: 5
          });
        }

        // Create recipes
        for (const recipe of sampleRecipes) {
          try {
            await this.databaseService.createRecipe(recipe);
          } catch (error) {
            console.warn('Công thức đã tồn tại:', recipe);
          }
        }

        this.snackBar.open('Đã tạo dữ liệu mẫu công thức', 'Đóng', { duration: 3000 });
        await this.loadRecipes();
      } catch (error) {
        this.snackBar.open('Lỗi khi tạo dữ liệu mẫu', 'Đóng', { duration: 3000 });
        console.error('Error seeding recipes:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  getRecipesByProduct(): any[] {
    const groupedRecipes: { [key: number]: any } = {};
    
    this.recipes.forEach(recipe => {
      if (!groupedRecipes[recipe.productId]) {
        groupedRecipes[recipe.productId] = {
          productId: recipe.productId,
          productName: this.getProductName(recipe.productId),
          ingredients: []
        };
      }
      
      groupedRecipes[recipe.productId].ingredients.push({
        ingredientName: this.getIngredientName(recipe.ingredientId),
        quantity: recipe.quantity,
        unit: this.getIngredientUnit(recipe.ingredientId),
        recipe: recipe
      });
    });

    return Object.values(groupedRecipes);
  }
}
