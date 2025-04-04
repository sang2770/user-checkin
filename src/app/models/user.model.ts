import { IModel } from "./common.model";

export interface IPosition extends IModel {

}
export interface IDepartment extends IModel {

}

export interface IEmployee extends IModel {
    departmentId?: number;
    department?: IDepartment;

    positionId?: number;
    position?: IPosition;
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
