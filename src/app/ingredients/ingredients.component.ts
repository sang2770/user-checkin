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
  styleUrls: ['./ingredients.component.css']
})
export class IngredientsComponent implements OnInit {
  ingredients: IIngredient[] = [];
  displayedColumns: string[] = ['name', 'code', 'unit', 'currentStock', 'costPrice', 'lowStockAlert', 'actions'];
  loading = false;

  constructor(
    private databaseService: DatabaseService,
    private dataSeederService: DataSeederService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadIngredients();
  }

  async loadIngredients() {
    this.loading = true;
    try {
      this.ingredients = await this.databaseService.getIngredients();
    } catch (error) {
      this.snackBar.open('Lỗi khi tải danh sách nguyên liệu', 'Đóng', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  async seedSampleData() {
    this.loading = true;
    try {
      await this.dataSeederService.seedInitialData();
      this.snackBar.open('Import dữ liệu mẫu thành công', 'Đóng', { duration: 3000 });
      this.loadIngredients();
    } catch (error) {
      this.snackBar.open('Lỗi khi import dữ liệu mẫu', 'Đóng', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  openDialog(ingredient?: IIngredient) {
    const dialogRef = this.dialog.open(IngredientDialogComponent, {
      width: '500px',
      data: ingredient ? { ...ingredient } : null
    });

    dialogRef.afterClosed().subscribe(result => {
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
      this.snackBar.open('Thêm nguyên liệu thành công', 'Đóng', { duration: 3000 });
      this.loadIngredients();
    } catch (error) {
      this.snackBar.open('Lỗi khi thêm nguyên liệu', 'Đóng', { duration: 3000 });
    }
  }

  async updateIngredient(id: number, ingredient: Partial<IIngredient>) {
    try {
      await this.databaseService.updateIngredient(id, ingredient);
      this.snackBar.open('Cập nhật nguyên liệu thành công', 'Đóng', { duration: 3000 });
      this.loadIngredients();
    } catch (error) {
      this.snackBar.open('Lỗi khi cập nhật nguyên liệu', 'Đóng', { duration: 3000 });
    }
  }

  async deleteIngredient(ingredient: IIngredient) {
    if (confirm(`Bạn có chắc chắn muốn xóa "${ingredient.name}"?`)) {
      try {
        await this.databaseService.deleteIngredient(ingredient.id!);
        this.snackBar.open('Xóa nguyên liệu thành công', 'Đóng', { duration: 3000 });
        this.loadIngredients();
      } catch (error) {
        this.snackBar.open('Lỗi khi xóa nguyên liệu', 'Đóng', { duration: 3000 });
      }
    }
  }

  isLowStock(ingredient: IIngredient): boolean {
    return !!(ingredient.lowStockAlert && ingredient.lowStockAlert > 0 && ingredient.currentStock <= ingredient.lowStockAlert);
  }
}
