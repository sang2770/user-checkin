import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IIngredient } from '../models/inventory.model';

@Component({
  selector: 'app-ingredient-dialog',
  templateUrl: './ingredient-dialog.component.html',
  styleUrls: ['./ingredient-dialog.component.css'],
})
export class IngredientDialogComponent implements OnInit {
  ingredientForm: FormGroup;
  isEdit: boolean = false;

  units = [
    'gram',
    'kg',
    'lít',
    'ml',
    'chai',
    'lon',
    'gói',
    'hộp',
    'quả',
    'viên',
    'cây',
    'miếng',
    'phần',
    'tô',
    'chén',
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<IngredientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IIngredient
  ) {
    this.isEdit = !!data;

    this.ingredientForm = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      code: [data?.code || '', [Validators.required]],
      unit: [data?.unit || '', [Validators.required]],
      currentStock: [
        data?.currentStock || 0,
        [Validators.required, Validators.min(0)],
      ],
      costPrice: [
        data?.costPrice || 0,
        [Validators.required, Validators.min(0)],
      ],
      lowStockAlert: [data?.lowStockAlert || 1, [Validators.min(0)]],
    });
  }

  ngOnInit() {}

  onSave() {
    if (this.ingredientForm.valid) {
      const formData = this.ingredientForm.value;
      if (this.isEdit) {
        formData.id = this.data.id;
      }
      this.dialogRef.close(formData);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  generateCode() {
    const name = this.ingredientForm.get('name')?.value;
    if (name) {
      const code = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      this.ingredientForm.patchValue({ code });
    }
  }
}
