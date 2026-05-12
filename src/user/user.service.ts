import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Equal, Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UserService {
  constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>,
  private readonly cloudinaryService: CloudinaryService
) {}
  

  async create(data: Partial<User>, avatar: Express.Multer.File) {
    const userExists = await this.userRepository.findOne({ 
      where: { email: data.email } 
    });
    if (userExists) {
      throw new BadRequestException('Un compte existe déjà avec cette adresse email');
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    if (avatar) {
      data.avatar = await this.cloudinaryService.uploadFile(avatar);
    }
    return this.userRepository.save(data);
  }

  async findAll(search?: string) {
  // Si search est vide, undefined ou null, on retourne tout
    if (!search) {
      return await this.userRepository.find();
    }

    return await this.userRepository.find({
      where: [
        { pseudo: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
        { role: Equal(search as any)} 
      ]
    });
  }

  async uploadAvatar(userId: number, avatar: Express.Multer.File){
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('L\'utilisateur n\'existe pas');
    }

    const urlImage = await this.cloudinaryService.uploadFile(avatar);
    user.avatar = urlImage;
    await this.userRepository.save(user);
    return {
      message: "L'avatar a été modifié avec succès",
      user,
      status: 200
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('L\'utilisateur n\'existe pas');
    }
    if (!user.avatar) {
      await this.cloudinaryService.deleteFile(user.avatar ?? '');
      user.avatar = null;
      await this.userRepository.save(user);
    }
  }

  
  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }
  // user.service.ts
  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
    throw new NotFoundException(`L'utilisateur avec l'ID #${id} n'existe pas`);
    }
    await this.userRepository.remove(user);
    return { message: `Utilisateur #${id} supprimé avec succès` };
  }
}
