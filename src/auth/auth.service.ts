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
import { EditInvestorRepresentationDto } from './dto/edit-investor_representation.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { templateVerificar, templateVerificarAdmin } from '../utils/emailTemplates';

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
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService
  ){}

  async create(createUserDto: CreateUserDto, createInvestorRepresentationDto:CreateInvestorRepresentationDto, createCompany: CreateCompanyDto) {
    try {
      const {...userData}=createUserDto;
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
        department: userData.department,
        province: userData.province,
        district: userData.district,
        terms_conditions: userData.termsAndConditions,
      });
      await this.investorRepository.save(user);
      
      if(userData.userType===eTypeUser['Persona Jurídica']){
        const repData = Array.isArray(createInvestorRepresentationDto) ? createInvestorRepresentationDto : [createInvestorRepresentationDto];
        for (let i=0; i< repData.length; i++){
          console.log(repData[i])
          let investorRepresentation=this.InvestorRepresentationRepository.create({
            names:repData[i].repNames,
            surname:repData[i].repSurname,
            document_type:repData[i].repDocumentType,
            document:repData[i].repDocument,
            email:repData[i].repEmail,
            isPep:repData[i].repIsPep,
            charge:repData[i].repCharge,
            investor:user
          });
          await this.InvestorRepresentationRepository.save(investorRepresentation);
        }

          if(Object.keys(createCompany).length>0){
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
      }
      
      // const url= `${process.env.CONFIRMATION_URL}?token=${tokenVerification}` 
      // await this.mailerService.sendMail({
      //    from:process.env.MAIL_USER,
      //    to:user.email,
      //    subject:'Andean Crown SAF ha creado tu cuenta',
      //    html:templateVerificarAdmin(`${userData.names} ${userData.surname}`,userData.email)
      //  })
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

  async editAccount(token, createUserDto: CreateUserDto,companyDto:CreateCompanyDto){
    try {
      const {...userData}=createUserDto;
      const {...companyData}=companyDto;

      const userToUpdate= await this.investorRepository.findOne({
        where:{user_id:token}
      });

      if(!userToUpdate){
        throw new UnauthorizedException('Invalid credentials');
      }
      
      if(Object.keys(userData).length>0){
        await this.investorRepository.update(userToUpdate.user_id,{
          names:userData.names,
          surname:userData.surname,
          document_type:userData.documentType,
          document:userData.document,
          email:userData.email,
          password:userData.password?hashSync(userData.password,10):userToUpdate.password,
          phone:userData.phone,
          address:userData.address,
        });
      }


      if(userToUpdate.user_type===eTypeUser['Persona Jurídica']){
        await this.companyRepository.update({investor: { user_id: userToUpdate.user_id }}, {
          company_document:companyData.companyDocument,
          type_company_document:companyData.typeCompanyDocument,
          company_name:companyData.companyName,
          annual_income:companyData.annualIncome,
          category:companyData.category,
          operation_type:companyData.operationType
        });
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
        charge:repData.repCharge,
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

  async editInvestorRep(token, editInvestorRepresentationDto:EditInvestorRepresentationDto){
    const {...repData}=editInvestorRepresentationDto;
    const investor= await this.investorRepository.findOne({ where: { user_id: token , user_type:eTypeUser['Persona Jurídica']} });

    if(!investor){
      throw new UnauthorizedException('Invalid credentials');
    }

    const investorRep= await this.InvestorRepresentationRepository.findOne({ where: { investor: investor, representation_id:repData.representation_id } });

    if(!investorRep){
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.InvestorRepresentationRepository.update(investorRep.representation_id,{
      names:repData.repNames,
      surname:repData.repSurname,
      document_type:repData.repDocumentType,
      document:repData.repDocument,
      email:repData.repEmail,
      charge: repData.repCharge,
      isPep:repData.repIsPep,
    });

    return {
      message:'Rep updated successfully'
    }
  }

  async deleteInvestorRep(token, representation_id){
    const investor= await this.investorRepository.findOne({ where: { user_id: token , user_type:eTypeUser['Persona Jurídica']} });

    if(!investor){
      throw new UnauthorizedException('Invalid credentials');
    }

    const investorRep= await this.InvestorRepresentationRepository.findOne({ where: { representation_id: representation_id, investor:investor } });

    if(!investorRep){
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.InvestorRepresentationRepository.delete(investorRep.representation_id);

    return {
      message:'Rep deleted successfully'
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
