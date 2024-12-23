import { IsNumber, IsString } from "class-validator";

export class CreateInvestmentDto{
    
    @IsNumber()
    monthlyRate: number;

    @IsString()
    auctionCloseDate: string;

}