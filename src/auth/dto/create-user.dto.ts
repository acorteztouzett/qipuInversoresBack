import { IsBoolean, IsEmail, IsEnum, IsJSON, IsObject, IsOptional, isString, IsString } from "class-validator";
import { eTypeInterest, eTypeUser } from "../interfaces/userInterfaces";
import { CreateInvestorRepresentationDto } from "./create-investor_representation.dto";
import { CreateCompanyDto } from "./create-company.dto";

export class CreateUserDto {

    @IsString()
    country: string;

    @IsString()
    names: string;

    @IsString()
    surname: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsString()
    password: string;

    @IsEnum(eTypeUser)
    userType: eTypeUser;

    @IsEnum(eTypeInterest)
    interestType: eTypeInterest

    @IsString()
    documentType: string;

    @IsString()
    document: number;

    @IsBoolean()
    isPep: boolean;

    @IsString()
    address: string;

    @IsString()
    @IsOptional()
    typeCompanyDocument: string;

    @IsString()
    @IsOptional()
    companyDocument: number;

    @IsString()
    @IsOptional()
    companyName: string;

    @IsString()
    @IsOptional()
    category: string;

    @IsString()
    @IsOptional()
    operationType: string;

    @IsString()
    @IsOptional()
    annualIncome: string; 
}

export class RegisterDto{
    @IsObject()
    investor: CreateUserDto;

    @IsObject()
    @IsOptional()
    investorRep: CreateInvestorRepresentationDto;

    @IsObject()
    @IsOptional()
    company: CreateCompanyDto;
}
