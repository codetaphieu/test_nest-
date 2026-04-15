import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module'; // <--- Thêm dòng này

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '', // Điền mật khẩu MySQL của bạn vào .env
      database: process.env.DB_NAME || 'testdb', // Đảm bảo bạn đã tạo database tên 'testdb'
      autoLoadEntities: true,
      // Khi phát triển game Làng Việt, hãy để true để nó tự tạo cột 'gold' và 'cards'
      synchronize: true, 
    }),
    UsersModule,
    AuthModule,
    GameModule, // <--- Kích hoạt logic game tại đây
  ],
})
export class AppModule {}