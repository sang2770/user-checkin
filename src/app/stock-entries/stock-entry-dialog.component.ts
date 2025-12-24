import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from '../services/database.service';
import { IIngredient } from '../models/inventory.model';

@Component({
  selector: 'app-stock-entry-dialog',
  templateUrl: './stock-entry-dialog.component.html',
  styleUrls: ['./stock-entry-dialog.component.css']
})
export class StockEntryDialogComponent implements OnInit {
  stockEntryForm: FormGroup;
  ingredients: IIngredient[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<StockEntryDialogComponent>,
    private databaseService: DatabaseService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.stockEntryForm = this.fb.group({
      ingredientId: ['', [Validators.required]],
      quantity: [0, [Validators.required, Validators.min(0.1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      supplier: [''],
      note: [''],
      date: [new Date().toISOString().split('T')[0], [Validators.required]]
    });
  }

  async ngOnInit() {
    await this.loadIngredients();
  }

  async loadIngredients() {
    this.loading = true;
    try {
      this.ingredients = await this.databaseService.getIngredients();
    } catch (error) {
      console.error('Error loading ingredients:', error);
    } finally {
      this.loading = false;
    }
  }

  get totalCost(): number {
    const quantity = this.stockEntryForm.get('quantity')?.value || 0;
    const unitPrice = this.stockEntryForm.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  onSave() {
    if (this.stockEntryForm.valid) {
      const formData = this.stockEntryForm.value;
      formData.totalCost = this.totalCost;
      formData.date = new Date(formData.date);
      this.dialogRef.close(formData);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
