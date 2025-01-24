import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, Header } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { In, Raw, Repository } from 'typeorm';
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { Investor } from '../auth/entities/investor.entity';
import { Documentation } from '../auth/entities/documentation.entity';
import { SearchDocDto } from './dto/search-doc.dto';
import { DocsStatus } from './interfaces/docs-status.interface';

@Injectable()
export class AwsService {
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
    @InjectRepository(Investor)
    private readonly investorRepository: Repository<Investor>,
    @InjectRepository(Documentation)
    private readonly documentationRepository: Repository<Documentation>,

  ) {}

  async listFiles(token: string) {
    
    const user = await this.userRepository.findOne({ where: { id: token } });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRuc = user.ruc;
    const params = {
      Bucket: process.env.AWSBUCKET,
      Prefix: `${userRuc}`,
    };

    try {
      const data = await this.s3.send(new ListObjectsV2Command(params));
      
      const links = data.Contents.map((item) => {
        const type = item.Key.replace("/", " ").split(" ");
        return {
          type: type[1],
          file: `${this.awsUrl}/${item.Key}`, 
        };
      });

      return links;
    } catch (err) {
      throw new BadRequestException(`Error fetching files: ${err.message}`);
    }
  }

  async uploadFile(token: string, file: Express.Multer.File, type: string) {
    const user = await this.userRepository.findOne({ where: { id: token } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userRuc = user.ruc ? user.ruc: user.document;

    const {mimetype,buffer} = file;
    // Parámetros para S3
    const params = {
      Bucket: process.env.AWSBUCKET,
      Key: `${userRuc}/${type}`,
      Body: buffer,
      ContentType: mimetype,
    };

    try {
      const upload= new PutObjectCommand(params);

      const result = await this.s3.send(upload);
      
      return { msg: 'uploaded successfully', link: result };
    } catch (err) {
      throw new BadRequestException(`Error uploading file: ${err}`);
    }
  }

  async uploadDoc(req: Request, res: Response) {
    const token = req.headers['token'] as string;
    const investor = await this.investorRepository.findOne({ where: { user_id: token } });
    if (!investor) {
      throw new UnauthorizedException('User not found');
    }

    const files = req.files as Express.Multer.File[];

    for (let i = 0; i < files.length; i++) {
      const type=req.body[`type${i+1}`];

      const { mimetype, buffer } = files[i];

      let existingDoc = await this.documentationRepository.findOne({
        where: { 
          documentType: type, investor:{
            user_id:token
          }
         },
      });
      
      const params = {
        Bucket: process.env.AWSBUCKET,
        Key: `documentacion/${investor.document}/${type}`,
        Body: buffer,
        ContentType: mimetype,
      };
      try {
        const upload = new PutObjectCommand(params);
        await this.s3.send(upload);
        const docUrl = `${process.env.AWSURL}${encodeURIComponent(params.Key)}`;

        if (existingDoc) {
          existingDoc.url = docUrl;
          await this.documentationRepository.update(existingDoc.id, { url: docUrl, documentType: type });
        } else {
          const newDoc = this.documentationRepository.create({
            documentType: type,
            url: docUrl,
            investor: investor,
          });
          await this.documentationRepository.save(newDoc);
        }
      } catch (err) {
        throw new BadRequestException(`Error uploading file: ${err}`);
      }
    }

    return res.status(200).json({ msg: 'uploaded successfully' });
  }

  async listDocs(token: string) {
    const investor = await this.investorRepository.findOne({ 
      where: { user_id: token },
      relations:['documentation']
     });
    if (!investor) {
      throw new UnauthorizedException('User not found');
    }

    try {
      const docs = investor.documentation.map((doc) => {
        return {
          statement_funds: investor.statement_funds,
          type: doc.documentType,
          url: doc.url,
          status: doc.status
        };
      }); 

      return docs;
    } catch (err) {
      throw new BadRequestException(`Error fetching files: ${err.message}`);
  }
  }

  async listDocsAdmin(token: string, searchDocDto: SearchDocDto) {
    try {
      const admin= await this.userRepository.findOne({
        where:{
          id:token,
          role: In([0, 1])
        }}
      );

      if(!admin){
        throw new UnauthorizedException('Invalid credentials');
      }

      const page = searchDocDto.page ?? 1;
      const limit = searchDocDto.limit ?? 10;

      const [docs, total] = await this.documentationRepository.findAndCount({
        where: {
          createdAt: searchDocDto.registerDate
          ? Raw(alias => `DATE(${alias}) = STR_TO_DATE('${searchDocDto.registerDate}', '%d/%m/%Y')`)
          : null
          ,
          status: searchDocDto.status? searchDocDto.status : null,
          investor: {
            names: searchDocDto.clientName ? Raw((alias) => `CONCAT(${alias}, ' ', surname) LIKE :fullName`, {
              fullName: `%${searchDocDto.clientName}%`,
            }): null,
          }
        },
        relations: ['investor'],
        take: limit,
        skip: (page - 1) * limit,
      });

      const totalPages = Math.ceil(total / limit);

      const docsWithNames= docs.map((doc)=>{
          const {investor,...docsData}=doc;
          return {
            ...docsData,
            statement_funds: investor.statement_funds,
            clientName: `${investor.names} ${investor.surname}`,
            identifier: `${investor.document_type} ${investor.document}`,
          }
        }
      )

      return {
        docs: docsWithNames,
        meta: {
          page,
          limit,
          total,
          totalPages
        }
      };

    } catch (error) {
      this.handleErrors(error,'listDocsAdmin')
    }
  }

  async manageDocs(token: string, id: string, status: DocsStatus) {
    try {
      const admin= await this.userRepository.findOne({
        where:{
          id:token,
          role: In([0, 1])
        }}
      );
      if (!admin) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const doc = await this.documentationRepository.findOne({ where: { id: id } });
      if (!doc) {
        throw new BadRequestException('Document not found');
      }

      await this.documentationRepository.update(doc.id, { status: status });

      return { msg: 'Document updated successfully' };
    } catch (error) {
      this.handleErrors(error,'manageDocs')
    }
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
    
    throw new InternalServerErrorException(`Something went wrong at ${type}`)
  }
}