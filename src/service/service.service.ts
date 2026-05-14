import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { In, Like, Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>, // On injecte Category
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(createServiceDto: CreateServiceDto, logo?: Express.Multer.File) {
    try {
      const { categoryIds, ...serviceData } = createServiceDto;

      const existService = await this.serviceRepository.findOne({
        where: { name: serviceData.name },
      });
      if (existService) throw new BadRequestException('Service already exists');


      let categories: Category[] = [];
      if (categoryIds && categoryIds.length > 0) {
        categories = await this.categoryRepository.findBy({
          id: In(categoryIds),
        });
      }

      let logoUrl = null;
      // if (logo) {
      //   const uploadResult = await this.cloudinaryService.uploadFile(logo);
      //   logoUrl = uploadResult.secure_url;
      // } else {
      //   const service = this.serviceRepository.create({
      //     ...serviceData,
      //     logo: logoUrl,
      //     categories: categories, // TypeORM fera le lien dans la table de jonction
      //   });

      // }

      // 4. Créer et sauvegarder le service avec ses catégories

      // const savedService = await this.serviceRepository.save(service);

      // return {
      //   message: 'Service créé avec succès',
      //   service: savedService,
      //   status: 201,
      // };
    } catch (error) {
      console.error(error);
      throw new BadRequestException("Erreur lors de la création du service");
    }
  }

  async findAll(search?: string) {
    try {
      return await this.serviceRepository.find({
        where: search ? { name: Like(`%${search}%`) } : {},
        relations: ['categories'], // On charge les catégories pour les voir dans la liste
      });
    } catch (error) {
      throw new HttpException("Erreur lors de la récupération", 500);
    }
  }

  async findOne(id: number) {
    const service = await this.serviceRepository.findOne({ 
        where: { id },
        relations: ['categories'] // Crucial pour voir les catégories liées
    });
    
    if (!service) {
      throw new HttpException(`Le service #${id} n'existe pas`, 404);
    }
    return { data: service };
  }
}