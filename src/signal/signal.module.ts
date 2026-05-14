import { forwardRef, Module } from '@nestjs/common';
import { SignalService } from './signal.service';
import { SignalController } from './signal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signal } from './entities/signal.entity'; // Si tu en as besoin pour d'autres fonctionnalités
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Signal]),
    AuthModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [SignalController],
  providers: [SignalService],
})
export class SignalModule {}
