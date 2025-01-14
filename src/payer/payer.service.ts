import { BadRequestException, Injectable, NotFoundException, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { In, Like, Repository } from 'typeorm';
import { Payer } from '../auth/entities/payer.entity';
import { Operator } from '../auth/entities/operator.entity';

@Injectable()
export class PayerService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Payer)
    private readonly payerRepository: Repository<Payer>,
    @InjectRepository(Operator)
    private readonly operatorRepository: Repository<Operator>,
  ) {}

  async createContact(@Req() req: Request, @Res() res: Response){
    try {
      const token = req.headers['token'] as string;
      const user=await this.userRepository.findOne({where:{id:token}})
      if(!user){
        return {msg:'User not found'}
      }
      const contact = await this.payerRepository.create({ ...req.body, user })
      const save= await this.payerRepository.save(contact)
      return {status:save["status"]}
    } catch (error) {
      return error
    }
  }

  async listContacts( @Req() req: Request, @Res() res: Response){
    try {
      const{search}=req.query;
      const token = req.headers['token'] as string;
      const user = await this.userRepository.findOne({ where: { id: token } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const pagadores = await this.payerRepository.find({
        where: [
          { user: { id: user.id }, full_name: Like(`%${search}%`) },
          { user: { id: user.id }, name_debtor: Like(`%${search}%`) },
        ],
        relations:['risk'],
        order: { full_name: 'ASC' },
      });

      if (!pagadores || pagadores.length === 0) {
        return {msg:'contacts not found'}
      }
      return pagadores;
    } catch (error) {
      return error
    }
  }

  async listarContactosporUser(@Req() req: Request, @Res() res: Response) {

    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([0, 1]) },
    });

    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    const user = await this.userRepository.findOne({ where: { id: req.body.id } });
    if (!user) {
      throw new BadRequestException('Client not found');
    }

    const contacts = await this.payerRepository.find({
      where: { user: { id: user.id } },
      order: { full_name: 'ASC' },
    });

    const pagadores = contacts.map((item) => ({
      name: item.full_name,
    }));

    return pagadores;
  }

  async listarContactosName(@Req() req: Request, @Res() res: Response) {
    
    const token = req.headers['token'] as string;
    const user = await this.userRepository.findOne({ where: { id: token } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const pagadores = await this.payerRepository.find({
      where: { user: { id: user.id } },
      order: { name_debtor: 'ASC' },
    });

    const newPagadores = pagadores.map((item) => ({
      name: item.name_debtor,
      value: item.name_debtor,
      token: item.id,
    }));

    return newPagadores;
  }

  async listarContactosAdmin(@Req() req: Request, @Res() res: Response) {
    const token = req.headers['token'] as string;
    
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([0, 1]) },
      relations:['risk'],
    });

    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    const users = await this.userRepository.find();

    const contacts = await this.payerRepository.find();

    return { users, contacts };
  }

  async eliminarContacto(@Req() req: Request, @Res() res: Response) {
    const token = req.headers['token'] as string;
    
    const user = await this.userRepository.findOne({ where: { id: token } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const contacto = await this.payerRepository.findOne({
      where: { user: { id: user.id }, id: req.body.id },
    });

    if (!contacto) {
      throw new BadRequestException('Contact not found');
    }

    await this.payerRepository.remove(contacto);

    return {msg:'deleted successfully'}
  }

  async modificarContacto(@Req() req: Request, @Res() res: Response) {
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: In([0, 1, 2]) },
    });

    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    const contacto = await this.payerRepository.findOne({
      where: { id: req.body.id },
    });

    if (!contacto) {
      throw new BadRequestException('Contact not found');
    }

    await this.payerRepository.update(contacto.id, req.body);
    return {msg:'updated successfully'}
  }

  async listarContacto(@Req() req: Request, @Res() res: Response) {
    const token = req.headers['token'] as string;
    const user = await this.userRepository.findOne({ where: { id: token } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const contact = await this.payerRepository.findOne({
      where: { user: { id: user.id }, id: req.body.id },
      relations:['risk'],
    });

    if (!contact) {
      throw new BadRequestException('Contact not found');
    }

    return contact;
  }

  async listarContactosUserOperator(@Req() req: Request, @Res() res: Response) {
    const {search}=req.query
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: 1 },
      relations: ['operator'],
    });

    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }
    
    const operator = await this.operatorRepository.findOne({
      where: { id: isAdmin.operator.id },
    });

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const usersWithContacts = await this.userRepository.find({
      where: {
        operator: { id: operator.id },
        role: 2,
        company_name: Like(`%${search}%`),
      },
      relations: ['payer', 'payer.risk'],
      order: {
        company_name: 'ASC',
        payer: {
          full_name: 'ASC'
        },
      },
    });

    const userContacts = usersWithContacts.map(user => ({
      id: user.id,
      name: user.name,
      company_name: user.company_name,
      contacts: user.payer
    }));

    return userContacts;
  }

  async listarContactosUserAdmin(@Req() req: Request, @Res() res: Response) {
    const { search } = req.query;
    const token = req.headers['token'] as string;
    const isAdmin = await this.userRepository.findOne({
      where: { id: token, role: 0 },
    });

    if (!isAdmin) {
      throw new UnauthorizedException('Permission denied');
    }

    const usersWithContacts = await this.userRepository.find({
      where: {
        role: 2,
        company_name: Like(`%${search}%`),
      },
      relations: ['payer','payer.risk'],
      order: {
        company_name: 'ASC',
      },
    });

    const userContacts = usersWithContacts.map(user => ({
      id: user.id,
      name: user.name,
      company_name: user.company_name,
      contacts: user.payer
    }));

    return userContacts;
  }
}
