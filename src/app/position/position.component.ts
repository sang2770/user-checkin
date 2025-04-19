import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DepartmentActionComponent } from '../department-action/department-action.component';
import { IEmployee, IPosition } from '../models/user.model';
import { PositionActionComponent } from '../position-action/position-action.component';

@Component({
  selector: 'app-position',
  templateUrl: './position.component.html',
  styleUrl: './position.component.css'
})
export class PositionComponent implements OnInit {
  displayedColumns: string[] = ['stt', 'code', 'name', 'actions'];
  dataSource = new MatTableDataSource<IPosition>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  constructor(private dialog: MatDialog) { }

  async ngOnInit() {
    await this.loadPositions();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadPositions() {
    this.dataSource.data = await (window as any).electronAPI.getPositions();
  }

  openDialog(data?: any) {
    const dialogRef = this.dialog.open(PositionActionComponent, {
      width: '400px',
      data: data || { code: '', name: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadPositions();
    });
  }

  delete(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      (window as any).electronAPI.deletePosition(id).then(() => this.loadPositions());
    }
  }
}
