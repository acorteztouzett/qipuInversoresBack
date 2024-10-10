import { IsBoolean, IsString } from "class-validator";


export class CreateInvestorRepresentationDto{
    @IsString()
    repNames: string;

    @IsString()
    repSurname: string;

    @IsString()
    repDocumentType: string;

    @IsString()
    repDocument: number;

    @IsString()
    repEmail: string;

    @IsBoolean()
    repIsPep: boolean;

}