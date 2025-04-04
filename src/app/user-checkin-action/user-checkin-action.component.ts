import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IEmployee } from '../models/user.model';

@Component({
  selector: 'app-user-checkin-action',
  templateUrl: './user-checkin-action.component.html',
  styleUrl: './user-checkin-action.component.css'
})
export class UserCheckinActionComponent implements OnInit {
  attendanceForm!: FormGroup;
  employees: IEmployee[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserCheckinActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    (window as any).electronAPI.getEmployees({}).then((employees: IEmployee[]) => {
      this.employees = employees;
    });
  }

  ngOnInit() {
    this.attendanceForm = this.fb.group({
      employeeId: [this.data?.employeeId || '', Validators.required],
      date: [this.data?.date ? new Date(Number(this.data?.date)) : undefined, Validators.required],
      timeIn: [this.data?.timeIn || '', Validators.required],
      timeOut: [this.data?.timeOut || '', Validators.required],
      lunchStart: [this.data?.lunchStart || ''],
      lunchEnd: [this.data?.lunchEnd || ''],
      note: [this.data?.note || '']
    });
  }

  onSave() {
    if (this.attendanceForm.valid) {
      const attendanceData = { ...this.data, ...this.attendanceForm.value };
      if (attendanceData.id) {
        (window as any).electronAPI.updateAttendance(attendanceData.id, attendanceData).then(() => this.dialogRef.close(true));
      } else {
        (window as any).electronAPI.addAttendance(attendanceData).then((res: any) => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
