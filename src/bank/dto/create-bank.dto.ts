import { IsEnum, IsString } from "class-validator";
import { Currency } from '../../utils/enums/general-types.enums';

export class CreateBankDto {
    @IsString()
    holder: string;

    @IsString()
    typeAccount: string;

    @IsString()
    bankName: string;

    @IsString()
    accountNumber: string;

    @IsEnum(Currency)
    currency: Currency;

    @IsString()
    cci: string;

    @IsString()
    status: string;
}
