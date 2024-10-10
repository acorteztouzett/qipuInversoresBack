import { IsString } from "class-validator";

export class CreateCompanyDto{

    @IsString()
    companyName: string;

    @IsString()
    typeCompanyDocument: string;

    @IsString()
    companyDocument: number;

    @IsString()
    annualIncome: string;

    @IsString()
    category: string;

    @IsString()
    operationType: string;
}