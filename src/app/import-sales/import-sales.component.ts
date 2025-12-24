import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-import-sales',
  templateUrl: './import-sales.component.html',
  styleUrls: ['./import-sales.component.css']
})
export class ImportSalesComponent implements OnInit {
  loading = false;
  selectedFile: File | null = null;
  salesHistory: any[] = [];
  displayedColumns: string[] = ['date', 'productName', 'quantity', 'totalAmount', 'employee'];

  constructor(
    private databaseService: DatabaseService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSalesHistory();
  }

  async loadSalesHistory() {
    this.loading = true;
    try {
      this.salesHistory = await this.databaseService.getSaleOrders();
    } catch (error) {
      this.snackBar.open('Lỗi khi tải lịch sử doanh thu', 'Đóng', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      this.selectedFile = file;
    } else {
      this.snackBar.open('Vui lòng chọn file Excel (.xlsx, .xls)', 'Đóng', { duration: 3000 });
      event.target.value = '';
    }
  }

  clickFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  clearSelectedFile() {
    this.selectedFile = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async importSalesData() {
    if (!this.selectedFile) {
      this.snackBar.open('Vui lòng chọn file để import', 'Đóng', { duration: 3000 });
      return;
    }

    this.loading = true;
    try {
      // Read file content
      const fileContent = await this.readFileAsArrayBuffer(this.selectedFile);
      
      // Process Excel data and create sale orders
      const result = await this.databaseService.importSalesFromExcel(fileContent);
      
      if (result) {
        this.snackBar.open('Import doanh thu thành công! Tồn kho đã được cập nhật.', 'Đóng', { duration: 5000 });
        this.clearSelectedFile();
        await this.loadSalesHistory();
      }
    } catch (error) {
      this.snackBar.open('Lỗi khi import doanh thu', 'Đóng', { duration: 3000 });
      console.error('Import error:', error);
    } finally {
      this.loading = false;
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async clearSalesHistory() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử doanh thu? Hành động này không thể hoàn tác.')) {
      this.loading = true;
      try {
        await this.databaseService.clearSalesHistory();
        this.snackBar.open('Đã xóa lịch sử doanh thu', 'Đóng', { duration: 3000 });
        await this.loadSalesHistory();
      } catch (error) {
        this.snackBar.open('Lỗi khi xóa lịch sử', 'Đóng', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }
  }
}
