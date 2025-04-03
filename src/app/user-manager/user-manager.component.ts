import { Component, OnInit } from '@angular/core';
import { UserManagerActionComponent } from '../user-manager-action/user-manager-action.component';
import { IEmployee } from '../models/user.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-manager',
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.css'
})
export class UserManagerComponent implements OnInit {
  displayedColumns: string[] = ['code', 'name', 'department', 'actions'];
  dataSource = new MatTableDataSource<IEmployee>([]);

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    (window as any).electronAPI.getEmployees().then((employees: IEmployee[]) => {
      this.dataSource.data = employees;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openDialog(employee?: IEmployee) {
    const dialogRef = this.dialog.open(UserManagerActionComponent, {
      width: '400px',
      data: employee || { code: '', name: '', department: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadEmployees();
    });
  }

  deleteEmployee(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      (window as any).electronAPI.deleteEmployee(id).then(() => this.loadEmployees());
    }
  }
}
