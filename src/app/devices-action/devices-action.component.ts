import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentActionComponent } from '../department-action/department-action.component';

@Component({
  selector: 'app-devices-action',
  templateUrl: './devices-action.component.html',
  styleUrl: './devices-action.component.css'
})
export class DevicesActionComponent implements OnInit {
  deviceForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DevicesActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.deviceForm = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      serial_number: [this.data?.serial_number || '', Validators.required],
      area: [this.data?.area || ''],
      ip_address: [this.data?.ip_address || ''],
      status: [!!this.data?.status || false],
      last_active: [this.data?.last_active || ''],
      user: [this.data?.user || ''],
      fingerprint: [this.data?.fingerprint || ''],
      face: [this.data?.face || ''],
      palm: [this.data?.palm || ''],
      event: [this.data?.event || ''],
      command: [this.data?.command || ''],
    });
  }

  onSave() {
    if (this.deviceForm.valid) {
      const deviceData = { ...this.data, ...this.deviceForm.value };
      if (deviceData.id) {
        (window as any).electronAPI.updateDevice(deviceData.id, deviceData).then(() => {
          this.dialogRef.close(true);
        }).catch((err: any) => {
          console.error(err);
        });
      } else {
        (window as any).electronAPI.addDevice(deviceData).then(() => {
          this.dialogRef.close(true);
        }).catch((err: any) => {
          console.error(err);
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}

