import { Component, OnInit } from '@angular/core';
import { UserCheckinActionComponent } from '../user-checkin-action/user-checkin-action.component';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-user-checkin',
  templateUrl: './user-checkin.component.html',
  styleUrl: './user-checkin.component.css'
})
export class UserCheckinComponent implements OnInit {
  displayedColumns: string[] = ['employee', 'date', 'timeIn', 'timeOut', 'lunchStart', 'lunchEnd', 'actions'];
  attendanceData: any[] = [];

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.loadAttendance();
  }

  loadAttendance() {
    (window as any).electronAPI.getAttendance({})
      .then((data: any) => this.attendanceData = data)
      .catch((err: any) => console.error('Lỗi khi tải danh sách chấm công:', err));
  }

  openDialog(data?: any) {
    const dialogRef = this.dialog.open(UserCheckinActionComponent, {
      width: '400px',
      data: data || {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAttendance();
      }
    });
  }

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) {
      console.error('Chỉ được chọn một file!');
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      this.importAttendance(data);
    };

    reader.readAsBinaryString(target.files[0]);
  }

  importAttendance(data: any[]) {
    if (data.length < 2) {
      console.error('File Excel không có dữ liệu!');
      return;
    }

    const headers = data[0];
    const indexMap = {
      employeeId: headers.indexOf('Employee ID'),
      date: headers.indexOf('Date'),
      timeIn: headers.indexOf('Time In'),
      timeOut: headers.indexOf('Time Out'),
      lunchStart: headers.indexOf('Lunch Start'),
      lunchEnd: headers.indexOf('Lunch End'),
      note: headers.indexOf('Note')
    };

    const attendanceList = data.slice(1).map(row => ({
      employeeId: row[indexMap.employeeId],
      date: row[indexMap.date],
      timeIn: row[indexMap.timeIn],
      timeOut: row[indexMap.timeOut],
      lunchStart: row[indexMap.lunchStart],
      lunchEnd: row[indexMap.lunchEnd],
      note: row[indexMap.note]
    }));

    (window as any).electronAPI.importAttendance(attendanceList)
      .then(() => this.loadAttendance())
      .catch((err: any) => console.error('Lỗi import dữ liệu:', err));
  }
}