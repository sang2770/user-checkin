import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';
import { IStockEntry, IIngredient } from '../models/inventory.model';
import { StockEntryDialogComponent } from './stock-entry-dialog.component';

@Component({
  selector: 'app-stock-entries',
  templateUrl: './stock-entries.component.html',
  styleUrls: ['./stock-entries.component.css']
})
export class StockEntriesComponent implements OnInit {
  stockEntries: IStockEntry[] = [];
  displayedColumns: string[] = ['date', 'ingredientName', 'quantity', 'unitPrice', 'totalCost', 'supplier'];
  loading = false;

  constructor(
    private databaseService: DatabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadStockEntries();
  }

  async loadStockEntries() {
    this.loading = true;
    try {
      this.stockEntries = await this.databaseService.getStockEntries();
    } catch (error) {
      this.snackBar.open('Lỗi khi tải danh sách nhập kho', 'Đóng', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(StockEntryDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createStockEntry(result);
      }
    });
  }

  async createStockEntry(stockEntry: Omit<IStockEntry, 'id'>) {
    try {
      await this.databaseService.createStockEntry(stockEntry);
      this.snackBar.open('Nhập kho thành công', 'Đóng', { duration: 3000 });
      this.loadStockEntries();
    } catch (error) {
      this.snackBar.open('Lỗi khi nhập kho', 'Đóng', { duration: 3000 });
    }
  }
}
