import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>,
) {}
  
  findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: Partial<User>) {
  const userExists = await this.userRepository.findOne({ 
    where: { email: data.email } 
  });
  if (userExists) {
    throw new BadRequestException('Un compte existe déjà avec cette adresse email');
  }
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  return this.userRepository.save(data);
}

  findAll() {
    return this.userRepository.find();
  }
  
  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
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
