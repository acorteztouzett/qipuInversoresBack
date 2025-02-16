import { IsEnum, IsNumber, IsString } from "class-validator";
import { Currency } from '../../utils/enums/general-types.enums';


export class CreateInvestDto {
    @IsNumber()
    investAmount: number;

    @IsEnum(Currency)
    currency: Currency;

    @IsString()
    estimatedProfit: string;
}