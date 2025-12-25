import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';
import { DataSeederService } from '../services/data-seeder.service';
import { IIngredient } from '../models/inventory.model';
import { IngredientDialogComponent } from './ingredient-dialog.component';

@Component({
  selector: 'app-ingredients',
  templateUrl: './ingredients.component.html',
  styleUrls: ['./ingredients.component.css'],
})
export class IngredientsComponent implements OnInit {
  ingredients: IIngredient[] = [];
  products: any[] = []; // Add products list to check duplicates
  displayedColumns: string[] = [
    'name',
    'code',
    'unit',
    'currentStock',
    'costPrice',
    'lowStockAlert',
    'actions',
  ];
  loading = false;

  constructor(
    private databaseService: DatabaseService,
    private dataSeederService: DataSeederService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    await Promise.all([this.loadIngredients(), this.loadProducts()]);
  }

  async loadIngredients() {
    this.loading = true;
    try {
      this.ingredients = await this.databaseService.getIngredients();
    } catch (error) {
      this.snackBar.open('Lỗi khi tải danh sách nguyên liệu', 'Đóng', {
        duration: 3000,
      });
    } finally {
      this.loading = false;
    }
  }

  async loadProducts() {
    try {
      this.products = await this.databaseService.getProducts();
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async seedSampleData() {
    this.loading = true;
    try {
      await this.dataSeederService.seedInitialData();
      this.snackBar.open('Import dữ liệu mẫu thành công', 'Đóng', {
        duration: 3000,
      });
      this.loadIngredients();
    } catch (error) {
      this.snackBar.open('Lỗi khi import dữ liệu mẫu', 'Đóng', {
        duration: 3000,
      });
    } finally {
      this.loading = false;
    }
  }

  openDialog(ingredient?: IIngredient) {
    const dialogRef = this.dialog.open(IngredientDialogComponent, {
      width: '500px',
      data: ingredient ? { ...ingredient } : null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.id) {
          this.updateIngredient(result.id, result);
        } else {
          this.createIngredient(result);
        }
      }
    });
  }

  async createIngredient(ingredient: Omit<IIngredient, 'id'>) {
    try {
      await this.databaseService.createIngredient(ingredient);
      this.snackBar.open('Thêm nguyên liệu thành công', 'Đóng', {
        duration: 3000,
      });
      this.loadData();
    } catch (error) {
      this.snackBar.open('Lỗi khi thêm nguyên liệu', 'Đóng', {
        duration: 3000,
      });
    }
  }

  async updateIngredient(id: number, ingredient: Partial<IIngredient>) {
    try {
      await this.databaseService.updateIngredient(id, ingredient);
      this.snackBar.open('Cập nhật nguyên liệu thành công', 'Đóng', {
        duration: 3000,
      });
      this.loadData();
    } catch (error) {
      this.snackBar.open('Lỗi khi cập nhật nguyên liệu', 'Đóng', {
        duration: 3000,
      });
    }
  }

  async deleteIngredient(ingredient: IIngredient) {
    if (confirm(`Bạn có chắc chắn muốn xóa "${ingredient.name}"?`)) {
      try {
        await this.databaseService.deleteIngredient(ingredient.id!);
        this.snackBar.open('Xóa nguyên liệu thành công', 'Đóng', {
          duration: 3000,
        });
        this.loadData();
      } catch (error) {
        this.snackBar.open('Lỗi khi xóa nguyên liệu', 'Đóng', {
          duration: 3000,
        });
      }
    }
  }

  async createProductFromIngredient(ingredient: IIngredient) {
    if (confirm(`Tạo sản phẩm bán lẻ từ nguyên liệu "${ingredient.name}"?`)) {
      this.loading = true;
      try {
        const result = await this.databaseService.createProductFromIngredient(
          ingredient.id!
        );
        this.snackBar.open(
          `Đã tạo sản phẩm "${result.product.name}" và công thức thành công`,
          'Đóng',
          { duration: 5000 }
        );
        this.loadData(); // Reload data to update product list
      } catch (error) {
        this.snackBar.open('Lỗi khi tạo sản phẩm từ nguyên liệu', 'Đóng', {
          duration: 3000,
        });
        console.error('Error creating product from ingredient:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  isLowStock(ingredient: IIngredient): boolean {
    return !!(
      ingredient.lowStockAlert &&
      ingredient.lowStockAlert > 0 &&
      ingredient.currentStock <= ingredient.lowStockAlert
    );
  }

  hasProductWithSameName(ingredient: IIngredient): boolean {
    return this.products.some(
      (product) => product.name.toLowerCase() === ingredient.name?.toLowerCase()
    );
  }
}
