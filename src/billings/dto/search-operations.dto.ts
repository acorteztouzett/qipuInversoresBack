import { IsNumber, IsOptional, IsString } from "class-validator";


export class SearchOperationsDto {
    
    @IsOptional()
    @IsString()
    registerDate: string;

    @IsOptional()
    @IsString()
    status:string;

    @IsOptional()
    @IsNumber()
    page: number;

    @IsOptional()
    @IsNumber()
    limit: number;

    @IsOptional()
    @IsString()
    clientName: string;

    @IsOptional()
    @IsString()
    payerName: string;
}