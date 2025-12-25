import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';
import { IRecipe, IProduct, IIngredient } from '../models/inventory.model';

@Component({
  selector: 'app-recipe-dialog',
  templateUrl: './recipe-dialog.component.html',
  styleUrls: ['./recipe-dialog.component.css']
})
export class RecipeDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('firstInput') firstInput!: ElementRef;
  form: FormGroup;
  isEdit: boolean;
  selectedProduct: IProduct | null = null;
  existingRecipes: IRecipe[] = [];

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<RecipeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      recipe: IRecipe | null;
      products: IProduct[];
      ingredients: IIngredient[];
      productId?: number; // Để tạo recipe cho product cụ thể
    }
  ) {
    this.isEdit = !!data.recipe;
    this.form = this.fb.group({
      productId: [data.recipe?.productId || data.productId || '', Validators.required],
      ingredients: this.fb.array([])
    });

    // Nếu là edit mode và có recipe, thêm vào form
    if (this.isEdit && data.recipe) {
      this.addIngredientFormGroup(data.recipe.ingredientId, data.recipe.quantity);
    } else {
      // Thêm 1 ingredient form group mặc định
      this.addIngredientFormGroup();
    }
  }

  ngOnInit() {
    // Listen for product changes to load existing recipes
    this.form.get('productId')?.valueChanges.subscribe(productId => {
      if (productId) {
        this.loadExistingRecipes(productId);
        this.selectedProduct = this.data.products.find(p => p.id === productId) || null;
      }
    });

    // Set initial product if specified
    if (this.data.productId || this.data.recipe?.productId) {
      const productId = this.data.productId || this.data.recipe?.productId;
      this.loadExistingRecipes(productId!);
      this.selectedProduct = this.data.products.find(p => p.id === productId) || null;
    }
  }

  ngAfterViewInit() {
    // Set focus to first input after dialog opens to avoid aria-hidden issues
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 100);
  }

  get ingredientsArray() {
    return this.form.get('ingredients') as FormArray;
  }

  addIngredientFormGroup(ingredientId?: number, quantity?: number) {
    const ingredientGroup = this.fb.group({
      ingredientId: [ingredientId || '', Validators.required],
      quantity: [quantity || '', [Validators.required, Validators.min(0.01)]]
    });
    
    this.ingredientsArray.push(ingredientGroup);
  }

  removeIngredientFormGroup(index: number) {
    if (this.ingredientsArray.length > 1) {
      this.ingredientsArray.removeAt(index);
    }
  }

  async loadExistingRecipes(productId: number) {
    try {
      this.existingRecipes = await this.databaseService.getRecipesByProduct(productId);
    } catch (error) {
      console.error('Error loading existing recipes:', error);
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        const productId = this.form.get('productId')?.value;
        const ingredients = this.ingredientsArray.value;
        
        if (this.isEdit) {
          // Update single recipe
          const formValue = {
            productId: productId,
            ingredientId: ingredients[0].ingredientId,
            quantity: ingredients[0].quantity
          };
          await this.databaseService.updateRecipe(this.data.recipe!.id!, formValue);
          this.snackBar.open('Cập nhật công thức thành công', 'Đóng', { duration: 3000 });
        } else {
          // Create multiple recipes
          for (const ingredient of ingredients) {
            if (ingredient.ingredientId && ingredient.quantity) {
              const recipe = {
                productId: productId,
                ingredientId: ingredient.ingredientId,
                quantity: ingredient.quantity
              };
              
              try {
                await this.databaseService.createRecipe(recipe);
              } catch (error: any) {
                if (error.message?.includes('UNIQUE constraint failed')) {
                  this.snackBar.open(`Công thức cho nguyên liệu này đã tồn tại`, 'Đóng', { duration: 3000 });
                } else {
                  throw error;
                }
              }
            }
          }
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

  getSelectedIngredient(index: number): IIngredient | undefined {
    const ingredientId = this.ingredientsArray.at(index).get('ingredientId')?.value;
    return this.data.ingredients.find(i => i.id === ingredientId);
  }

  isIngredientAlreadyUsed(ingredientId: number, currentIndex: number): boolean {
    // Check if ingredient is already used in current form
    const currentIngredients = this.ingredientsArray.value;
    const foundIndex = currentIngredients.findIndex((ing: any, index: number) => 
      ing.ingredientId === ingredientId && index !== currentIndex
    );
    
    if (foundIndex !== -1) return true;
    
    // Check if ingredient is already used in existing recipes (for new recipes)
    if (!this.isEdit) {
      return this.existingRecipes.some(recipe => recipe.ingredientId === ingredientId);
    }
    
    return false;
  }

  getAvailableIngredients(currentIndex: number): IIngredient[] {
    return this.data.ingredients.filter(ingredient => 
      !this.isIngredientAlreadyUsed(ingredient.id!, currentIndex)
    );
  }

  getIngredientName(ingredientId: number): string {
    const ingredient = this.data.ingredients.find(i => i.id === ingredientId);
    return ingredient?.name || 'N/A';
  }

  getIngredientUnit(ingredientId: number): string {
    const ingredient = this.data.ingredients.find(i => i.id === ingredientId);
    return ingredient?.unit || '';
  }
}
