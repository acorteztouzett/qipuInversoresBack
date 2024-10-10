import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Req, Res, UnauthorizedException } from '@nestjs/common';
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
import { Request, Response } from 'express';
import { User } from './entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>,
    @InjectRepository(InvestorRepresentation)
    private readonly InvestorRepresentationRepository: Repository<InvestorRepresentation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService
  ){}

  async create(createUserDto: CreateUserDto, createInvestorRepresentationDto:CreateInvestorRepresentationDto, createCompany: CreateCompanyDto) {
    try {
      const {...userData}=createUserDto;
      const {...repData}=createInvestorRepresentationDto;
      //  const tokenVerification=customAlphabet(this.alphabet,10)();
      const user=this.investorRepository.create({
        country: userData.country,
        names: userData.names,
        surname: userData.surname,
        document_type: userData.documentType,
        document: userData.document,
        email: userData.email,
        phone: userData.phone,
        password: hashSync(userData.password, 10),
        user_type: userData.userType,
        interest_type: userData.interestType,
        pep: userData.isPep,
        address: userData.address,
      });
      await this.investorRepository.save(user);

      if(userData.userType===eTypeUser['Persona Jurídica']){
         const investorRepresentation=this.InvestorRepresentationRepository.create({
           names:repData.repNames,
           surname:repData.repSurname,
           document_type:repData.repDocumentType,
           document:repData.repDocument,
           email:repData.repEmail,
           isPep:repData.repIsPep,
           investor:user
         });
          await this.InvestorRepresentationRepository.save(investorRepresentation);

          const company=this.companyRepository.create({
            company_name:createCompany.companyName,
            type_company_document:createCompany.typeCompanyDocument,
            company_document:createCompany.companyDocument,
            annual_income:createCompany.annualIncome,
            category:createCompany.category,
            operation_type:createCompany.operationType,
            investor:user
          });
          await this.companyRepository.save(company);
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
        token:user.user_id
      };
      
    } catch (error) {
      console.log(error)
      this.handleErrors(error,'create')
    }
  }

  async login(loginUserDto: LoginUserDto){
    try {
      const{password,email,country}=loginUserDto;

      const user= await this.investorRepository.findOne({
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

      const response= await this.investorRepository.findOne({
        where:{email},
      });

      return {
        status:user.status,token:user.user_id,
      };

    } catch (error) {
      this.handleErrors(error,'login');
    }
  }

  async getAccount(token){
    try {

       const userData= await this.investorRepository.findOne({
         where:{user_id:token},
         relations:['investorRepresentation','company']
       });

       if(!userData){
         throw new UnauthorizedException('Invalid credentials');
       }

       return userData;
    } catch (error) {
      console.log(error)
      this.handleErrors(error,'getAccount')
    }
  }

  async editAccount(user:Investor, createUserDto: CreateUserDto, createInvestorRepresentationDto:CreateInvestorRepresentationDto){
    try {
      const {...userData}=createUserDto;
      const {...repData}=createInvestorRepresentationDto;

      const userToUpdate= await this.investorRepository.findOne({
        where:{user_id:user.user_id}
      });

      if(!userToUpdate){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.investorRepository.update(userToUpdate.user_id,{
        names:userData.names,
        surname:userData.surname,
        document_type:userData.documentType,
        document:userData.document,
        email:userData.email,
        phone:userData.phone,
        address:userData.address,
      });

      if(userData.userType===eTypeUser['Persona Jurídica']){
        const investorRepresentation=this.InvestorRepresentationRepository.create({
          names:repData.repNames,
          surname:repData.repSurname,
          document_type:repData.repDocumentType,
          document:repData.repDocument,
          email:repData.repEmail,
          isPep:repData.repIsPep,
          investor:userToUpdate
        });
         await this.InvestorRepresentationRepository.save(investorRepresentation);
      }

      return {
        message:'User updated successfully'
      }

    } catch (error) {
      console.log(error)
      this.handleErrors(error,'editAccount')
    }
  }

  async addInvestorRep(token, createInvestorRepresentationDto:CreateInvestorRepresentationDto){
    try {
      const {...repData}=createInvestorRepresentationDto;

      const investor= await this.investorRepository.findOne({ where: { user_id: token , user_type:eTypeUser['Persona Jurídica']} });

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const investorRepresentation=this.InvestorRepresentationRepository.create({
        names:repData.repNames,
        surname:repData.repNames,
        document_type:repData.repDocumentType,
        document:repData.repDocument,
        email:repData.repEmail,
        isPep:repData.repIsPep,
        investor:investor
      });
       await this.InvestorRepresentationRepository.save(investorRepresentation);

      return {
        message:'Rep created successfully'
      }
    } catch (error) {
      this.handleErrors(error,'addInvestorRep')
    }
  }

  async checkRuc(@Req() req: Request,@Res() res: Response){
    const ruc = req.body.ruc;
    
    const existeUser = await this.userRepository.findOne({ where: { ruc } });

    if (existeUser) {
      return res.status(401).json({ validate: false, msg: `El RUC ${ruc} ya existe` });
    } else {
      return res.status(200).json({ validate: true });
    }
  }

  async checkEmail(@Req() req: Request,@Res() res: Response){
    const email = req.body.email;

    const existeUser = await this.userRepository.findOne({ where: { email } });

    if (existeUser) {
      return res.status(401).json({ validate: false, msg: `El email ${email} ya existe` });
    } else {
      return res.status(200).json({ validate: true });
    }
  }

  async resetToken(@Req() req: Request,@Res() res: Response){
    const { token } = req.body;

    const user = await this.userRepository.findOne({ where: { resetpass: token } });

    if (!user) {
      throw new HttpException({ msg: 'Token inválido' }, HttpStatus.BAD_REQUEST);
    }

    if(new Date(user.reset_token)<new Date()){
      return res.status(400).json({msg:'expired token'})
    }

    return res.json({ validate: true });
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
