import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UserManagerComponent } from './user-manager/user-manager.component';
import { UserManagerActionComponent } from './user-manager-action/user-manager-action.component';
import { UserCheckinComponent } from './user-checkin/user-checkin.component';
import { UserCheckinActionComponent } from './user-checkin-action/user-checkin-action.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter, provideNativeDateAdapter } from '@angular/material/core';

import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { DepartmentComponent } from './department/department.component';
import { DepartmentActionComponent } from './department-action/department-action.component';
import { MatSelectModule } from '@angular/material/select';
import { PositionComponent } from './position/position.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PositionActionComponent } from './position-action/position-action.component';
import { Platform } from '@angular/cdk/platform';

export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: any): string {
    const days = date.getDate();
    const months = date.getMonth() + 1;
    const year = date.getFullYear();
    return days + '/' + months + '/' + year;
  }
}

@NgModule({
  declarations: [AppComponent, UserManagerComponent, UserManagerActionComponent, UserCheckinComponent, UserCheckinActionComponent, DepartmentComponent, DepartmentActionComponent,
    PositionComponent, PositionActionComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter(),
  {
    provide: DateAdapter,
    useClass: CustomDateAdapter,
    deps: [MAT_DATE_LOCALE, Platform]
  },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
