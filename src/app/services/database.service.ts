import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor() {}

  async getEmployees() {
    return await (window as any).electronAPI.getEmployees();
  }
}
