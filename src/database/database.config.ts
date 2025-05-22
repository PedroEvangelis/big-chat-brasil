import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mysecretpassword',
  database: process.env.DB_DATABASE || 'my_database',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // process.env.MODE === 'DEV',
  migrationsRun: true,
};
