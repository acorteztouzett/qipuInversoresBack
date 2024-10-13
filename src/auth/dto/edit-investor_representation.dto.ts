import { PartialType } from "@nestjs/swagger";
import { CreateInvestorRepresentationDto } from "./create-investor_representation.dto";
import { IsOptional, IsString } from "class-validator";


export class EditInvestorRepresentationDto extends PartialType(CreateInvestorRepresentationDto) {

    @IsString()
    representation_id: string;
}