import { Component, inject, OnInit } from '@angular/core';
import { UserCheckinActionComponent } from '../user-checkin-action/user-checkin-action.component';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { IAttendance, IDepartment, IPosition } from '../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as FileSaver from 'file-saver';
import { SelectionModel } from '@angular/cdk/collections';
@Component({
  selector: 'app-user-checkin',
  templateUrl: './user-checkin.component.html',
  styleUrl: './user-checkin.component.css',
})
export class UserCheckinComponent implements OnInit {
  private _snackBar = inject(MatSnackBar);
  displayedColumns: string[] = [
    'select',
    'employeeCode',
    'employee',
    'department',
    'position',
    'date',
    'dayWeek',
    'timeIn',
    'lunchStart',
    'timeOut',
    'lunchEnd',
    'actions',
  ];
  selection = new SelectionModel<any>(true, []);
  attendanceData: IAttendance[] = [];
  filter: any = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  };
  departmentList: IDepartment[] = [];
  positionList: IPosition[] = [];

  constructor(private dialog: MatDialog) {}

  async ngOnInit() {
    await this.loadDepartments();
    await this.loadPositions();
    this.loadAttendance();
  }

  async loadDepartments() {
    this.departmentList = await (window as any).electronAPI.getDepartments();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.attendanceData.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.attendanceData.forEach(row => this.selection.select(row));
  }

  

  async loadPositions() {
    this.positionList = await (window as any).electronAPI.getPositions();
  }

  loadAttendance() {
    (window as any).electronAPI
      .getAttendance(this.filter)
      .then((data: any) => {
        this.attendanceData = data;
      })
      .catch((err: any) =>
        console.error('Lỗi khi tải danh sách chấm công:', err)
      );
  }

  openDialog(data?: any) {
    const dialogRef = this.dialog.open(UserCheckinActionComponent, {
      width: '400px',
      data: data || {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadAttendance();
      }
    });
  }

  deleteAttendance(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      (window as any).electronAPI
        .deleteAttendance(id)
        .then(() => this.loadAttendance());
    }
  }

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) {
      this._snackBar.open('Chỉ được chọn một file!', 'Đóng', { duration: 3000 });
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
        this.importAttendance(data);
      } catch (error) {
        this._snackBar.open('Lỗi khi đọc file Excel', 'Đóng', { duration: 3000 });
        console.error('Lỗi khi đọc file Excel:', error);
      }
    };

    reader.onerror = () => {
      this._snackBar.open('Lỗi khi đọc file', 'Đóng', { duration: 3000 });
    };

    reader.readAsBinaryString(target.files[0]);
  }

  importAttendance(data: any[]) {
    if (data.length < 2) {
      this._snackBar.open('File Excel không có dữ liệu!', 'Đóng', { duration: 3000 });
      return;
    }

    const headers = data[2];
    if (!headers) {
      this._snackBar.open('File Excel không đúng định dạng!', 'Đóng', { duration: 3000 });
      return;
    }

    const indexMap: { [key: string]: number } = {
      employeeCode: headers.findIndex(
        (h: string) =>
          h?.toLocaleLowerCase() == 'Mã nhân viên'.toLocaleLowerCase()
      ),
      employeeName: headers.findIndex(
        (h: string) =>
          h?.toLocaleLowerCase() == 'Tên nhân viên'.toLocaleLowerCase()
      ),
      departmentName: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Bộ Phận'.toLocaleLowerCase()
      ),
      date: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Ngày'.toLocaleLowerCase()
      ),
      timeIn: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Vào 1'.toLocaleLowerCase()
      ),
      lunchStart: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Ra 1'.toLocaleLowerCase()
      ),
      timeOut: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Vào 2'.toLocaleLowerCase()
      ),
      lunchEnd: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Ra 2'.toLocaleLowerCase()
      ),
    };

    // Kiểm tra các cột bắt buộc
    const requiredColumns = ['employeeCode', 'employeeName', 'departmentName', 'date'];
    const missingColumns = requiredColumns.filter(col => indexMap[col] === -1);
    if (missingColumns.length > 0) {
      this._snackBar.open(`Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`, 'Đóng', { duration: 3000 });
      return;
    }

    const formatTime = (time: any): string => {
      if (!time) return '';
      try {
        if (typeof time === 'number') {
          const date = new Date(time * 24 * 60 * 60 * 1000);
          return `${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
        }
        if (typeof time === 'string') {
          if (time.includes(':')) {
            return time.substring(0, 5);
          }
          // Xử lý các định dạng ngày giờ khác nếu cần
        }
        if (time instanceof Date) {
          return `${time.getHours().toString().padStart(2, '0')}:${time
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
        }
      } catch (error) {
        console.error('Lỗi khi xử lý thời gian:', error);
      }
      return '';
    };

    const attendanceList = data.slice(3)
      .filter(row => row && row.length > 0 && row[indexMap['employeeCode']])
      .map((row) => ({
        employeeCode: row[indexMap['employeeCode']]?.toString().trim(),
        employeeName: row[indexMap['employeeName']]?.toString().trim(),
        departmentName: row[indexMap['departmentName']]?.toString().trim(),
        date: row[indexMap['date']],
        timeIn: formatTime(row[indexMap['timeIn']]),
        lunchStart: formatTime(row[indexMap['lunchStart']]),
        timeOut: formatTime(row[indexMap['timeOut']]),
        lunchEnd: formatTime(row[indexMap['lunchEnd']]),
      }));

    if (attendanceList.length === 0) {
      this._snackBar.open('Không có dữ liệu hợp lệ để import', 'Đóng', { duration: 3000 });
      return;
    }

    this._snackBar.open('Đang xử lý dữ liệu...', 'Đóng', { duration: 2000 });

    (window as any).electronAPI
      .importAttendance(attendanceList)
      .then(() => {
        this.loadAttendance();
        this._snackBar.open(`Import thành công ${attendanceList.length} bản ghi`, 'Đóng', {
          duration: 3000,
        });
      })
      .catch((err: any) => {
        console.error('Lỗi khi import dữ liệu:', err);
        this._snackBar.open('Lỗi khi import dữ liệu', 'Đóng', {
          duration: 3000,
        });
      });
  }

  getWeekDay(date: string | Date) {
    const day = new Date(isNaN(Number(date)) ? date : Number(date)).getDay();

    return day === 0
      ? 'Chủ nhật'
      : day === 1
      ? 'Thứ hai'
      : day === 2
      ? 'Thứ ba'
      : day === 3
      ? 'Thứ tư'
      : day === 4
      ? 'Thứ năm'
      : day === 5
      ? 'Thứ sáu'
      : 'Thứ bảy';
  }

  formatDate(date: string | Date): string {
    const d = new Date(isNaN(Number(date)) ? date : Number(date));

    return `${('0' + d.getDate()).slice(-2)}/${('0' + (d.getMonth() + 1)).slice(
      -2
    )}/${d.getFullYear()}`;
  }

  deleteMultiAttendance(){
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      this._snackBar.open('Vui lòng chọn ít nhất một nhân viên để xóa.', 'Đóng', {
        duration: 3000,
      });
      return;
    }

    const idsToDelete = selectedRows.map((row) => row.id);

    
    if (confirm('Bạn có chắc chắn muốn xóa những nhân viên đã chọn?')) {
      (window as any).electronAPI
        .deleteAttendancesByIds(idsToDelete)
        .then(() => {
          this.loadAttendance();
          this._snackBar.open('Xóa thành công', 'Đóng', {
            duration: 3000,
          });
        })
        .catch((err: any) => {
          this._snackBar.open('Lỗi khi xóa dữ liệu', 'Đóng', {
            duration: 3000,
          });
        });
    }
  }

  exportAttendance() {
    const title = 'BẢNG CHẤM CÔNG';
    const headers = [
      'Mã Nhân viên',
      'Nhân viên',
      'Phòng ban',
      'Chức vụ',
      'Ngày',
      'Thứ',
      'Giờ vào 1',
      'Giờ ra 1',
      'Giờ vào 2',
      'Giờ ra 2',
    ];
    // Chuẩn bị dữ liệu
    const exportData = this.attendanceData.map((row) => [
      row.employee?.code || '',
      row.employee?.name || '',
      row.employee?.department?.name || '',
      row.employee?.position?.name || '',
      row.date ? this.formatDate(row.date) : '',
      row.date ? this.getWeekDay(row.date) : '',
      row.timeIn || '',
      row.lunchStart || '',
      row.lunchEnd || '',
      row.timeOut || '',
    ]);
    const worksheetData = [
      [], // Dòng 1: trống
      [title], // Dòng 2: tiêu đề
      headers, // Dòng 3: tên cột
      ...exportData, // Từ dòng 4 trở đi: dữ liệu
    ];
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Gộp ô cho tiêu đề dòng 2 (row 2, A2 đến J2)
    worksheet['!merges'] = [
      {
        s: { r: 1, c: 0 }, // bắt đầu từ hàng 2 (index 1), cột A (index 0)
        e: { r: 1, c: headers.length - 1 }, // kết thúc ở cột J (index 9)
      },
    ];

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Chấm công': worksheet },
      SheetNames: ['Chấm công'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const data: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(data, 'ChamCong.xlsx');
  }
}
