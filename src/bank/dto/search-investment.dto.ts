import { IsNumber, IsOptional, IsString } from "class-validator";

export class SearchInvestmentDto {

    @IsOptional()
    @IsString()
    paymentDate: string;

    @IsOptional()
    @IsString()
    closeDate: string;

    @IsOptional()
    @IsString()
    status:string;

    @IsOptional()
    @IsNumber()
    page: number;

    @IsOptional()
    @IsNumber()
    limit: number;

}