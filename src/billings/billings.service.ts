import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, NotFoundException, Req, Res, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { Billing } from 'src/auth/entities/billing.entity';
import { Operation } from 'src/auth/entities/operation.entity';
import { Operator } from 'src/auth/entities/operator.entity';
import { User } from 'src/auth/entities/user.entity';
import { In, Like, Raw, Repository } from 'typeorm';
import { readFile, unlink } from 'fs/promises';
import { Payer } from '../auth/entities/payer.entity';
import * as xml2js from 'xml2js';
import * as dayjs from 'dayjs';
import decompress from 'decompress';
import { SearchOperationsDto } from './dto/search-operations.dto';
import { EditOperationDto } from './dto/edit-operations.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { SearchOportunityDto } from './dto/search-oportunity.dto';
import { S3Path } from 'src/utils/enums/s3path.enum';
import { Roles } from 'src/utils/enums/general-status.enums';

@Injectable()
export class BillingsService {
  private readonly awsUrl=process.env.AWSURL;
  private s3 = new S3Client({
    region:process.env.AWS_S3_REGION,
    credentials:{
      accessKeyId:process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey:process.env.AWS_S3_SECRET_ACCESS_KEY
    }
  })
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Billing)
    private readonly billingRepository: Repository<Billing>,
    @InjectRepository(Operation)
    private readonly operationRepository: Repository<Operation>,
    @InjectRepository(Operator)
    private readonly operatorRepository: Repository<Operator>,
    @InjectRepository(Payer)
    private readonly payerRepository: Repository<Payer>
  ){}

  async getInfoOperator(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const { search } = req.query;
    const isAdmin = await this.userRepository.findOne({ 
      where: { id: token, role: Roles.OPERATOR } ,
      relations: ['operator'],
    });
    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }
     
    const operator = await this.operatorRepository.findOne({ where: { id: isAdmin.operator.id } });
       
    const users = await this.userRepository.find({
      where: {
        role: Roles.USER,
        operator: { id: operator.id },
        company_name: Like(`%${search}%`),
      },
      relations: ['billing', 'billing.payer', 'billing.operation'],
      order: {
        company_name: 'ASC',
        billing: {
          createdAt: 'DESC',
          payer: { full_name: 'ASC' },
        },
      },
    });
   
    if (users.length === 0) {
      return { msg: 'billings not found' };
    }
   
    const newBills = users.map((user) => ({
      id: user.id,
      name: user.name,
      company_name: user.company_name,
      billings: user.billing.map((billing) => ({
        id: billing.id,
        billing_id: billing.billing_id,
        amount: billing.amount,
        detraction: billing.detraction,
        net_amount: billing.net_amount,
        currency: billing.currency,
        contactName: billing.payer.full_name,
        date_emission: billing.date_emission,
        status: billing.status,
        date_payment: billing.date_payment,
        n_days: billing.n_days,
        commission: billing.commission,
        partner: billing.partner,
        first_payment: billing.first_payment,
        second_payment: billing.second_payment,
        commercial: billing.commercial,
        n_commercial_qipu: billing.n_commercial_qipu,
        n_operation: billing.operation?billing.operation.n_operation:null,
        createdAt: billing.createdAt,
        updatedAt: billing.updatedAt,
        date_payout: billing.date_payout,
        pdfLink: `${this.awsUrl}${encodeURI(billing.pdfLink)}`,
        xmlFile: `${this.awsUrl}${encodeURI(billing.xmlLink)}`,
        documentsustent: billing.documentsustentLink? `${this.awsUrl}${encodeURI(billing.documentsustentLink)}`: null,
        date_expiration: billing.date_expiration,
        monthly_rate: billing.monthly_rate,
        payer_name: billing.payer.name_debtor,
      })),
    }));
   
    return newBills;
  }

  async getInfoAdmin(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const { search } = req.query;
    const isAdmin = await this.userRepository.findOne({ where: { id: token, role: Roles.ADMIN } });
    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }
    
    
    const users = await this.userRepository.find({
      where: { company_name: Like(`%${search}%`) },
      relations: ['billing','billing.payer','billing.operation'],
      order: {
        company_name: 'ASC',
        billing: {
          createdAt: 'DESC',
          payer: { full_name: 'ASC'}
        },
      },
    });
    
    if (users.length === 0) {
      return { msg: 'Billings not found' };
    }
    
    const newBills = users.map((user) => ({
      id: user.id,
      name: user.name,
      company_name: user.company_name,
      billings: user.billing.map((bill) => ({
        id: bill.id,
        billing_id: bill.billing_id,
        amount: bill.amount,
        detraction: bill.detraction,
        net_amount: bill.net_amount,
        currency: bill.currency,
        contactName: bill.payer.full_name ? bill.payer.full_name : null,
        date_emission: bill.date_emission,
        status: bill.status,
        date_payment: bill.date_payment,
        n_days: bill.n_days,
        commission: bill.commission,
        partner: bill.partner,
        first_payment: bill.first_payment,
        second_payment: bill.second_payment,
        commercial: bill.commercial,
        n_commercial_qipu: bill.n_commercial_qipu,
        n_operation: bill.operation?bill.operation.n_operation:null ,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
        date_payout: bill.date_payout,
        pdfLink: `${this.awsUrl}${encodeURI(bill.pdfLink)}`,
        xmlFile: `${this.awsUrl}${encodeURI(bill.xmlLink)}`,
        documentsustent: bill.documentsustentLink? `${this.awsUrl}${encodeURI(bill.documentsustentLink)}`: null,
        date_expiration: bill.date_expiration,
        monthly_rate: bill.monthly_rate,
      })),
    }));
    
    return newBills;
  }

  async getInfo(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const{search}=req.query
    const user = await this.userRepository.findOne({ where: { id: token } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const bills = await this.billingRepository.find({
      where: {
        user: { id: user.id },
        payer: { name_debtor: Like(`%${search}%`) },
      },
      relations: ['payer', 'operation'],
      order: { 
        createdAt: 'DESC',
        payer: { name_debtor: 'ASC' } 
      },
    });
    
    if (bills.length === 0) {
      return { msg: 'Billings not found' };
    }
    
    const newBills = bills.map((item) => ({
      id: item.id,
      billing_id: item.billing_id,
      amount: item.amount,
      detraction: item.detraction,
      net_amount: item.net_amount,
      currency: item.currency,
      contactName: item.payer.name_debtor,
      date_emission: item.date_emission,
      status: item.status,
      date_payment: item.date_payment,
      n_days: item.n_days,
      commission: item.commission,
      partner: item.partner,
      first_payment: item.first_payment,
      second_payment: item.second_payment,
      commercial: item.commercial,
      n_commercial_qipu: item.n_commercial_qipu,
      n_operation: item.operation?item.operation.n_operation:null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      date_payout: item.date_payout,
      date_expiration: item.date_expiration,
      monthly_rate: item.monthly_rate,
    }));
    
    return newBills;
  }

  async getOperation(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const { search } = req.query;
    const isAdmin = await this.userRepository.findOne({ where: { id: token, role: In([Roles.ADMIN,Roles.OPERATOR]) } });
    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }
   
    const operations = await this.operationRepository.find({
      where: [
        { n_operation: Like(`%${search}%`) },
        { name: Like(`%${search}%`) },
      ],
      relations: ['billing', 'payer', 'billing.user'],
      order: {
        name: 'ASC',
        billing: {
          payer: { full_name: 'ASC'},
        },
      },
    });
   
    
    const newOperation = operations.map((operation) => ({
      n_operation: operation.n_operation,
      name: operation.name,
      contact: operation.payer.full_name,
      status: operation.status,
      billings: Array.isArray(operation.billing) ? operation.billing.map((billing) => ({
        userId: billing.user.id,
        id: billing.id,
        billing_id: billing.billing_id,
        amount: billing.amount,
        detraction: billing.detraction,
        net_amount: billing.net_amount,
        contactName:operation.payer.full_name,
        date_emission: billing.date_emission,
        status: billing.status,
        date_payment: billing.date_payment,
        n_days: billing.n_days,
        commission: billing.commission,
        partner: billing.partner,
        first_payment: billing.first_payment,
        second_payment: billing.second_payment,
        commercial: billing.commercial,
        n_commercial_qipu: billing.n_commercial_qipu,
        createdAt: billing.createdAt,
        updatedAt: billing.updatedAt,
        date_payout: billing.date_payout,
        pdfLink: `${this.awsUrl}${encodeURI(billing.pdfLink)}`,
        xmlFile: `${this.awsUrl}${encodeURI(billing.xmlLink)}`,
        documentsustent: billing.documentsustentLink? `${this.awsUrl}${encodeURI(billing.documentsustentLink)}`: null,
        date_expiration: billing.date_expiration,
        monthly_rate: billing.monthly_rate,
    })) : [],
  }));
   
    return newOperation;
  }

  async getInfoUserAdmin(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([Roles.ADMIN, Roles.OPERATOR]) },
    });
  
    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }
  
    const user = await this.userRepository.findOne({ where: { id: req.body.id } });
  
    if (!user) {
      throw new NotFoundException('Client not found');
    }
  
    const pagador = await this.payerRepository.findOne({ where: { id: req.body.payer_id } });
    if (!pagador) {
      throw new NotFoundException('Debtors not found');
    }
    
    const bills = await this.billingRepository.find({
      where: { user: { id: user.id }, payer: { id: pagador.id } },
      relations: ['payer','user','operation']
    });
  
    if (!bills || bills.length === 0) {
      return { msg: 'Billings not found' };
    }
  
    const newBills = bills.map((item) => ({
      id: item.id,
      billing_id: item.billing_id,
      amount: item.amount,
      date_emission: item.date_emission,
      date_expiration: item.date_expiration,
      currency: item.currency,
      net_amount: item.net_amount,
      usedInOperation: item.operation?true:false,
    }));
  
    return newBills;
  }

  async createBill(@Req() req: Request,@Res() res: Response){
    try {
      const token = req.headers['token'] as string;
      const user = await this.userRepository.findOne({ where: { id: token } });
      const payer= await this.payerRepository.findOne({ where: { id: req.body.contact_Id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    
      if (!payer) {
        throw new NotFoundException('Contact not found');
      }
      const pdf= req.files[0];
      const xml= req.files[1];

      const net_amount= Number(req.body.amount) - Number(req.body.detraction);
          
      const billing = this.billingRepository.create({ ...req.body,net_amount,user, payer });
      await this.billingRepository.save(billing);

      const billSaved= await this.billingRepository.findOne({ where: { 
        billing_id: req.body.billing_id,
        payer: { id: req.body.contact_Id },
        user: { id: token }
      } });

      const pdfKey = `${S3Path.Billing}/${billSaved.id}/PDF`;
      await this.uploadFileToS3(pdf, pdfKey);
      const xmlKey = `${S3Path.Billing}/${billSaved.id}/XML`;
      await this.uploadFileToS3(xml, xmlKey);

      const documentsustent= req.files[2];
      const documentsustentKey = `${S3Path.Billing}/${billSaved.id}/DOCUMENTSUSTENT`;
      if(req.files[2]){
      await this.uploadFileToS3(documentsustent, documentsustentKey);
      }

      await this.billingRepository.update({ 
        billing_id: req.body.billing_id,
        payer: { id: req.body.contact_Id },
        user: { id: token }
       }, { pdfLink: pdfKey, xmlLink :xmlKey, documentsustentLink:documentsustent?documentsustentKey:null });
      
      return { msg: 'Created successfully' };
    } catch (error) { 
      return error
    }
  }
  
  async createBulk(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const contactId = req.body.contact;
    const user = await this.userRepository.findOne({ where: { id: token} });
    const contact = await this.payerRepository.findOne({ where: { id: contactId } });

    const bankName = user.bank_name;
    const account = user.bank_acc;
    const contactName = contact.full_name;
    const sanitizedContactName = contactName.replace(/\s+/g, '');
    

    const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    for (const file of filesArray) {
      const tempZipPath = file.path;
      const extractedFiles = await decompress(tempZipPath, './temp', {
        filter: (file) => file.path.match(/\.(xml|pdf)$/i),
      });

      const xmlFile = extractedFiles.find((item) => item.path.match(/\.xml$/i));
      const pdfFile = extractedFiles.find((item) => item.path.match(/\.pdf$/i));

      const xmlData = xmlFile.data;
      const pdfData = pdfFile.data;

      const parser = new xml2js.Parser();
      const parsedXml = await parser.parseStringPromise(xmlData);
      const invoiceId = parsedXml.Invoice['cbc:ID'][0];
      const rucClient = parsedXml.Invoice['cac:AccountingCustomerParty'][0]['cac:Party'][0]['cac:PartyIdentification'][0]['cbc:ID'][0]['_'];
      const typeCoin = parsedXml.Invoice['cac:InvoiceLine'][0]['cac:Price'][0]['cbc:PriceAmount'][0]['$'].currencyID === 'PEN' ? 'S/' : '$';
      const amount = typeCoin + parsedXml.Invoice['cac:InvoiceLine'][0]['cac:PricingReference'][0]['cac:AlternativeConditionPrice'][0]['cbc:PriceAmount'][0]['_'];
      const netAmount = parseFloat(parsedXml.Invoice['cac:InvoiceLine'][0]['cbc:LineExtensionAmount'][0]['_']);
      const detraction = typeCoin + parsedXml.Invoice['cac:InvoiceLine'][0]['cac:TaxTotal'][0]['cbc:TaxAmount'][0]['_'];
      const dateEmission = dayjs(parsedXml.Invoice['cbc:IssueDate'][0]).toDate();

      const billingData = {
        user: { id: user.id },
        bank_name: bankName,
        account,
        payer: { id: contact.id },
        billing_id: invoiceId,
        amount: parseFloat(amount.replace(typeCoin, '')),
        detraction: parseFloat(detraction.replace(typeCoin, '')),
        net_amount: netAmount,
        date_emission: dateEmission,
      };
      
      await this.billingRepository.save(billingData);

      const billSaved= await this.billingRepository.findOne({ where: billingData });

      const pdfLink = `${S3Path.Billing}/${billSaved.id}/PDF`
      const xmlLink = `${S3Path.Billing}/${billSaved.id}/XML`

      await this.uploadToS3(billSaved.id,'PDF', pdfData, pdfFile.path, 'application/pdf');
      await this.uploadToS3(billSaved.id,'XML', xmlData, xmlFile.path, 'application/xml');

      await this.billingRepository.update({ 
        billing_id: invoiceId,
        payer: { id: contact.id },
        user: { id: user.id }
       }, { pdfLink, xmlLink });
    }
  }
  
  async editBill(@Req() req: Request, @Res() res: Response) {
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([Roles.ADMIN, Roles.OPERATOR]) },
    });

    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    const bill = await this.billingRepository.findOne({
      where: { id: req.body.id },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    const updatedData = { ...req.body };

    if (req.body.amount || req.body.detraction) {
      const amount = req.body.amount ? Number(req.body.amount) : Number(bill.amount);
      const detraction = req.body.detraction ? Number(req.body.detraction) : Number(bill.detraction);
      updatedData.net_amount = amount - detraction;
    }

    await this.billingRepository.update({ id: req.body.id }, updatedData);
    return { msg: 'Updated successfully' };
  }
  
  async editOperation(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([Roles.ADMIN,Roles.OPERATOR]) },
    });
    
    const payer= await this.payerRepository.findOne({ where: { id: req.body.contact_Id } });
    
    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    if(!payer){
      throw new NotFoundException('Contact not found');
    }
    
    const idsArray = req.body.ids.slice(1, -1).split(',');
    
    const operation = await this.operationRepository.findOne({
      where: {
          n_operation: req.body.n_operation,
          name: req.body.name,
          payer: payer,
        },
      });
      
      if (!operation) {
        throw new Error('Operation not found');
      }
      
      await this.billingRepository.update(
        { operation: { id: operation.id } },
        { operation: null },
      );
      
      await this.operationRepository.update(
        { id: operation.id },
        { status: req.body.status },
      );
  
      await this.billingRepository.update(
        { id: In(idsArray) },
        {
          operation: { id: operation.id },
          status: req.body.status,
        },
      );
  
      return { msg: 'Updated successfully' };
  }
    
  async operationBill(@Req() req: Request,@Res() res: Response){
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([Roles.ADMIN,Roles.OPERATOR]) },
    });
    
    const payer= await this.payerRepository.findOne({ where: { id: req.body.contact_Id } });
    
    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    if(!payer){
      throw new NotFoundException('Contact not found');
    }
    
    const idsArray: string[] = req.body.ids.slice(1, -1).split(',');

    const billings = await this.billingRepository.find({
      where: {
        id: In(idsArray),
        currency: req.body.currency,
      },
    });

    if(billings.length < idsArray.length){
      throw new NotFoundException('Billings not found or currency is different');
    }
    
    const newOperation = this.operationRepository.create({
      n_operation: req.body.n_operation,
      name: req.body.name,
      currency: req.body.currency,
      payer: payer,
    });
    await this.operationRepository.save(newOperation);
    
    const operation = await this.operationRepository.findOne({
      where: { 
        n_operation: req.body.n_operation,
        currency: req.body.currency,
        payer: payer,
      },
    });
    
    if (!operation) {
      throw new Error('Operation not found');
    }
    
    await this.billingRepository.update(
      { id: In(idsArray) },
      {
        operation: { id: operation.id },
        status: operation.status,
      },
    );
    return { msg: 'Number of operation successfully updated' };
  }

  async getOperationAdmin(token: string, searchOperationsDto: SearchOperationsDto) {
    try {
      const isAdmin= await this.userRepository.findOne({
        where:{
          id:token,
          role: In([Roles.ADMIN,Roles.OPERATOR])
        }}
      );

      if (!isAdmin) {
        throw new UnauthorizedException('Permission denied');
      }

      const page = searchOperationsDto.page ?? 1;
      const limit = searchOperationsDto.limit ?? 10;

      const [operations, totalItems] = await this.operationRepository.findAndCount({
        where: {
          createdAt: searchOperationsDto.registerDate
                    ? Raw(alias => `DATE(${alias}) = STR_TO_DATE('${searchOperationsDto.registerDate}', '%d/%m/%Y')`)
                    : null
          ,
          status: searchOperationsDto.status ? searchOperationsDto.status : null,
          payer:{
            name_debtor: searchOperationsDto.payerName ? Like(`%${searchOperationsDto.payerName}%`) : null
          },
          name: searchOperationsDto.clientName ? Like(`%${searchOperationsDto.clientName}%`) : null,
        },
        relations: ['billing', 'payer'],
        order:{
          createdAt: 'DESC',
        },
        skip: (page - 1) * limit,
        take: limit
      });

      const totalPages = Math.ceil(totalItems / limit);

      const operationsWithNames = operations.map((operation) => {
        const { billing, payer, ...operationData } = operation;
        return {
          ...operationData,
          payerName: payer.name_debtor,
          totalBills: Array.isArray(billing) ? billing.length : 0,
          billings: Array.isArray(billing) ? billing.map((bill) => ({
            id: bill.id,
            billing_id: bill.billing_id,
            amount: bill.amount,
            date_expiration: bill.date_expiration,
            date_emision: bill.date_emission,
            currency: bill.currency,
            net_amount: bill.net_amount,
          })) : [],
          
      }
    });

      return {
        operations: operationsWithNames,
        meta: {
          page,
          limit,
          totalItems,
          totalPages
        }
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  async editOperationAdmin(token: string, id:string, editOperationDto:EditOperationDto) {
    try {
      const isAdmin= await this.userRepository.findOne({
        where:{
          id:token,
          role: In([Roles.ADMIN,Roles.OPERATOR])
        }}
      );

      if (!isAdmin) {
        throw new UnauthorizedException('Permission denied');
      }

      const operation = await this.operationRepository.findOne({
        where: { id },
        relations: ['payer']
      });

      if (!operation) {
        throw new NotFoundException('Operation not found');
      }

      await this.operationRepository.update({ id }, {
        status: editOperationDto.status,
        n_operation: editOperationDto.operationNumber,
        name: editOperationDto.clientName,
        available_to_invest: editOperationDto.availableToInvest,
        auction_close_date: editOperationDto.auctionCloseDate,
        monthly_rate: editOperationDto.monthlyRate,
      });

      if(editOperationDto.payerName){
        const payer = await this.payerRepository.findOne({
          where: { id: operation.payer.id }
        });

        if (!payer) {
          throw new NotFoundException('Payer not found');
        }

        await this.payerRepository.update({ id: payer.id }, { name_debtor: editOperationDto.payerName });
      }

      return { msg: 'Operation updated successfully' };
      
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async createInvestment(token:string, operationId:string, createInvestmentDto:CreateInvestmentDto){
    try {
      const isAdmin= await this.userRepository.findOne({
        where:{
          id:token,
          role: In([Roles.ADMIN,Roles.OPERATOR])
        }}
      );

      if (!isAdmin) throw new UnauthorizedException('Permission denied');

      const operation = await this.operationRepository.findOne({
        where: { 
          id:operationId 
        },
        relations: ['billing']
      });

      if (!operation) throw new NotFoundException('Operation not found');

      const totalAmount = operation.billing.reduce(
        (acc, bill) => acc + Number(bill.net_amount), 
        0
      );
    
      await this.operationRepository.update({ id: operationId }, {
        monthly_rate: createInvestmentDto.monthlyRate,
        auction_close_date: createInvestmentDto.auctionCloseDate,
        progress: 0,
        available_to_invest: true,
        amount_to_finance: totalAmount
      });

      return { msg: 'Investment created successfully' };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getOportunities(searchOportunityDto:SearchOportunityDto) {
    try {
      const page = searchOportunityDto.page ?? 1;
      const limit = searchOportunityDto.limit ?? 10;

      const [operations,totalCount] = await this.operationRepository.findAndCount({
        where: {
          available_to_invest: true,
          status: searchOportunityDto.status ? searchOportunityDto.status : null,
          auction_close_date: searchOportunityDto.closeDate ?
            Raw( alias=> `DATE(${alias}) = STR_TO_DATE('${searchOportunityDto.closeDate}','%d/%m/%Y')`)
            : null,
          payment_date: searchOportunityDto.paymentDate ?
            Raw( alias=> `DATE(${alias}) = STR_TO_DATE('${searchOportunityDto.paymentDate}','%d/%m/%Y')`)
            : null,
        },
        relations: ['payer','payer.risk','billing'],
        order: {
          auction_close_date: 'DESC'
        },
        skip: (page - 1) * limit,
        take: limit
      });
      const totalPages = Math.ceil(totalCount / limit);

      return {
        operations,
        meta: {
          page,
          limit,
          totalItems: totalCount,
          totalPages
      }
    }
    } catch (error) {
      throw new Error(error.message);
    } 
  }
  
  async getOportunity(id:string) {
    try {
      const operation = await this.operationRepository.findOne({
        where: { id },
        relations: ['payer','payer.risk','billing'],
      });

      if (!operation) throw new NotFoundException('Operation not found');

      return operation;

    } catch (error) {
      throw new Error(error.message);
    }
  }

  private async uploadFileToS3(file: any, key: string): Promise<string> {
    const {mimetype,buffer} = file;
    
    const uploadParams = {
      Bucket: process.env.AWSBUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    };
    
    await this.s3.send(new PutObjectCommand(uploadParams));
    
    return key;
  }

  private async uploadToS3(billingId: string, fileType: string, fileData: Buffer, filePath: string, contentType: string) {
    const params = {
      Bucket: process.env.AWSBUCKET,
      Key: `${S3Path.Billing}/${billingId}/${fileType}`,
      Body: fileData,
      ContentType: contentType,
    };

    return new Promise<void>((resolve, reject) => {
      this.s3.send(new PutObjectCommand(params), async (err, data) => {
        if (err) {
          reject(err);
        }
        await unlink(filePath);
        resolve();
      });
    });
  }
}
