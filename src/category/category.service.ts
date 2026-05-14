import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from '../service/entities/service.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const categoryExist = await this.categoryRepository.findOne({
        where: { name: createCategoryDto.name },
      });
      if (categoryExist) {
        throw new Error('Category already exists');
      }
      const category = await this.categoryRepository.create(createCategoryDto);
      await this.categoryRepository.save(category);

      return {
        message: 'Catégorie créée avec succès',
        category,
        status: 201,
      }
    } catch (error) {
      throw new BadRequestException("Erreur lors de la création de la catégorie")
    }
  }

  async findAll() {
    try {
      const listCategory = await this.categoryRepository.find();
      return listCategory;
    } catch (error) {
      throw new HttpException("Erreur lors de la récupération des catégories", 500);
    }
  }

  async getListService(id: number){
    try {
      const listServiceOfCategory = await this.serviceRepository.find({
        where: {categories: {id: id}}
      })
      return {
        message: "Liste de service lier à une categorie",
        data: listServiceOfCategory,
        status: 200
      }
      
    } catch (error) {
      throw new HttpException("Erreur lors de la recuperartion de service",500)
    }
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new HttpException(`La catégorie avec l'ID #${id} n'existe pas`, 404);
    }
    return {
      message: 'Catégorie trouvée avec succès',
      data: category,
      status: 200,
    };

  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new HttpException(`La catégorie avec l'ID #${id} n'existe pas`, 404);
    }

    await this.categoryRepository.remove(category);
    return { 
      message: `Catégorie #${id} supprimée avec succès`,
      status: 200,
    };
  }
}
