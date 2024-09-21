import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Investor } from './entities/investor.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-interface';
import {compareSync, hashSync} from 'bcrypt'
import { eTypeUser } from './interfaces/userInterfaces';
import { InvestorRepresentation } from './entities/investor_representation.entity';
import { CreateInvestorRepresentationDto } from './dto/create-investor_representation.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Investor)
    private readonly userRepository: Repository<Investor>,
    @InjectRepository(InvestorRepresentation)
    private readonly InvestorRepresentationRepository: Repository<InvestorRepresentation>,
    private readonly jwtService: JwtService
  ){}
  async create(createUserDto: CreateUserDto, createInvestorRepresentationDto:CreateInvestorRepresentationDto) {
    try {
      const {...userData}=createUserDto;
      const {...repData}=createInvestorRepresentationDto;
      //  const tokenVerification=customAlphabet(this.alphabet,10)();
       const user=this.userRepository.create({
         country:userData.country,
         names:userData.names,
         surname:userData.surname,
         document_type:userData.documentType,
         document:userData.document,
         email:userData.email,
         phone:userData.phone,
         password: hashSync(userData.password,10),
         user_type:userData.userType,
         interest_type:userData.interestType,
         isPep:userData.isPep,
         address:userData.address,
         type_company_document:userData.typeCompanyDocument,
         company_document:userData.companyDocument,
         company_name:userData.companyName,
         category:userData.category,
         operation_type:userData.operationType,
         annual_income:userData.annualIncome,
       });
       await this.userRepository.save(user);

      if(userData.userType===eTypeUser['Persona Jurídica']){
         const investorRepresentation=this.InvestorRepresentationRepository.create({
           names:repData.representationNames,
           surname:repData.representationSurname,
           document_type:repData.representationDocumentType,
           document:repData.representationDocument,
           email:repData.representationEmail,
           isPep:repData.representationIsPep,
           investor:user
         });
          await this.InvestorRepresentationRepository.save(investorRepresentation);
      }
      
      // const url= `${process.env.CONFIRMATION_URL}?token=${tokenVerification}` 
      // await this.mailerService.sendMail({
      //   from:process.env.MAIL_USER,
      //   to:user.email,
      //   subject:'Andean Crown SAF ha creado tu cuenta',
      //   html:CreateUserMail(userData.names?userData.names:userData.legalRepresentation,url)
      // })
      return {
        message:'User created successfully',
        email:user.email,
        token:this.getJwtToken({user_id:user.user_id})
      };
      
    } catch (error) {
      console.log(error)
      this.handleErrors(error,'create')
    }
  }

  async login(loginUserDto: LoginUserDto){
    try {
      const{password,email,country}=loginUserDto;

      const user= await this.userRepository.findOne({
        where:{
          email,country
        },
        select:{password:true,user_id:true,status:true}
      });
      
      if(!user){
        throw new UnauthorizedException('Invalid credentials');
      }
      if(!compareSync(password,user.password)){
        throw new UnauthorizedException('Invalid credentials');
      }

      if(user.status!==1){
        throw new UnauthorizedException('User is inactive');
      }

      const response= await this.userRepository.findOne({
        where:{email},
        select:{password:false}
      });

      return {
        ...response,
        token:this.getJwtToken({user_id:user.user_id})
      };

    } catch (error) {
      this.handleErrors(error,'login');
    }
  }

  private getJwtToken(payload: JwtPayload){
    const token=this.jwtService.sign(payload);
    return token;
  }

  private handleErrors(error: any,type:string):never{
    if(error.code==='23505'){
      throw new BadRequestException(`USER already exists`)
    }
    if(error.status===401){
      throw new UnauthorizedException(error.message);
    }
    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
