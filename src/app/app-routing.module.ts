import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
console.log('Routing module loaded');

const routes: Routes = [
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
