import { IsString } from "class-validator";


export class CreateInvestorRepresentationDto{
    @IsString()
    representationNames: string;

    @IsString()
    representationSurname: string;

    @IsString()
    representationDocumentType: string;

    @IsString()
    representationDocument: number;

    @IsString()
    representationEmail: string;

    @IsString()
    representationIsPep: boolean;

}