import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from '../auth/entities/bank_account.entity';
import { Like, Raw, Repository } from 'typeorm';
import { Investor } from '../auth/entities/investor.entity';
import { SearchTransactionDto } from './dto/search-transaction.dto';
import { Transaction } from '../auth/entities/transaction.entity';
import { Wallet } from '../auth/entities/wallet.entity';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class BankService {
  private readonly awsUrl=process.env.AWSURL;
  private s3 = new S3Client({
    region:process.env.AWS_S3_REGION,
    credentials:{
        accessKeyId:process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_S3_SECRET_ACCESS_KEY
    }
  });

  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccRepository: Repository<BankAccount>,
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ){}

  async create(token:string, createBankDto: CreateBankDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const checkBanAcc= await this.checkIfBankAccExistsBeforeCreate(token,createBankDto.currency);

      if(checkBanAcc){
        throw new UnauthorizedException(`Bank account with ${createBankDto.currency} currency already exists`);
      }

      const account = this.bankAccRepository.create({
        bank_acc: createBankDto.accountNumber,
        holder: createBankDto.holder,
        bank_name: createBankDto.bankName,
        cci: createBankDto.cci,
        currency: createBankDto.currency,
        status: createBankDto.status,
        type_account: createBankDto.typeAccount,
        investor: investor
      });
      await this.bankAccRepository.save(account);

      const checkIfWalletExists= await this.walletRepository.findOne({
        where:{
          investor:{
            user_id:investor.user_id
          },
          currency:createBankDto.currency
        }
      });

      if(checkIfWalletExists){
        await this.walletRepository.update(checkIfWalletExists.id, {bank_account:account});
      }else{
        const wallet = this.walletRepository.create({
          balance: 0,
          currency: createBankDto.currency,
          investor: investor,
          bank_account: account
        })
        await this.walletRepository.save(wallet);
      }

      return {message:'Bank account created successfully'};
      
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'create')
    }
  }

  async checkIfBankAccExistsBeforeCreate(token:string, currency:string){
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{
          investor:{
            user_id:investor.user_id
          },
          currency:currency}
      });

      if(account){
        return true;
      }

      return false;
    } catch (error) {
      return this.handleErrors(error,'checkBankAccBeforeCreate')
    }
  }

  async findAll(token:string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const accounts = await this.bankAccRepository.find({
        where: { investor: { user_id: investor.user_id } },
        relations:['wallets']
      });
      
      return accounts;
    } catch (error) {
      return this.handleErrors(error,'findAll')
    }
  }

  async update(token:string, id: string, updateBankDto: UpdateBankDto) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{id:id, investor: {
          user_id: investor.user_id
        }}
      });
      if(!account){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.bankAccRepository.update(account.id,{
        bank_acc: updateBankDto.accountNumber,
        holder: updateBankDto.holder,
        bank_name: updateBankDto.bankName,
        cci: updateBankDto.cci,
        currency: updateBankDto.currency,
        status: updateBankDto.status,
        type_account: updateBankDto.typeAccount
      });

      return {message:'Bank account updated successfully'};
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'update')
    }
  }

  async remove(token:string, id: string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{id:id, investor: {
          user_id: investor.user_id
        }}
      });

      if(!account){
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.walletRepository.update(
        {
          investor:{
            user_id:investor.user_id
          },
          bank_account:{
            id:account.id
          }
        },
          {bank_account:null}
      );
      await this.bankAccRepository.remove(account);

      return {message:'Bank account deleted successfully'}

    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'remove')
    }
  }

  async findTransactions(token:string, searchTransactionDto: SearchTransactionDto) {
    try {
      const page = searchTransactionDto.page ?? 1;
      const limit = searchTransactionDto.limit ?? 10;

      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const wallet= await this.walletRepository.find({
        where:{
          investor: {
            user_id: investor.user_id
          },
          currency: searchTransactionDto.currency
        }
      });

      const [transactions,totalItems] = await this.transactionRepository.findAndCount({
        where:{ 
          currency:searchTransactionDto.currency, 
          wallet: wallet,
          type_movement: searchTransactionDto.transactionType? searchTransactionDto.transactionType: null,
          status: searchTransactionDto.status? searchTransactionDto.status: null,
          createdAt: searchTransactionDto.operationDate? new Date(searchTransactionDto.operationDate): null
        },
        order: {createdAt: 'DESC'},
        skip:(page-1)*limit,
        take:limit
      });

      const totalPages = Math.ceil(totalItems/limit);

      return {
        transactions,
        meta:{
          page,
          limit,
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'findTransactions')
    }
  }

  async findOneTransaction(token:string, id: string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});

      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.walletRepository.findOne({
        where:{ 
          transactions: {
            id: id
          }
        },
        relations:['transactions']
      });

      return account;
    } catch (error) {
      return this.handleErrors(error,'findOneTransaction')
    }
  }

  async deposit(req:Request, res:Response) {
    try {
      const token = req.headers['token'] as string;
      const wallet_id = req.headers['wallet_id'] as string;
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{investor: {
          user_id: investor.user_id
        },
        wallets:{
          id: wallet_id
        }
      },
        relations:['wallets']
      });

      if(!account){
        throw new UnauthorizedException('Invalid account');
      }

      const voucher= req.files[0];

      const params = {
        Bucket: process.env.AWSBUCKET,
        Key: `depositos/${investor.document}/${req.body.operationCode}`,
        Body: voucher.buffer,
        ContentType: voucher.mimetype,
      };

      const upload = new PutObjectCommand(params);
      await this.s3.send(upload);
      const docUrl = `${this.awsUrl}${encodeURIComponent(params.Key)}`;

      const deposit= this.transactionRepository.create({
        amount: req.body.amount,
        type_movement: req.body.typeMovement,
        status: req.body.status,
        currency: account.currency,
        voucher: docUrl,
        destination_account:req.body.destinationAccount,
        charge_account: req.body.chargeAccount,
        bank_operation_code: req.body.operationCode,
        wallet: account.wallets[0]
      });
      await this.transactionRepository.save(deposit);

      return res.status(200).json({message:'transaction completed successfully'});
    } catch (error) {
      console.log(error)
      return res.status(400).json({message:'Something went wrong at deposit'});
    }
  }

  async withdraw(req:Request, res:Response){
    try {
      const token = req.headers['token'] as string;
      const wallet_id = req.headers['wallet_id'] as string;
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const account = await this.bankAccRepository.findOne({
        where:{investor: {
          user_id: investor.user_id
        },
        wallets:{
          id: wallet_id
        }
      },
        relations:['wallets']
      });

      if(!account){
        throw new UnauthorizedException('Invalid account');
      }

      const deposit= this.transactionRepository.create({
        amount: req.body.amount,
        type_movement: req.body.typeMovement,
        status: req.body.status,
        currency: account.currency,
        destination_account:req.body.destinationAccount,
        wallet: account.wallets[0]
      });
      await this.transactionRepository.save(deposit);

      return res.status(200).json({message:'transaction completed successfully'});
    } catch (error) {
      console.log(error)
      return res.status(400).json({message:'Something went wrong at deposit'});
    }
  }

  async findWallets(token:string) {
    try {
      const investor= await this.investorRepository.findOne({where:{user_id:token}});
      if(!investor){
        throw new UnauthorizedException('Invalid credentials');
      }

      const wallets = await this.walletRepository.find({
        where:{ investor: {
          user_id: investor.user_id
        }}
      });

      return wallets;
    } catch (error) {
      return this.handleErrors(error,'findWallets')
    }
  }
  
  async findTransactionsAdmin(token:string, searchTransactionDto: SearchTransactionDto) {
    try {
      const page = searchTransactionDto.page ?? 1;
      const limit = searchTransactionDto.limit ?? 10;

      const admin= await this.userRepository.findOne({
        where:{
          id:token,
          role: 0
        }}
      );

      if(!admin){
        throw new UnauthorizedException('Invalid credentials');
      }

      const [transactions, totalItems] = await this.transactionRepository.findAndCount({
        where: {
          type_movement: searchTransactionDto.transactionType ? searchTransactionDto.transactionType : null,
          createdAt: searchTransactionDto.operationDate ? new Date(searchTransactionDto.operationDate) : null,
          currency: searchTransactionDto.currency ? searchTransactionDto.currency : null,
          wallet: {
            investor: {
              names: searchTransactionDto.clientName ? Raw((alias) => `CONCAT(${alias}, ' ', surname) LIKE :fullName`, {
                fullName: `%${searchTransactionDto.clientName}%`,
              }): null,
            }
          }
      },
      relations: ['wallet', 'wallet.investor'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
      });

      const transactionsWithNames = transactions.map((transaction) => {
        const { wallet, ...transactionData } = transaction;
        return {
          ...transactionData,
          clientName: `${wallet.investor.names} ${wallet.investor.surname}`
        }
      }
      );

      const totalPages = Math.ceil(totalItems / limit);

      return {
      transactions: transactionsWithNames,
      meta: {
        page,
        limit,
        totalItems,
        totalPages
      }
      };
    
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'findTransactionsAdmin')
    }
  }

  async manageDeposit(token:string, id: string, status: string) {
    try {
      const admin= await this.userRepository.findOne({
        where:{
          id:token,
          role: 0
        }}
      );
      if(!admin){
        throw new UnauthorizedException('Invalid credentials');
      }

      const transaction = await this.transactionRepository.findOne({
        where:{id:id},
        relations:['wallet']
      });

      if(!transaction){
        throw new UnauthorizedException('Invalid transaction');
      }

      await this.transactionRepository.update(transaction.id,{
        status: status,
        wallet:{
          balance: status==='Confirmado'? transaction.wallet.balance+transaction.amount: transaction.wallet.balance
        }
      });

      return {message:'Transaction updated successfully'};
      
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'manageDeposit')
    }
  }

  async manageWithdraw(req:Request, res:Response){
    try {
      const token = req.headers['token'] as string;
      const id = req.headers['id'] as string;
      const admin= await this.userRepository.findOne({
        where:{
          id:token,
          role: 0
        }}
      );
      if(!admin){
        throw new UnauthorizedException('Invalid credentials');
      }

      const transaction = await this.transactionRepository.findOne({
        where:{id:id},
        relations:['wallet','wallet.investor']
      });

      if(!transaction){
        throw new UnauthorizedException('Invalid transaction');
      }

      const voucher= req.files[0];

      const params = {
        Bucket: process.env.AWSBUCKET,
        Key: `retiros/${transaction.wallet.investor.document}/${req.body.operationCode}`,
        Body: voucher.buffer,
        ContentType: voucher.mimetype,
      };

      const upload = new PutObjectCommand(params);
      await this.s3.send(upload);
      const docUrl = `${this.awsUrl}${encodeURIComponent(params.Key)}`;

      await this.transactionRepository.update(transaction.id,{
        status: 'Confirmado',
        bank_operation_code: req.body.operationCode,
        voucher: docUrl,
        wallet:{
          balance: req.body.status==='Confirmado'? transaction.wallet.balance-transaction.amount: transaction.wallet.balance
        }
      });

      return res.status(200).json({message:'Transaction updated successfully'});
      
    } catch (error) {
      console.log(error)
      return this.handleErrors(error,'manageWithdraw')
    }
  }

  private handleErrors(error: any,type:string):never{

    if(error instanceof UnauthorizedException){
      throw new UnauthorizedException(error.message)
    }

    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}
