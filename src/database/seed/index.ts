
import dataSource from '../data-source';
import { userSeed } from './user.seed';

async function run() {
  await dataSource.initialize();

  console.log('Database connected');

  await userSeed(dataSource);

  await dataSource.destroy();

  console.log('Seed completed');
}

run();