import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserManagerComponent } from './user-manager/user-manager.component';
import { UserCheckinComponent } from './user-checkin/user-checkin.component';
import { DepartmentComponent } from './department/department.component';
import { PositionComponent } from './position/position.component';
console.log('Routing module loaded');

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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
