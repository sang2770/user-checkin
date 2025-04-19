import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { IDevice } from '../models/user.model';
import { DevicesActionComponent } from '../devices-action/devices-action.component';

@Component({
  selector: 'app-devices-manager',
  templateUrl: './devices-manager.component.html',
  styleUrl: './devices-manager.component.css'
})
export class DevicesManagerComponent implements OnInit {
  displayedColumns: string[] = [
    'stt', 'name', 'serial_number', 'area', 'ip_address', 'status',
    'last_active', 'user', 'fingerprint', 'face', 'palm', 'event', 'command', 'actions'
  ];
  dataSource = new MatTableDataSource<IDevice>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  constructor(private dialog: MatDialog) { }

  async ngOnInit() {
    await this.loadDevices();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadDevices() {
    this.dataSource.data = await (window as any).electronAPI.getDevices();
    console.log(this.dataSource.data);

  }

  openDialog(device?: IDevice) {
    const dialogRef = this.dialog.open(DevicesActionComponent, {
      width: '500px',
      data: device || {
        name: '',
        serial_number: '',
        area: '',
        ip_address: '',
        status: '',
        last_active: new Date().toISOString().substring(0, 10),
        user: '',
        fingerprint: '',
        face: '',
        palm: '',
        event: '',
        command: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadDevices();
    });
  }

  delete(id: number) {
    if (confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) {
      (window as any).electronAPI.deleteDevice(id).then(() => this.loadDevices());
    }
  }
}
