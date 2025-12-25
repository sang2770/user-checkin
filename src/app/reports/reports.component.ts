import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  dailyReport: any = {};
  inventoryReport: any[] = [];
  dailyOrders: any[] = [];
  profitLossReport: any = {};
  monthlyProfitLossReport: any = {};
  loading = false;
  loadingOrders = false;
  loadingProfitLoss = false;
  loadingMonthly = false;
  loadingBackup = false;
  loadingRestore = false;
  loadingExport = false;
  loadingImport = false;

  // Table columns for orders
  orderColumns: string[] = [
    'id',
    'name',
    'employeeName',
    'totalAmount',
    'date',
    'note',
  ];

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadDailyReport();
    this.loadInventoryReport();
    this.loadDailyOrders();
    this.loadProfitLossReport();
    this.loadMonthlyProfitLoss();
  }

  async loadDailyReport() {
    this.loading = true;
    try {
      this.dailyReport = await this.databaseService.getDailyReport(
        this.selectedDate
      );
    } catch (error) {
      console.error('Error loading daily report:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadInventoryReport() {
    this.loading = true;
    try {
      this.inventoryReport = await this.databaseService.getInventoryReport();
    } catch (error) {
      console.error('Error loading inventory report:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadDailyOrders() {
    this.loadingOrders = true;
    try {
      this.dailyOrders = await this.databaseService.getOrdersByDate(
        this.selectedDate
      );
    } catch (error) {
      console.error('Error loading daily orders:', error);
    } finally {
      this.loadingOrders = false;
    }
  }

  async loadProfitLossReport() {
    this.loadingProfitLoss = true;
    try {
      this.profitLossReport = await this.databaseService.getProfitLossReport(
        this.selectedDate
      );
    } catch (error) {
      console.error('Error loading profit/loss report:', error);
    } finally {
      this.loadingProfitLoss = false;
    }
  }

  async loadMonthlyProfitLoss() {
    this.loadingMonthly = true;
    try {
      this.monthlyProfitLossReport =
        await this.databaseService.getMonthlyProfitLossReport(
          this.selectedYear,
          this.selectedMonth
        );
    } catch (error) {
      console.error('Error loading monthly profit/loss report:', error);
    } finally {
      this.loadingMonthly = false;
    }
  }

  onDateChange() {
    // Load all daily data when date changes
    this.loadDailyReport();
    this.loadDailyOrders();
    this.loadProfitLossReport();
  }

  onMonthChange() {
    this.loadMonthlyProfitLoss();
  }

  onMonthInputChange() {
    this.loadMonthlyProfitLoss();
  }

  onYearInputChange() {
    this.loadMonthlyProfitLoss();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);
  }

  // Backup & Restore methods
  async backupDatabase() {
    this.loadingBackup = true;
    try {
      const result = await this.databaseService.backupDatabase();
      alert(`Sao lưu thành công!\nFile: ${result}`);
    } catch (error: any) {
      console.error('Backup error:', error);
      if (error.message !== 'Người dùng đã hủy backup') {
        alert('Lỗi khi sao lưu database!');
      }
    } finally {
      this.loadingBackup = false;
    }
  }

  async restoreDatabase() {
    if (
      !confirm(
        'CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại!\nBạn có chắc chắn muốn tiếp tục?'
      )
    ) {
      return;
    }

    this.loadingRestore = true;
    try {
      const result = await this.databaseService.restoreDatabase();
      alert('Khôi phục thành công! Vui lòng khởi động lại ứng dụng.');
    } catch (error: any) {
      console.error('Restore error:', error);
      if (error.message !== 'Người dùng đã hủy restore') {
        alert('Lỗi khi khôi phục database!');
      }
    } finally {
      this.loadingRestore = false;
    }
  }

  async exportToJson() {
    this.loadingExport = true;
    try {
      const result = await this.databaseService.exportDatabaseToJson();
      alert(`Xuất JSON thành công!\nFile: ${result}`);
    } catch (error: any) {
      console.error('Export error:', error);
      if (error.message !== 'Người dùng đã hủy export') {
        alert('Lỗi khi xuất JSON!');
      }
    } finally {
      this.loadingExport = false;
    }
  }

  async importFromJson() {
    if (
      !confirm(
        'CẢNH BÁO: Thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại!\nBạn có chắc chắn muốn tiếp tục?'
      )
    ) {
      return;
    }

    this.loadingImport = true;
    try {
      const result = await this.databaseService.importDatabaseFromJson();
      alert('Import thành công! Vui lòng tải lại trang.');
      // Reload all data
      this.loadDailyReport();
      this.loadInventoryReport();
      this.loadDailyOrders();
      this.loadProfitLossReport();
      this.loadMonthlyProfitLoss();
    } catch (error: any) {
      console.error('Import error:', error);
      if (error.message !== 'Người dùng đã hủy import') {
        alert('Lỗi khi import JSON! Vui lòng kiểm tra định dạng file.');
      }
    } finally {
      this.loadingImport = false;
    }
  }

  onJsonFileSelected(event: any) {
    // This method is no longer needed but kept for backwards compatibility
    event.target.value = '';
  }
}
