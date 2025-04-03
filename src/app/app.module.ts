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
@NgModule({
  declarations: [AppComponent, UserManagerComponent, UserManagerActionComponent, UserCheckinComponent, UserCheckinActionComponent],
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
    MatButtonModule
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
