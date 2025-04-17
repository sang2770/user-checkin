import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagerComponent } from './user-manager/user-manager.component';
import { UserCheckinComponent } from './user-checkin/user-checkin.component';
import { DepartmentComponent } from './department/department.component';
import { PositionComponent } from './position/position.component';
import { DevicesManagerComponent } from './devices-manager/devices-manager.component';

const routes: Routes = [
  {
    path: '',
    component: UserManagerComponent
  },
  {
    path: 'checkin',
    component: UserCheckinComponent
  },
  {
    path: 'department',
    component: DepartmentComponent
  },
  {
    path: 'position',
    component: PositionComponent
  },
  {
    path: 'devices',
    component: DevicesManagerComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
