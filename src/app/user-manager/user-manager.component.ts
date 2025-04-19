import { Component, OnInit, ViewChild } from '@angular/core';
import { UserManagerActionComponent } from '../user-manager-action/user-manager-action.component';
import { IDepartment, IEmployee, IPosition } from '../models/user.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-user-manager',
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.css'
})
export class UserManagerComponent implements OnInit {
  displayedColumns: string[] = ['stt', 'code', 'name', 'department', 'position', 'actions'];
  dataSource = new MatTableDataSource<IEmployee>([]);
  departmentList: IDepartment[] = [];
  positionList: IPosition[] = [];
  filter: {
    keyword?: string;
    departmentId?: number;
    positionId?: number;
  } = {};

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private dialog: MatDialog) { }

  async ngOnInit() {
    await this.loadDepartments();
    await this.loadPositions();
    this.loadEmployees();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadEmployees() {
    (window as any).electronAPI.getEmployees(this.filter).then((employees: IEmployee[]) => {
      employees.forEach((employee: IEmployee) => {
        employee.department = this.departmentList.find(department => department.id === employee.departmentId);
        employee.position = this.positionList.find(position => position.id === employee.positionId);
      })

      this.dataSource.data = employees;
    });
  }

  async loadDepartments() {
    this.departmentList = await (window as any).electronAPI.getDepartments();
  }

  async loadPositions() {
    this.positionList = await (window as any).electronAPI.getPositions();
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
