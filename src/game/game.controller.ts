import { Controller, Get, Headers, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER,  } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
@Controller('game')
export class GameController {
  constructor(
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  @Get('state')
  async getGameState(@Headers('authorization') authHeader: string) {
    // 1. Kiểm tra định dạng Header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Không tìm thấy token hợp lệ trong header');
    }

    // 2. Lấy token thực tế
    const token = authHeader.split(' ')[1];
    
    // Kiểm tra các trường hợp token rác từ localStorage
    if (!token || token === 'null' || token === 'undefined') {
      throw new UnauthorizedException('Token không hợp lệ hoặc bị trống');
    }

    try {
      // 3. Giải mã JWT
      const payload = this.jwtService.verify(token);
      const userId = payload.username; // Lấy username làm key để tìm save game

      // 4. Truy xuất dữ liệu từ Redis
      const rawData = await this.cacheManager.get(`save_game:${userId}`);
      
      // Nếu có dữ liệu trong Redis, trả về ngay
      if (rawData) {
        return typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      }

      // 5. Nếu chưa có dữ liệu (Người chơi mới), trả về bộ thẻ khởi tạo mặc định
      // Việc này giúp tránh lỗi "màn hình xanh" ở Frontend khi user mới vào lần đầu
      const defaultState = {
        gold: 10,
        cards: [
          { id: 1, name: 'Nông dân', type: 'person', x: 100, y: 100 },
          { id: 2, name: 'Bụi chuối', type: 'resource', x: 250, y: 100 }
        ]
      };

      // Lưu luôn bộ mặc định này vào Redis cho lần sau
      await this.cacheManager.set(`save_game:${userId}`, JSON.stringify(defaultState), 0);
      
      return defaultState;

    } catch (error) {
      // Bắt các lỗi như: Token hết hạn, Token bị sửa đổi (malformed)
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('JWT Verify Error:', errorMessage);
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ, vui lòng thử lại');
    }
  }
}