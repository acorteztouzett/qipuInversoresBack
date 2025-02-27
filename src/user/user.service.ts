import { HttpException, HttpStatus, Injectable, Req, Res, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { Operator } from 'src/auth/entities/operator.entity';
import { User } from 'src/auth/entities/user.entity';
import { In, Repository, Like } from 'typeorm';
import { hashSync, compareSync } from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { templateResetear, templateVerificar, templateVerificarAdmin } from 'src/utils/emailTemplates';
import { customAlphabet } from 'nanoid';
import { Request, Response } from 'express';
import { Roles } from 'src/utils/enums/general-status.enums';

@Injectable()
export class UserService {
  private alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  constructor(
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
      @InjectRepository(Operator)
      private readonly operatorRepository: Repository<Operator>,
      private readonly mailerService:MailerService,
  ) {}

    async editUser(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin = await this.userRepository.findOne({ where: { id: token, role: In([0, 1]) } });

        if (!isAdmin) {
          throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
        }

        const user = await this.userRepository.findOne({ where: { id: req.body.id } });

        if (!user) {
          throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        await this.userRepository.update(user.id, req.body);

        return { msg: 'Updated successfully' };
    }

    async mostrarUsers(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin = await this.userRepository.findOne({ where: { id: token, role: In([0, 1]) } });
        if (!isAdmin) {
          throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
        }
    
        const { search,role,page=1,limit=10 } = req.body;

        
      
        const today = dayjs().format('YYYY-MM-DD');
        
        const [users,totalItems] = await this.userRepository.findAndCount({
          order: {'company_name': 'ASC'},
          relations: ['operator'],
          where: {
            role: role,
            company_name: Like(`%${search}%`)
          },
          skip: (page - 1) * limit,
          take: limit
        });
    
        if (!users.length) {
          throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
        }

        const totalPages = Math.ceil(totalItems / limit);
    
        const userData= users.map((item) => {
          const days = dayjs(item.validity).diff(dayjs(today), 'day');
          let caducity:any = false;
          if (days > 0 && days <= 5) {
            caducity = days;
          } else if (days < 0) {
            caducity = true;
          }
    
          return {
            id: item.id,
            name: item.name,
            email: item.email,
            status: item.status,
            phone: item.phone,
            ruc: item.ruc,
            company_name: item.company_name,
            social_sector: item.social_sector,
            annual_income: item.annual_income,
            name_r: item.name_r,
            position: item.position,
            typeDocument: item.typeDocument,
            document: item.document,
            email_r: item.email_r,
            pep: item.pep,
            validity: item.validity,
            caducity: caducity,
            updatedAt: item.updatedAt,
            operator_name: item.operator? item.operator.name : '',
            bank_acc: item.bank_acc,
            bank_name: item.bank_name,
          };
        });

        return {
          users: userData,
          meta: {
            page,
            limit,
            totalItems,
            totalPages
          }
        };
    }

    async mostrarUser(@Req() req, @Res() res){
        const token = req.headers['token'] as string;    
        const user = await this.userRepository.findOne({ where: { id: token } });
    
        if (!user) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    
        return res.json(user);
    }

    async mostrarUsersOperador(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin = await this.userRepository.findOne({ 
          where: { id: token, role: Roles.OPERATOR },
          relations: ['operator'],
        });
        if (!isAdmin) {
          throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
        }

        const operator = await this.operatorRepository.findOne({ where: { id: isAdmin.operator.id } });
        if (!operator) {
          throw new HttpException('Operator not found', HttpStatus.NOT_FOUND);
        }

        const users = await this.userRepository.find({
          order: {'company_name': 'ASC'},
          relations: ['operator'],
          where: {
            role: Roles.USER, 
            operator:{  id: operator.id }},
        });

        if (!users.length) {
          throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
        }

        return users.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          status: item.status,
          phone: item.phone,
          ruc: item.ruc,
          company_name: item.company_name,
          social_sector: item.social_sector,
          annual_income: item.annual_income,
          name_r: item.name_r,
          position: item.position,
          typeDocument: item.typeDocument,
          document: item.document,
          email_r: item.email_r,
          pep: item.pep,
          validity: item.validity,
          updatedAt: item.updatedAt,
          bank_acc: item.bank_acc,
          bank_name: item.bank_name,
        }));
    }

    async mostrarUsersNameToken(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin=await this.userRepository.findOne({where:{id:token,role:0}})
        if(!isAdmin){
            return res.status(401).json({msg:'permission denied'})
        }

        const user=await this.userRepository.find({
            order:{'company_name':'ASC'},
            where:{role:2}
        })
        if(!user){
            return res.status(401).json({msg:'users not found'})
        }
        const newUsers=user.map((item)=>{
            return {
                id:item.id,
                name:item.company_name,
            }
        })
        return res.status(200).json(newUsers);
    }

    async mostrarUsersNameTokenOperador(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin=await this.userRepository.findOne({
          where:{id:token,role:1},
          relations:['operator']
        })
        if(!isAdmin){
            return res.status(401).json({msg:'permission denied'})
        }

        const operator=await this.operatorRepository.findOne({where:{id:isAdmin.operator.id}})
        const contacts=await this.userRepository.find({
            order:{'name':'ASC'},
            relations:['operator'],
            where:{operator:{id:operator.id} , role:2}
        })
        if(!contacts){
            return res.status(401).json({msg:'users not found'})
        }

        const newUsers=contacts.map((item)=>{
            return {
                id:item.id,
                name:item.name,
            }
        })

        return res.status(200).json(newUsers);
    }

    async mostrarOperadores(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin = await this.userRepository.findOne({ where: { id: token, role: In[Roles.ADMIN, Roles.OPERATOR] } });
        if (!isAdmin) {
          throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
        }

        const operadores = await this.operatorRepository.find({
            relations: ['user'],   
            order: { 'name': 'ASC' },
        });

        if (!operadores.length) {
          throw new HttpException('Operators not found', HttpStatus.NOT_FOUND);
        }

        return operadores.map((operator) => ({
          id: operator.id,
          name: operator.name,
          email: operator.email,
          users: operator.user
            .filter((user) => user.role === 2)
            .map((user) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              status: user.status,
              phone: user.phone,
              ruc: user.ruc,
              company_name: user.company_name,
              social_sector: user.social_sector,
              annual_income: user.annual_income,
              name_r: user.name_r,
              position: user.position,
              typeDocument: user.typeDocument,
              document: user.document,
              email_r: user.email_r,
              pep: user.pep,
              validity: user.validity,
              updatedAt: user.updatedAt,
              bank_acc: user.bank_acc,
              bank_name: user.bank_name,
            })),
        }));
    }

    async loginUser(@Req() req, @Res() res){
        const user=await this.userRepository.findOne({
          where:{email:req.body.email},
          select:['id','password','status','role']
        })

        if(!user){
            return res.status(401).json({msg:'User does not exist'})
        }

        if(!user.status){
            return res.status(401).json({msg:'inactive user'})
        }

        const igualar=compareSync(req.body.password,user.password)
        if (!igualar) {
          return res.status(401).json({msg:'Invalid credentials'})
        }
        res.status(200).json({status:user.status,role:user.role,id:user.id})
  
    }

    async crearUserAdmin(@Req() req: Request, @Res() res:Response){
        const token = req.headers['token'] as string;
        const isAdmin = await this.userRepository.findOne({ where: { id: token, role: 0 } });
        if (!isAdmin) {
          throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
        }
        
        req.body.password = hashSync(req.body.password,10);
        req.body.status = 0;

        const userData = this.userRepository.create(req.body);
        await this.userRepository.save(userData);

        const user= await this.userRepository.findOne({where:{email:req.body.email}})

        if (user.role === 1) {
          
            const operator=await this.operatorRepository.create({
            name: req.body.name,
            email: req.body.email,
            });
            await this.operatorRepository.save(operator);

            await this.userRepository.update(user.id, { operator: operator });

            const template = templateVerificarAdmin(user.name, user.email);
            await this.mailerService.sendMail({
              to: user.email,
              subject: 'Validación de cuenta Qipu Finance',
              html: template,
            })
            return {
              status: user.status,
              role: user.role,
              id: user.id,
            };
        }

        const template = templateVerificar(user.name, user.email,'','');
        await await this.mailerService.sendMail({
          to: user.email,
          subject: 'Validación de cuenta Qipu Finance',
          html: template,
        })
    
        return {
          status: user.status,
          role: user.role,
          id: user.id,
        };
    }

    async asignarOperador(@Req() req, @Res() res){
        const token = req.headers['token'] as string;
        const isAdmin=await this.userRepository.findOne({where:{id:token,role:0}})
        if(!isAdmin){
            return res.status(401).json({msg:'permission denied'})
        }

        const operator=await this.operatorRepository.findOne({where:{id:req.body.id}})
        await this.userRepository.update(
            {id:req.body.idUser},
            {operator:operator}
        ) 
        return res.status(200).json({msg:'updated successfully'})
    }

    async editOperator(@Req() req, @Res() res){
      const token = req.headers['token'] as string;
      const isAdmin = await this.userRepository.findOne({ where: { id: token, role: 0 } });
      if (!isAdmin) {
        throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
      }

      const idsArray = req.body.ids.slice(1, -1).split(',');

      const operator = await this.operatorRepository.findOne({ where: { id: req.body.id } });
      if (!operator) {
        throw new HttpException('Operator not found', HttpStatus.NOT_FOUND);
      }

      await this.userRepository.update(
        { id: In(idsArray) },
        {operator: operator}
      ) 
      return { msg: 'updated successfully' };
    }

    async deleteOperator(@Req() req, @Res() res){
      const token = req.headers['token'] as string;
      const isAdmin = await this.userRepository.findOne({ where: { id: token, role: 0 } });
      if (!isAdmin) {
        throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
      }

      const userOperator = await this.userRepository.findOne({
         where: { 
          operator:{
            id: req.body.id
          },
          role: 1 
        },
         relations: ['operator'],
      });
      if (!userOperator) {
        throw new HttpException('Operator not found', HttpStatus.NOT_FOUND);
      }

      await this.userRepository.delete({ 
        id: userOperator.id,
        role: 1,
       });
      await this.operatorRepository.delete({ id: userOperator.operator.id });

      return { msg: 'deleted successfully' };
    }

    async deleteUser(@Req() req, @Res() res){
      const token = req.headers['token'] as string;
      const isAdmin = await this.userRepository.findOne({ where: { id: token, role: 0 } });
      if (!isAdmin) {
        throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.userRepository.findOne({ where: { id: req.body.id, role: 2 } });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      await this.userRepository.delete({ id: user.id });

      return { msg: 'deleted successfully' };
    }

    async crearUser(@Req() req, @Res() res){
      req.body.password=hashSync(req.body.password,10);
      const userData=await this.userRepository.create(req.body)
      await this.userRepository.save(userData);

      const user=await this.userRepository.findOne({where:{email:req.body.email, name:req.body.name}})

      const template= templateVerificar(user.name,user.email,user.ruc,user.company_name)
      await this.mailerService.sendMail({
          to:user.email,
          subject:'Validación de cuenta Qipu Finance',
          html:template
      })

      return res.status(200).json({status:user.status,role:user.role,id:user.id})
    }

    async crearUserOperator(@Req() req, @Res() res){
      const token = req.headers['token'] as string;
      const isAdmin = await this.userRepository.findOne({ 
        relations: ['operator'],
        where: { id: token, role: 1 } 
      });
      if (!isAdmin) {
        throw new HttpException('Permission denied', HttpStatus.UNAUTHORIZED);
      }

      const operator = await this.operatorRepository.findOne({ where: { id:isAdmin.operator.id } });
      if (!operator) {
        throw new HttpException('Operator not found', HttpStatus.NOT_FOUND);
      }


      req.body.password = hashSync(req.body.password, 10);
      req.body.status = 0;
      req.body.operator = operator;

      const user = await this.userRepository.save(req.body);

      const template = templateVerificar(user.name, user.email, user.ruc, user.company_name);
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Validación de cuenta Qipu Finance',
        html: template,
      });

      return { status: user.status, role: user.role, id: user.uuid };
    }

    async forgotPassword(@Req() req, @Res() res){
      const user = await this.userRepository.findOne({ where:{ email:req.body.email} });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
  
      const token = customAlphabet(this.alphabet,6)().toUpperCase();
      
      if (user.role !== 2) {
        user.resetpass = token;
        await this.userRepository.update(user.id, { resetpass: token , reset_token: new Date(Date.now()+300000) });
      } else if (req.body.ruc) {
        user.resetpass = token;
        await this.userRepository.update(user.id, { resetpass: token , reset_token: new Date(Date.now()+300000) });
      } else {
        throw new HttpException('RUC is required for this user role', HttpStatus.BAD_REQUEST);
      }
  
      const template = templateResetear(user.name, token, user.email);
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Recuperar contraseña Qipu Finance',
        html: template,
      });
  
      return res.json({ msg: 'Token sent' });
    }

    async resetPassword(@Req() req, @Res() res){
      const {password,password2,token}=req.body
      const user=await this.userRepository.findOne({where:{resetpass:token}})
      if(!user){
        return res.status(400).json({msg:'invalid token'})
      }

      if(user.reset_token.getTime() < Date.now()){
        return res.status(400).json({msg:'expired token'})
      }

      if(password===password2){
        const newPassword=hashSync(password,10)
        await this.userRepository.update(user.id,{ password:newPassword ,status:true ,resetpass:null,reset_token:null})
        res.status(200).json({msg:'password updated successfully'})
      }else{
        return res.status(401).json({msg:'invalid password'})
      }
    }

    async emailUser(@Req() req, @Res() res){
      try {
        const token=req.header('token') as string;
        const isAdmin=await this.userRepository.findOne({where:{id:token,role: In([0,1]) }})
        if(!isAdmin){
            return res.status(401).json({msg:'permission denied'})
        }

        await this.mailerService.sendMail({
          to: req.body.email,
          subject: req.body.subject,
          html: req.body.html,
        });

        return res.status(200).json({msg:'email sent successfully'})
      } catch (error) {
        return res.status(400).json(error)
      }
    }

    async editPassword(@Req() req, @Res() res){
      try {
        const {password,email}=req.body
        const user= await this.userRepository.findOne({where:{email:email}})
        if(!user){
            return res.status(400).json({msg:'user not found'})
        }

        const newPassword=hashSync(password,10);
        await this.userRepository.update(user.id,{password:newPassword})
        
        return res.status(200).json({msg:'updated successfully'})
      } catch (error) {
        res.status(400).json(error)
      }
    }
}
