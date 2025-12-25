import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IngredientsComponent } from './ingredients/ingredients.component';
import { ProductsComponent } from './products/products.component';
import { RecipesComponent } from './recipes/recipes.component';
import { ImportSalesComponent } from './import-sales/import-sales.component';
import { ReportsComponent } from './reports/reports.component';
import { StockEntriesComponent } from './stock-entries/stock-entries.component';

const routes: Routes = [
  {
    path: '',
    component: ReportsComponent
  },
  {
    path: 'reports',
    component: ReportsComponent
  },
  {
    path: 'ingredients',
    component: IngredientsComponent
  },
  {
    path: 'products',
    component: ProductsComponent
  },
  {
    path: 'recipes',
    component: RecipesComponent
  },
  {
    path: 'import-sales',
    component: ImportSalesComponent
  },
  {
    path: 'stock-entries',
    component: StockEntriesComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
