import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-department-action',
  templateUrl: './department-action.component.html',
  styleUrl: './department-action.component.css'
})
export class DepartmentActionComponent implements OnInit {

  departmentForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DepartmentActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.departmentForm = this.fb.group({
      code: [this.data?.code || '', Validators.required],
      name: [this.data?.name || '', Validators.required],
    });
  }

  onSave() {
    if (this.departmentForm.valid) {
      const departmentData = { ...this.data, ...this.departmentForm.value };
      if (departmentData.id) {
        (window as any).electronAPI.updateDepartment(
          departmentData.id,
          departmentData.code,
          departmentData.name
        ).then(() => this.dialogRef.close(true)).catch((err: any) => {
          console.log(err);

        });
      } else {
        (window as any).electronAPI.addDepartment(
          departmentData.code,
          departmentData.name
        ).then(() => this.dialogRef.close(true)).catch((err: any) => {
          console.log(err);

        });
      }
    }

  }
  onCancel() {
    this.dialogRef.close();
  }
}
