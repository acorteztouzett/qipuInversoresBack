import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";


export class EditOperationDto {
    
    @IsOptional()
    @IsString()
    clientName: string;

    @IsOptional()
    @IsString()
    payerName: string;

    @IsOptional()
    @IsString()
    operationNumber: string;

    @IsOptional()
    @IsString()
    status: string;

    @IsOptional()
    @IsBoolean()
    availableToInvest: boolean;

    @IsOptional()
    @IsString()
    auctionCloseDate: string;

    @IsOptional()
    @IsNumber()
    monthlyRate: number;
}