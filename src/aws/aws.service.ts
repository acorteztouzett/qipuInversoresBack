import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, Header } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { Repository } from 'typeorm';
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { Investor } from '../auth/entities/investor.entity';
import { Documentation } from '../auth/entities/documentation.entity';

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