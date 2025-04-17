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


export interface IDevice extends IModel {
    serial_number?: string;
    area?: string;
    ip_address?: string;
    status?: string;
    last_active?: string; // ISO date string, ví dụ: '2025-04-06'
    user?: string;
    fingerprint?: string;
    face?: string;
    palm?: string;
    event?: string;
    command?: string;
}