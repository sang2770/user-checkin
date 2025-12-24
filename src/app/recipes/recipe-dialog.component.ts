import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';
import { IRecipe, IProduct, IIngredient } from '../models/inventory.model';

@Component({
  selector: 'app-recipe-dialog',
  templateUrl: './recipe-dialog.component.html',
  styleUrls: ['./recipe-dialog.component.css']
})
export class RecipeDialogComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<RecipeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      recipe: IRecipe | null;
      products: IProduct[];
      ingredients: IIngredient[];
    }
  ) {
    this.isEdit = !!data.recipe;
    this.form = this.fb.group({
      productId: [data.recipe?.productId || '', Validators.required],
      ingredientId: [data.recipe?.ingredientId || '', Validators.required],
      quantity: [data.recipe?.quantity || '', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.form.valid) {
      try {
        const formValue = this.form.value;
        
        if (this.isEdit) {
          await this.databaseService.updateRecipe(this.data.recipe!.id!, formValue);
          this.snackBar.open('Cập nhật công thức thành công', 'Đóng', { duration: 3000 });
        } else {
          await this.databaseService.createRecipe(formValue);
          this.snackBar.open('Tạo công thức thành công', 'Đóng', { duration: 3000 });
        }
        
        this.dialogRef.close(true);
      } catch (error) {
        this.snackBar.open('Có lỗi xảy ra', 'Đóng', { duration: 3000 });
        console.error('Error saving recipe:', error);
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  getSelectedProduct(): IProduct | undefined {
    const productId = this.form.get('productId')?.value;
    return this.data.products.find(p => p.id === productId);
  }

  getSelectedIngredient(): IIngredient | undefined {
    const ingredientId = this.form.get('ingredientId')?.value;
    return this.data.ingredients.find(i => i.id === ingredientId);
  }
}
