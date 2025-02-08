import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, Header } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { In, Raw, Repository } from 'typeorm';
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { Investor } from '../auth/entities/investor.entity';
import { Documentation } from '../auth/entities/documentation.entity';
import { SearchDocDto } from './dto/search-doc.dto';
import { DocsStatus, requiredDocsN, requiredDocsPJ } from './interfaces/docs-status.interface';
import { eTypeUser } from 'src/auth/interfaces/userInterfaces';
import { S3Path } from 'src/utils/enums/s3path.enum';
import { Upload } from '@aws-sdk/lib-storage';

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

    const {mimetype,buffer} = file;
    // Parámetros para S3
    const params = {
      Bucket: process.env.AWSBUCKET,
      Key: `${S3Path.User}/${user.id}/${type}`,
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
  
    try {
      await Promise.all(files.map(async (file, index) => {
        const type = req.body[`type${index + 1}`];
        const { mimetype, buffer } = file;
        
        const existingDoc = await this.documentationRepository.findOne({
          where: { 
            documentType: type, 
            investor: { user_id: token }
          },
        });
  
        const key = `${S3Path.Investor}/${investor.user_id}/${type}`;
        console.log(key);
        const upload = new Upload({
          client: this.s3,
          params: {
            Bucket: process.env.AWSBUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
          },
        });
  
        await upload.done(); 
  
        if (existingDoc) {
          await this.documentationRepository.update(existingDoc.id, { url: key, documentType: type });
        } else {
          const newDoc = this.documentationRepository.create({
            documentType: type,
            url: key,
            investor,
          });
          await this.documentationRepository.save(newDoc);
        }
      }));
  
      return res.status(200).json({ msg: 'Uploaded successfully' });
  
    } catch (err) {
      throw new BadRequestException(`Error uploading file: ${err.message}`);
    }
  }

  async validateDocs(token: string) {
    try {
      const investor = await this.investorRepository.findOne({ 
        where: { user_id: token },
        relations:['documentation']
       });
      if (!investor) {
        throw new UnauthorizedException('User not found');
      }

      if(investor.documentation.length===0) return { validateToInvest: false};

      const docsToValidate= investor.user_type===eTypeUser['Persona Natural'] ? requiredDocsN : requiredDocsPJ;
  
      const hasAllRequiredDocs = docsToValidate.every(docType => 
        investor.documentation.some(doc => doc.documentType === docType && doc.status === DocsStatus.Confirmado)
      );
  
      if (!hasAllRequiredDocs) {
        return { validateToInvest: false };
      }

      return {validateToInvest: true};

    } catch (error) {
      this.handleErrors(error,'validateDocs')
    }
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
          url: `${this.awsUrl}${encodeURI(doc.url)}`,
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
          const {investor, url,...docsData}=doc;
          return {
            ...docsData,
            url: `${this.awsUrl}${encodeURI(doc.url)}`,
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