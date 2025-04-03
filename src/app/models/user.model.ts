import { IModel } from "./common.model";

export interface IDepartment extends IModel {

}

export interface IEmployee extends IModel {
    departmentId?: number;
    department?: IDepartment;
}


export interface IAttendance extends IModel {
    employeeId?: number;
    employee?: IEmployee;
    date?: Date;
    timeIn?: Date;
    timeOut?: Date;
    totalHours?: number;

    lunchStart?: Date;
    lunchEnd?: Date;
    lunchHours?: number;

    note?: string;
}
