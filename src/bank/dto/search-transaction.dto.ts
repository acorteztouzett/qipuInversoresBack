import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Currency } from '../../utils/enums/general-types.enums';


export class SearchTransactionDto {
    
    @IsOptional()
    @IsString()
    transactionType: string;

    @IsOptional()
    @IsString()
    operationDate: string;

    @IsOptional()
    @IsEnum(Currency)
    currency: Currency;

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