import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IEmployee } from '../models/user.model';

@Component({
  selector: 'app-user-checkin-action',
  templateUrl: './user-checkin-action.component.html',
  styleUrl: './user-checkin-action.component.css',
})
export class UserCheckinActionComponent implements OnInit {
  attendanceForm!: FormGroup;
  employees: IEmployee[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserCheckinActionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    (window as any).electronAPI
      .getEmployees({})
      .then((employees: IEmployee[]) => {
        this.employees = employees;
      });
  }

  ngOnInit() {
    // Helper function to convert time data to string format for form inputs
    const formatTimeForInput = (timeValue: any): string => {
      if (!timeValue) return '';

      if (typeof timeValue === 'string') {
        // Nếu là chuỗi dạng H:mm hoặc HH:mm thì chuẩn hóa lại HH:mm
        const match = timeValue.match(/^(\d{1,2}):(\d{2})$/);
        if (match) {
          const hh = match[1].padStart(2, '0');
          const mm = match[2];
          return `${hh}:${mm}`;
        }
        return timeValue;
      }

      if (timeValue instanceof Date) {
        return `${timeValue.getHours().toString().padStart(2, '0')}:${timeValue
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;
      }

      return '';
    };

    // Helper function to parse date properly
    const parseDate = (dateValue: any): Date | undefined => {
      if (!dateValue) return undefined;

      if (typeof dateValue === 'string') {
        // If it's already a string date like "2024-10-02", create Date from it
        const parsedDate = new Date(dateValue);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
      }

      if (typeof dateValue === 'number') {
        const parsedDate = new Date(dateValue);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
      }

      return undefined;
    };

    this.attendanceForm = this.fb.group({
      employeeId: [this.data?.employeeId || '', Validators.required],
      date: [parseDate(this.data?.date), Validators.required],
      timeIn: [formatTimeForInput(this.data?.timeIn), Validators.required],
      timeOut: [formatTimeForInput(this.data?.timeOut), Validators.required],
      lunchStart: [formatTimeForInput(this.data?.lunchStart)],
      lunchEnd: [formatTimeForInput(this.data?.lunchEnd)],
      timeOut2: [formatTimeForInput(this.data?.timeOut2)],
      timeIn2: [formatTimeForInput(this.data?.timeIn2)],
      note: [this.data?.note || ''],
    });
    console.log(
      'Attendance Form Initialized:',
      this.attendanceForm.value,
      this.data
    );
  }

  onSave() {
    if (this.attendanceForm.valid) {
      const formValue = { ...this.attendanceForm.value };
      // Ensure date is saved as 'YYYY-MM-DD' string
      if (formValue.date instanceof Date && !isNaN(formValue.date.getTime())) {
        const year = formValue.date.getFullYear();
        const month = (formValue.date.getMonth() + 1)
          .toString()
          .padStart(2, '0');
        const day = formValue.date.getDate().toString().padStart(2, '0');
        formValue.date = `${year}-${month}-${day}`;
      }
      const attendanceData = { ...this.data, ...formValue };
      console.log('Saving Attendance Data:', attendanceData);

      if (attendanceData.id) {
        (window as any).electronAPI
          .updateAttendance(attendanceData.id, attendanceData)
          .then(() => this.dialogRef.close(true));
      } else {
        (window as any).electronAPI
          .addAttendance(attendanceData)
          .then((res: any) => {
            this.dialogRef.close(true);
          });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
