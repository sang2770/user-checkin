import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  dailyReport: any = {};
  inventoryReport: any[] = [];
  loading = false;

  constructor(private databaseService: DatabaseService) {}

  ngOnInit() {
    this.loadDailyReport();
    this.loadInventoryReport();
  }

  async loadDailyReport() {
    this.loading = true;
    try {
      this.dailyReport = await this.databaseService.getDailyReport(this.selectedDate);
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

  onDateChange() {
    this.loadDailyReport();
  }
}
