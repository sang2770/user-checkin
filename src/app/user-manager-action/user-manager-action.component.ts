import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-user-manager-action',
  templateUrl: './user-manager-action.component.html',
  styleUrl: './user-manager-action.component.css'
})
export class UserManagerActionComponent implements OnInit {

  employeeForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<UserManagerActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.employeeForm = this.fb.group({
      code: [this.data?.code || '', Validators.required],
      name: [this.data?.name || '', Validators.required],
      department: [this.data?.department || '', Validators.required]
    });
  }

  onSave() {
    if (this.employeeForm.valid) {
      const employeeData = { ...this.data, ...this.employeeForm.value };
      if (employeeData.id) {
        (window as any).electronAPI.updateEmployee(
          employeeData.id,
          employeeData.code,
          employeeData.name,
          employeeData.department
        ).then(() => this.dialogRef.close(true));
      } else {
        (window as any).electronAPI.addEmployee(
          employeeData.code,
          employeeData.name,
          employeeData.department
        ).then(() => this.dialogRef.close(true));
      }
    }

  }
  onCancel() {
    this.dialogRef.close();
  }
}
