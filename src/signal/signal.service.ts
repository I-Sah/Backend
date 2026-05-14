import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Signal } from './entities/signal.entity';
import { CreateSignalDto } from './dto/create-signal.dto';
import { UpdateSignalDto } from './dto/update-signal.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service'; // Ajuste le chemin
import { Gateway } from '../websocket/gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SignalService {
  constructor(
    @InjectRepository(Signal)
    private readonly signalRepository: Repository<Signal>,
    private readonly gateway:Gateway,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationService: NotificationService,
  ) {}

  async createSignal(
  createSignalDto: CreateSignalDto,
  userId: number,
  fichier?: Express.Multer.File,
) {
  try {
    let pictureUrl: string | null = null;

    if (fichier) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(fichier);
        pictureUrl = uploadResult.secure_url;
      } catch (cloudinaryError) {
        console.error('[Cloudinary Upload Warning]:', cloudinaryError);
      }
    }

    const signalData = {
      ...Object.assign({}, createSignalDto),
      userId,
    };

    if (pictureUrl) {
      (signalData as any).picture = pictureUrl; 
    }

    const signalEntity = this.signalRepository.create(signalData);
    const savedSignal = await this.signalRepository.save(signalEntity);

    const fullSignal = await this.signalRepository.findOne({
      where: {
        signal_id: savedSignal.signal_id, 
      },
      relations: ['user'],
    });

    if (fullSignal) {
      let authorName = 'Un utilisateur';

    if (fullSignal) {
  let authorName = 'Un utilisateur';

  if (fullSignal.anonyme) {
    authorName = 'Anonyme';
  } else if (fullSignal.user?.pseudo) {
    authorName = fullSignal.user.pseudo;
  } else if (userId) {
    authorName = `Utilisateur #${userId}`; 
  }
  
  try {
    const targetUserId = fullSignal.anonyme ? null : userId;

    const savedNotification = await this.notificationService.createSignalNotification(
      fullSignal, 
      authorName, 
      targetUserId 
    );
    
    // Notification Temps réel via WebSocket
    this.gateway.server.emit('signal:new', {
      signal: fullSignal,
      notification: savedNotification,
    });
  } catch (notifError) {
    console.error("Erreur lors de la gestion de la notification:", notifError);
  }
}
    }

    return {
      message: 'Signalement créé avec succès',
      signal: fullSignal,
      status: 201,
    };

  } catch (error) {
    console.error('[CreateSignal Error]:', error);
    throw new BadRequestException("Erreur lors de la création du signalement");
  }
}
  async findAll(page: number = 1, limit: number = 10) {

    const skip = (page - 1) * limit;

    const totalCount =
      await this.signalRepository.count();

    const signals = await this.signalRepository.find({
      relations: ['user'],
      order: {
        created_at: 'DESC',
      },
      skip,
      take: limit,
    });

    // AJOUTER ÇA
    const formattedSignals = signals.map((signal) => ({
      ...signal,

      pseudo: signal.anonyme
        ? 'Anonyme'
        : signal.user?.pseudo || null,
    }));

    return {
      data: formattedSignals,

      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
      },
    };
  }

  async getAllSignals(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const totalCount = await this.signalRepository.count();

    // Correction : Tri sur 'created_at'
    const signals = await this.signalRepository.find({
      order: {
        created_at: 'DESC',
      },
      skip: skip,
      take: limit,
    });

    return {
      message: 'Liste des signalements',
      data: signals,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
      },
      status: 200,
    };
  }

  async getSignalById(signal_id: number) {
    const signal = await this.signalRepository.findOne({
      where: { signal_id },
      relations: ['user'],
    });
    if (!signal) {
      return {
        message: 'Signalement non trouvé',
        status: 404,
      };
    }

    return {
      message: 'Résultat du Signalement',
      status: 200,
      data: {
        ...signal,
        pseudo: signal?.anonyme
          ? 'Anonyme'
          : signal?.user?.pseudo || null,
      },
    };
  }

  async updateSignal(signal_id: number,updateSignalDto: UpdateSignalDto,fichier?: Express.Multer.File,
  ): Promise<any> {
    if (fichier) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(fichier);
        updateSignalDto.picture = uploadResult.secure_url; 
      } catch (error) {
        console.error("Erreur lors de l'envoi du fichier sur Cloudinary:", error);
        throw new NotFoundException("Erreur lors de l'envoi du fichier");
      }
    }

    const result = await this.signalRepository.update(signal_id, updateSignalDto);
    if (result.affected === 0) {
      return null;
    }

    const updatedSignal = await this.signalRepository.findOne({ where: { signal_id } });
    
    return {
      message: "Signalement mis à jour",
      status: 200,
      data: updatedSignal,
    };
  }

  async deleteSignal(signal_id: number): Promise<{ message: string, status: number, data: any }> {
    const result = await this.signalRepository.findOne({ where: { signal_id } });
    if (!result) {
      return {
        message: 'Reporting Not found',
        status: 404,
        data: null,
      };
    }
    await this.signalRepository.delete(signal_id);

    return {
      message: 'Delete of reporting is successful',
      status: 200,
      data: {
        signal_id: signal_id, // Correction de l'erreur TypeScript (nom de variable au lieu de "number")
        delete_at: new Date().toISOString()
      }
    };
  }
}