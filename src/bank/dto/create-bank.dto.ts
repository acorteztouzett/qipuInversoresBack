import { IsString } from "class-validator";

export class CreateBankDto {
    @IsString()
    holder: string;

    @IsString()
    typeAccount: string;

    @IsString()
    bankName: string;

    @IsString()
    accountNumber: string;

    @IsString()
    currency: string;

    @IsString()
    cci: string;

    @IsString()
    status: string;
}
