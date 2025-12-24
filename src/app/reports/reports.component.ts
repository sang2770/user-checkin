import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: Date = new Date();
  dailyReport: any = {};
  inventoryReport: any[] = [];
  dailyOrders: any[] = [];
  profitLossReport: any = {};
  monthlyProfitLossReport: any = {};
  loading = false;
  loadingOrders = false;
  loadingProfitLoss = false;
  loadingMonthly = false;

  // Table columns for orders
  orderColumns: string[] = ['id', 'name', 'employeeName', 'totalAmount', 'date', 'note'];

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

  async loadDailyOrders() {    
    this.loadingOrders = true;
    try {
      this.dailyOrders = await this.databaseService.getOrdersByDate(this.selectedDate);
    } catch (error) {
      console.error('Error loading daily orders:', error);
    } finally {
      this.loadingOrders = false;
    }
  }

  async loadProfitLossReport() {
    this.loadingProfitLoss = true;
    try {
      this.profitLossReport = await this.databaseService.getProfitLossReport(this.selectedDate);
    } catch (error) {
      console.error('Error loading profit/loss report:', error);
    } finally {
      this.loadingProfitLoss = false;
    }
  }

  async loadMonthlyProfitLoss() {
    this.loadingMonthly = true;
    try {
      const year = this.selectedMonth.getFullYear();
      const month = this.selectedMonth.getMonth() + 1;
      this.monthlyProfitLossReport = await this.databaseService.getMonthlyProfitLossReport(year, month);
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  }
}
