import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog';
import { IDepartment, IPosition } from '../models/user.model';

@Component({
  selector: 'app-user-manager-action',
  templateUrl: './user-manager-action.component.html',
  styleUrl: './user-manager-action.component.css'
})
export class UserManagerActionComponent implements OnInit {

  employeeForm!: FormGroup;

  departments: IDepartment[] = [
  ];

  positions: IPosition[] = [
  ];

  constructor(
    public dialogRef: MatDialogRef<UserManagerActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    (window as any).electronAPI.getDepartments().then((departments: IDepartment[]) => {
      this.departments = departments;
    });
    (window as any).electronAPI.getPositions().then((positions: IPosition[]) => {
      this.positions = positions;
    });
  }

  ngOnInit() {
    this.employeeForm = this.fb.group({
      code: [this.data?.code || '', Validators.required],
      name: [this.data?.name || '', Validators.required],
      departmentId: [this.data?.departmentId || '', []],
      positionId: [this.data?.positionId || '', []],
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
          employeeData.departmentId,
          employeeData.positionId
        ).then(() => this.dialogRef.close(true));
      } else {
        (window as any).electronAPI.addEmployee(
          employeeData.code,
          employeeData.name,
          employeeData.departmentId,
          employeeData.positionId
        ).then(() => this.dialogRef.close(true));
      }
    }

  }
  onCancel() {
    this.dialogRef.close();
  }
}
