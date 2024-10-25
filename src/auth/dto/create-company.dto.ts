import { IsObject, IsString } from "class-validator";

export class CreateCompanyDto{

    @IsString()
    companyName: string;

    @IsString()
    typeCompanyDocument: string;

    @IsString()
    companyDocument: number;

    @IsString()
    annualIncome: string;

    @IsObject()
    category: object;

    @IsString()
    operationType: string;
}