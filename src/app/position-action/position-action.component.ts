import { Component, Inject, OnInit } from '@angular/core';
import { DepartmentActionComponent } from '../department-action/department-action.component';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-position-action',
  templateUrl: './position-action.component.html',
  styleUrl: './position-action.component.css'
})
export class PositionActionComponent implements OnInit {

  positionForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PositionActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.positionForm = this.fb.group({
      code: [this.data?.code || '', Validators.required],
      name: [this.data?.name || '', Validators.required],
    });
  }

  onSave() {
    if (this.positionForm.valid) {
      const positionData = { ...this.data, ...this.positionForm.value };
      if (positionData.id) {
        (window as any).electronAPI.updatePosition(
          positionData.id,
          positionData.code,
          positionData.name
        ).then(() => this.dialogRef.close(true));
      } else {
        (window as any).electronAPI.addPosition(
          positionData.code,
          positionData.name
        ).then(() => this.dialogRef.close(true));
      }
    }

  }
  onCancel() {
    this.dialogRef.close();
  }
}
