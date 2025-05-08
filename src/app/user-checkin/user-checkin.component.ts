import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { UserCheckinActionComponent } from '../user-checkin-action/user-checkin-action.component';
import { MatDialog } from '@angular/material/dialog';
import * as XLSX from 'xlsx';
import { IAttendance, IDepartment, IPosition } from '../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as FileSaver from 'file-saver';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-user-checkin',
  templateUrl: './user-checkin.component.html',
  styleUrls: ['./user-checkin.component.css'], // Fixed styleUrl to styleUrls
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
    'lunchEnd',
    'timeOut',
    'actions',
  ];
  selection = new SelectionModel<IAttendance>(true, []); // Fixed type to IAttendance
  attendanceData = new MatTableDataSource<IAttendance>([]);
  filter: any = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    page: 1,
    limit: 30,
  };
  totalItems: number = 0;
  departmentList: IDepartment[] = [];
  positionList: IPosition[] = [];

  constructor(private dialog: MatDialog) {}

  async ngOnInit() {
    await this.loadDepartments();
    await this.loadPositions();
    this.loadAttendance();
  }

  changePage(event: any) {
    this.filter.page = event.pageIndex + 1;
    this.filter.limit = event.pageSize;
    this.loadAttendance();
  }

  async loadDepartments() {
    this.departmentList = await (window as any).electronAPI.getDepartments();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.attendanceData.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.attendanceData.data.forEach((row) => this.selection.select(row));
    }
  }

  async loadPositions() {
    this.positionList = await (window as any).electronAPI.getPositions();
  }

  search() {
    this.filter = {
      ...this.filter,
      page: 0
    };
    if (this.filter.keyword) {
      this.filter.keyword = this.filter.keyword.trim();
    }
    this.loadAttendance();
  }

  loadAttendance() {
    const paginatedFilter = {
      ...this.filter,
      page: this.filter.page + 1
    };

    (window as any).electronAPI
      .getAttendance(paginatedFilter)
      .then((response: any) => {        
        this.attendanceData.data = response.data ?? [];
        this.totalItems = response.total ?? 0;
      })
      .catch((err: any) =>
        console.error('Lỗi khi tải danh sách chấm công:', err)
      );
  }

  ngAfterViewInit() {
  }

  // Rest of the code remains the same as it's working correctly
  // Only fixed the issues mentioned above:
  // 1. styleUrl -> styleUrls
  // 2. Selection type to IAttendance
  // 3. Proper typing for data in loadAttendance
  // 4. Fixed masterToggle implementation

  // The remaining methods are kept as is since they work correctly
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
      this._snackBar.open('Chỉ được chọn một file!', 'Đóng', {
        duration: 3000,
      });
      return;
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, {
          type: 'binary',
          cellDates: true,
        });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
        this.importAttendance(data);
      } catch (error) {
        this._snackBar.open('Lỗi khi đọc file Excel', 'Đóng', {
          duration: 3000,
        });
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
      this._snackBar.open('File Excel không có dữ liệu!', 'Đóng', {
        duration: 3000,
      });
      return;
    }    
    const headers = data[2];
    if (!headers) {
      this._snackBar.open('File Excel không đúng định dạng!', 'Đóng', {
        duration: 3000,
      });
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
      lunchEnd: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Vào 2'.toLocaleLowerCase()
      ),
      timeOut: headers.findIndex(
        (h: string) => h?.toLocaleLowerCase() == 'Ra 2'.toLocaleLowerCase()
      ),
    };

    const requiredColumns = [
      'employeeCode',
      'employeeName',
      'departmentName',
      'date',
    ];
    const missingColumns = requiredColumns.filter(
      (col) => indexMap[col] === -1
    );
    if (missingColumns.length > 0) {
      this._snackBar.open(
        `Thiếu các cột bắt buộc: ${missingColumns.join(', ')}`,
        'Đóng',
        { duration: 3000 }
      );
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

    const attendanceList = data
      .slice(3)
      .filter((row) => {
        // Skip if row is empty or has no employee code
        if (!row || !row.length || !row[indexMap['employeeCode']]) return false;
        // Skip if date column value is "TỔNG"
        if (row[indexMap['date']]?.toString().trim().toUpperCase() === 'TỔNG')
          return false;
        return true;
      })
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
      this._snackBar.open('Không có dữ liệu hợp lệ để import', 'Đóng', {
        duration: 3000,
      });
      return;
    }

    this._snackBar.open('Đang xử lý dữ liệu...', 'Đóng', { duration: 2000 });

    (window as any).electronAPI
      .importAttendance(attendanceList)
      .then(() => {
        this.loadAttendance();
        this.loadDepartments();
        this.loadPositions();
        this._snackBar.open(
          `Import thành công ${attendanceList.length} bản ghi`,
          'Đóng',
          {
            duration: 3000,
          }
        );
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

  deleteMultiAttendance() {
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      this._snackBar.open(
        'Vui lòng chọn ít nhất một nhân viên để xóa.',
        'Đóng',
        {
          duration: 3000,
        }
      );
      return;
    }

    if (
      confirm(
        `Bạn có chắc chắn muốn xóa ${selectedRows.length} bản ghi đã chọn?`
      )
    ) {
      const BATCH_SIZE = 1000;
      const totalItems = selectedRows.length;
      const totalBatches = Math.ceil(totalItems / BATCH_SIZE);
      let processedBatches = 0;
      let successCount = 0;

      this._snackBar.open(`Đang xóa ${totalItems} bản ghi...`, 'Đóng', {
        duration: 2000,
      });

      const processBatch = async (batchIndex: number) => {
        if (batchIndex >= totalBatches) {
          this.loadAttendance();
          this._snackBar.open(
            `Đã xóa thành công ${successCount} bản ghi`,
            'Đóng',
            {
              duration: 3000,
            }
          );
          return;
        }

        const start = batchIndex * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, totalItems);
        const batchRows = selectedRows.slice(start, end);
        const batchIds = batchRows.map((row) => row.id);

        try {
          await (window as any).electronAPI.deleteAttendancesByIds(batchIds);
          successCount += batchIds.length;
          processedBatches++;

          processBatch(batchIndex + 1);
        } catch (err) {
          console.error('Lỗi khi xóa dữ liệu:', err);
          this._snackBar.open(
            `Đã xóa ${successCount} bản ghi, có lỗi xảy ra`,
            'Đóng',
            {
              duration: 3000,
            }
          );
          this.loadAttendance();
        }
      };

      processBatch(0);
    }
  }

  deleteAll() {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu?')) {
      (window as any).electronAPI
        .deleteAllAttendance()
        .then(() => {
          this.loadAttendance();
          this._snackBar.open('Đã xóa tất cả dữ liệu', 'Đóng', {
            duration: 3000,
          });
        })
        .catch((err: any) => {
          console.error('Lỗi khi xóa dữ liệu:', err);
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

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Chấm công': {} as XLSX.WorkSheet },
      SheetNames: ['Chấm công'],
    };

    const worksheetData = [[], [title], headers];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet['!merges'] = [
      {
        s: { r: 1, c: 0 },
        e: { r: 1, c: headers.length - 1 },
      },
    ];

    workbook.Sheets['Chấm công'] = worksheet;

    const BATCH_SIZE = 1000;
    const totalItems = this.attendanceData.data.length;

    this._snackBar.open(`Đang xuất ${totalItems} bản ghi...`, 'Đóng', {
      duration: 2000,
    });

    for (let i = 0; i < totalItems; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, totalItems);
      const batchData = this.attendanceData.data
        .slice(i, batchEnd)
        .map((row) => [
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

      XLSX.utils.sheet_add_aoa(worksheet, batchData, { origin: 3 + i });
    }

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const data: Blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    FileSaver.saveAs(data, 'ChamCong.xlsx');
    this._snackBar.open('Xuất dữ liệu thành công', 'Đóng', { duration: 3000 });
  }
}
