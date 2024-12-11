import { IsNumber, IsOptional, IsString } from "class-validator";


export class SearchTransactionDto {
    
    @IsOptional()
    @IsString()
    transactionType: string;

    @IsOptional()
    @IsString()
    operationDate: string;

    @IsOptional()
    @IsString()
    currency: string;

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
}