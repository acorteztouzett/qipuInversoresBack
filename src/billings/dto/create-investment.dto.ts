import { Transform } from "class-transformer";
import { IsNumber, IsString } from "class-validator";

export class CreateInvestmentDto{
    
    @IsNumber()
    monthlyRate: number;

    @IsString()
    auctionCloseDate: string;

}