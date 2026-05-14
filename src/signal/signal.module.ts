import { Module } from '@nestjs/common';
import { SignalService } from './signal.service';
import { SignalController } from './signal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signal } from './entities/signal.entity'; // Si tu en as besoin pour d'autres fonctionnalités
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Signal]),
    AuthModule,
  ],
  controllers: [SignalController],
  providers: [SignalService],
})
export class SignalModule {}
