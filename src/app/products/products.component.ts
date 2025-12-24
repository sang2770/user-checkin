import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../services/database.service';
import { IProduct } from '../models/inventory.model';
import { ProductDialogComponent } from './product-dialog.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: IProduct[] = [];
  displayedColumns: string[] = ['name', 'code', 'price', 'category', 'isActive', 'actions'];
  loading = false;

  constructor(
    private databaseService: DatabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    try {
      this.products = await this.databaseService.getProducts();
    } catch (error) {
      this.snackBar.open('Lỗi khi tải danh sách sản phẩm', 'Đóng', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }

  openDialog(product?: IProduct) {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '500px',
      data: product ? { ...product } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.id) {
          this.updateProduct(result.id, result);
        } else {
          this.createProduct(result);
        }
      }
    });
  }

  async createProduct(product: Omit<IProduct, 'id'>) {
    try {
      await this.databaseService.createProduct(product);
      this.snackBar.open('Thêm sản phẩm thành công', 'Đóng', { duration: 3000 });
      this.loadProducts();
    } catch (error) {
      this.snackBar.open('Lỗi khi thêm sản phẩm', 'Đóng', { duration: 3000 });
    }
  }

  async updateProduct(id: number, product: Partial<IProduct>) {
    try {
      await this.databaseService.updateProduct(id, product);
      this.snackBar.open('Cập nhật sản phẩm thành công', 'Đóng', { duration: 3000 });
      this.loadProducts();
    } catch (error) {
      this.snackBar.open('Lỗi khi cập nhật sản phẩm', 'Đóng', { duration: 3000 });
    }
  }

  async deleteProduct(product: IProduct) {
    if (confirm(`Bạn có chắc chắn muốn xóa "${product.name}"?`)) {
      try {
        await this.databaseService.deleteProduct(product.id!);
        this.snackBar.open('Xóa sản phẩm thành công', 'Đóng', { duration: 3000 });
        this.loadProducts();
      } catch (error) {
        this.snackBar.open('Lỗi khi xóa sản phẩm', 'Đóng', { duration: 3000 });
      }
    }
  }

}
