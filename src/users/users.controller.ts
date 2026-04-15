import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto'; // Lưu ý: Bạn nên sửa 'cerate' thành 'create'
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('users') // Thêm tag để dễ quản lý trong Swagger
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả nông dân' })
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Đăng ký cư dân mới (Khởi nghiệp)' })
  @ApiBody({ type: CreateUserDto })
  // Mở cổng tự do: Không dùng @UseGuards để nông dân mới có thể đăng ký tài khoản
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('oi')
  @ApiOperation({ summary: 'Lấy ID của nông dân đang đăng nhập' })
  @UseGuards(JwtAuthGuard)
  getId(@Req() req) {
    // req.user thường được trả về từ JwtStrategy sau khi xác thực thành công
    return req.user.userId;
  }
}