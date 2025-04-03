import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-user-checkin-action',
  templateUrl: './user-checkin-action.component.html',
  styleUrl: './user-checkin-action.component.css'
})
export class UserCheckinActionComponent implements OnInit {
  attendanceForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserCheckinActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.attendanceForm = this.fb.group({
      employeeId: [this.data?.employeeId || '', Validators.required],
      date: [this.data?.date || '', Validators.required],
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

      (window as any).electronAPI.addAttendance(
        attendanceData.employeeId,
        attendanceData.date,
        attendanceData.timeIn,
        attendanceData.timeOut,
        null, // totalHours (tính toán sau)
        attendanceData.lunchStart,
        attendanceData.lunchEnd,
        null, // lunchHours (tính toán sau)
        attendanceData.note
      ).then(() => this.dialogRef.close(true));
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
