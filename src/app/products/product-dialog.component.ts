import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IProduct } from '../models/inventory.model';

@Component({
  selector: 'app-product-dialog',
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.css']
})
export class ProductDialogComponent implements OnInit {
  productForm: FormGroup;
  isEdit: boolean = false;

  categories = [
    'Đồ uống', 'Đồ ăn nhanh', 'Mì/Phở', 'Snack/Bánh kẹo', 
    'Thuốc lá', 'Khác'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IProduct
  ) {
    this.isEdit = !!data;
    if (this.isEdit) {
      data.isActive = (data.isActive === 1 || data.isActive) ? true : false;
    }
    this.productForm = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      code: [data?.code || '', [Validators.required]],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      category: [data?.category || '', []],
      isActive: [data?.isActive !== false] // Default to true
    });
  }

  ngOnInit() {}

  onSave() {
    if (this.productForm.valid) {
      const formData = this.productForm.value;
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
    const name = this.productForm.get('name')?.value;
    if (name) {
      const code = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      this.productForm.patchValue({ code });
    }
  }
}
