import { Test, TestingModule } from '@nestjs/testing';
import { SignalController } from './signal.controller';
import { SignalService } from './signal.service';

describe('SignalController', () => {
  let controller: SignalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [SignalService],
    }).compile();

    controller = module.get<SignalController>(SignalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
