import { DataSource } from 'typeorm';
import { User, UserRole } from '../../user/entities/user.entity';
import * as bcrypt from 'bcrypt'; // or your preferred library

export async function userSeed(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const existingUser = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingUser) {
    console.log('User already exists');
    return;
  }

  // Hash the password manually here
  const hashedPassword = await bcrypt.hash('123456', 10);

  const user = userRepository.create({
    pseudo: 'admin',
    email: 'admin@example.com',
    password: hashedPassword, // Save the hash, not the plain text
    role: UserRole.ADMIN
  });

  const admin = await userRepository.save(user);
  console.log('Seed completed with hashed password');
}