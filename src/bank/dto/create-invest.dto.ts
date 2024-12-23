import { IsNumber } from "class-validator";


export class CreateInvestDto {
    @IsNumber()
    investAmount: number;

}