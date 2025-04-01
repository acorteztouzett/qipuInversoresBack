import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Req, Res, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Investor } from './entities/investor.entity';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
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
import { templateVerificar, templateVerificarAdmin, templateVerificarCuenta } from '../utils/emailTemplates';
import { Wallet } from './entities/wallet.entity';
import { customAlphabet } from 'nanoid';
import { WebConfig } from './entities/webconfig.entity';
import { ConfigTypes } from 'src/utils/enums/configTypes.enums';
import { GeneralStatus } from 'src/utils/enums/general-status.enums';

@Injectable()
export class AuthService {
  private alphabet='1234567890abcdefghijklmnopqrstuvwx';
  constructor(
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>,
    @InjectRepository(InvestorRepresentation)
    private readonly InvestorRepresentationRepository: Repository<InvestorRepresentation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WebConfig)
    private readonly webConfigRepository: Repository<WebConfig>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService
  ){}

  async checkInvestor(email:string){
    try {
      const user= await this.investorRepository.findOne({
        where:{
          email
        }
      });
      if(user){
        throw new UnauthorizedException('User already exists');
      }
      
      return {
        message:'User available'
      }
    } catch (error) {
      this.handleErrors(error,'checkInvestor');
    }
  }

  async create(createUserDto: CreateUserDto, createInvestorRepresentationDto:CreateInvestorRepresentationDto, createCompany: CreateCompanyDto) {
    try {
      const {...userData}=createUserDto;

      await this.checkInvestorCreation(userData.email,userData.document,userData.country);

      const tokenVerification=customAlphabet(this.alphabet,10)();

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
        status: 0,
        token: tokenVerification,
      });
      await this.investorRepository.save(user);
      
      if(userData.userType===eTypeUser['Persona Jurídica']){
        const repData = Array.isArray(createInvestorRepresentationDto) ? createInvestorRepresentationDto : [createInvestorRepresentationDto];
        for (let i=0; i< repData.length; i++){
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

      await this.sendVerificationEmail(tokenVerification, userData.names,userData.surname,userData.email);
    
      return {
        message:'User created successfully',
        email:user.email,
        token:user.user_id
      };
      
    } catch (error) {
      this.handleErrors(error,'create')
    }
  }

  async verifyUser(body:any){
    try {
      const {verifyToken}=body;

      const user=await this.investorRepository.findOne({
        where:{token:verifyToken}
      });

      if(!user){
        throw new UnauthorizedException('Invalid token');
      }
      if(user.token!==verifyToken){
        throw new UnauthorizedException('Invalid token');
      }

      await this.investorRepository.update(user.user_id,{
        token:null,
        status:1
      });

      return {
        message:'User verified successfully',
        email:user.email,
        token:user.user_id
      };
    } catch (error) {
      this.handleErrors(error,'verifyUser');
    }
  }

  async sendVerificationEmail(token:string, names:string,surname:string,email:string){
    try {

      await this.mailerService.sendMail({
        from:process.env.MAIL_USER,
        to:email,
        subject:`Bienvenido a Qipu Finance, tu código de activación es ${token}`,
        cc:'luis.moralesponce@gmail.com',
        html:templateVerificarCuenta(`${names} ${surname}`, token, email),
      })

      return;
      
    } catch (error) {
      this.handleErrors(error,'sendVerificationEmail')
    }
  }

  async checkInvestorCreation(email:string ,document,country:string){
    try {
      const user= await this.investorRepository.findOne({
        where:{
          email,document,country
        }
      });
      if(user){
        throw new UnauthorizedException('User already exists');
      }
      return {
        message:'User available'
      }
    } catch (error) {
      this.handleErrors(error,'checkInvestorCreation');
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

  async getAccount(token:string){
    try {

       const userData= await this.investorRepository.findOne({
         where:{user_id:token},
         relations:['investorRepresentation','company']
       });

       const wallets = await this.walletRepository.find({
        where: { bank_account: { 
          investor: { user_id: token }
        } }
      });

       if(!userData){
         throw new UnauthorizedException('Invalid credentials');
       }

       return {userData,wallets};
    } catch (error) {
      this.handleErrors(error,'getAccount')
    }
  }

  async editAccount(token:string, createUserDto: CreateUserDto,companyDto:CreateCompanyDto){
    try {
      const {password,...userData}=createUserDto;
      
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
          phone:userData.phone,
          address:userData.address,
          charge:userData.charge,
        });
      }
      
      
      if(userToUpdate.user_type===eTypeUser['Persona Jurídica']){
        const {...companyData}=companyDto;
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
      this.handleErrors(error,'editAccount')
    }
  }

  async changePassword(token, password){
    try {
      const user= await this.investorRepository.findOne({ where: { user_id: token } });

      if(!user){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.investorRepository.update(user.user_id,{
        password:hashSync(password,10)
      });

      return {
        message:'Password changed successfully'
      }
    } catch (error) {
      this.handleErrors(error,'changePassword')
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
    try {
      const {...repData}=editInvestorRepresentationDto;
      const investor= await this.investorRepository.findOne({ where: { user_id: token , user_type:eTypeUser['Persona Jurídica']} });

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const investorRep= await this.InvestorRepresentationRepository.findOne({ 
        relations:['investor'],
        where: { investor:{
          user_id:token
        }, representation_id:repData.representation_id }
      });

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
    } catch (error) {
      return this.handleErrors(error,'editInvestorRep')
    }
  }

  async deleteInvestorRep(token, representation_id){
    try {
      const investor= await this.investorRepository.findOne({ where: { user_id: token , user_type:eTypeUser['Persona Jurídica']} });

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const investorRep= await this.InvestorRepresentationRepository.findOne({ 
        relations:['investor'],
        where: { investor:{
          user_id:token
        }, representation_id:representation_id }
      });

      if(!investorRep){
        throw new UnauthorizedException('Invalid credentials');
      }
  
      await this.InvestorRepresentationRepository.delete(investorRep.representation_id);
  
      return {
        message:'Rep deleted successfully'
      }
    } catch (error) {
      return this.handleErrors(error,'deleteInvestorRep')
    }
  }

  async changeStatement(token,statementOfFunds){
    try {
      const user= await this.investorRepository.findOne({ where: { user_id: token } });

      if(!user){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.investorRepository.update(user.user_id,{
        statement_funds:statementOfFunds
      });

      return {
        message:'Statement changed successfully'
      }
    } catch (error) {
      this.handleErrors(error,'changeStatement')
    }
  }

  async deleteRequest(token, body){
    try {
      const investor= await this.investorRepository.findOne({ where: { user_id: token } });

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }
      const emailsNotification= await this.webConfigRepository.find({
        where:{
          type: ConfigTypes.EMAIL_NOTIFICATION,
          status: GeneralStatus.ACTIVE
        },
        select:['name']
      })

      await this.mailerService.sendMail({
        from:process.env.MAIL_USER,
        to:emailsNotification.map(i=>i.name),
        subject:'Solicitud de eliminación',
        html: `Info: ${investor.document_type} ${investor.document} Nombres: ${investor.names} ${investor.surname} Razon: ${body.request}`
      });

      await this.investorRepository.update(investor.user_id,{
        delete_request:body.request,
      });
      
      return {
        message:'Request sent successfully'
      };
    } catch (error) {
      this.handleErrors(error,'deleteRequest');
    }
  }

  async listDeleteRequests(token){
    try {
      const investor= await this.investorRepository.findOne({ where: { user_id: token } });

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const requests= await this.investorRepository.find({
        select:['user_id','names','surname','document_type','document', 'phone','delete_request'],
        where:{delete_request:Not(IsNull())}
      });

      return requests;
    } catch (error) {
      this.handleErrors(error,'listDeleteRequests');
    }
  }
  // SERVICIO PRINCIPAL
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
    const existeInvestor = await this.investorRepository.findOne({ where: { email } });

    return res.status(200).json({ validate: existeUser? true: false, validateInvestor: existeInvestor? true: false });
  }

  async resetToken(@Req() req: Request,@Res() res: Response){
    const { token, isInvestor=false } = req.body;
    
    const repository = isInvestor ? this.investorRepository : this.userRepository;  

    const user = await repository.findOne({ where: { resetpass: token } });

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
    if(error instanceof UnauthorizedException){
      throw new UnauthorizedException(error.message)
    }
    if(error instanceof BadRequestException){
      throw new BadRequestException(error.message)
    }
    
    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
