import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { IEmployee, IDepartment } from '../models/user.model';
import { DepartmentActionComponent } from '../department-action/department-action.component';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrl: './department.component.css'
})
export class DepartmentComponent implements OnInit {
  displayedColumns: string[] = ['stt', 'code', 'name', 'actions'];
  dataSource = new MatTableDataSource<IDepartment>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  constructor(private dialog: MatDialog) { }

  async ngOnInit() {
    await this.loadDepartments();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadDepartments() {
    this.dataSource.data = await (window as any).electronAPI.getDepartments();
  }

  openDialog(employee?: IEmployee) {
    const dialogRef = this.dialog.open(DepartmentActionComponent, {
      width: '400px',
      data: employee || { code: '', name: '', department: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDepartments();
    });
  }

  delete(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      (window as any).electronAPI.deleteDepartment(id).then(() => this.loadDepartments());
    }
  }
}
