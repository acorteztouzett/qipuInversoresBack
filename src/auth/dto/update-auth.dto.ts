import { CreateCompanyDto } from './create-company.dto';
import { CreateInvestorRepresentationDto } from './create-investor_representation.dto';
import { CreateUserDto, RegisterDto } from './create-user.dto';
import { IsArray, IsObject, IsOptional } from 'class-validator';

export class UpdateAuthDto {
    @IsObject()
    @IsOptional()
    investor: CreateUserDto;

    @IsArray()
    @IsOptional()
    investorRep: CreateInvestorRepresentationDto;

    @IsObject()
    @IsOptional()
    company: CreateCompanyDto;
}
