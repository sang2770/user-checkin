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
import { MatMenuModule } from '@angular/material/menu';
import { DateAdapter, MAT_DATE_LOCALE, NativeDateAdapter, provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Platform } from '@angular/cdk/platform';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// Inventory Management Components
import { IngredientsComponent } from './ingredients/ingredients.component';
import { IngredientDialogComponent } from './ingredients/ingredient-dialog.component';
import { ProductsComponent } from './products/products.component';
import { ProductDialogComponent } from './products/product-dialog.component';
import { RecipesComponent } from './recipes/recipes.component';
import { RecipeDialogComponent } from './recipes/recipe-dialog.component';
import { ImportSalesComponent } from './import-sales/import-sales.component';
import { ReportsComponent } from './reports/reports.component';
import { StockEntriesComponent } from './stock-entries/stock-entries.component';
import { StockEntryDialogComponent } from './stock-entries/stock-entry-dialog.component';

export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: any): string {
    const days = date.getDate();
    const months = date.getMonth() + 1;
    const year = date.getFullYear();
    return days + '/' + months + '/' + year;
  }
}
@NgModule({
  declarations: [
    AppComponent, 
    IngredientsComponent,
    IngredientDialogComponent,
    ProductsComponent,
    ProductDialogComponent,
    RecipesComponent,
    RecipeDialogComponent,
    ImportSalesComponent,
    ReportsComponent,
    StockEntriesComponent,
    StockEntryDialogComponent
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
    MatDatepickerModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule
  ],
  providers: [provideNativeDateAdapter(),
  {
    provide: DateAdapter,
    useClass: CustomDateAdapter,
    deps: [MAT_DATE_LOCALE, Platform]
  }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
