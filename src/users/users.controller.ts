import { Controller, Get, Post, Body, UseGuards, Param, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/cerate-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt.authgaurd';
import { ApiBody, ApiOperation } from '@nestjs/swagger';


@Controller('users')
export class UsersController {

  constructor(private usersService: UsersService) { }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.usersService.findAll();
  }


  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  // @UseGuards(JwtAuthGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('oi')
  @ApiOperation({ summary: 'Get user by ID' })
  @UseGuards(JwtAuthGuard)
  getId(@Req() req) {
    return req.user.userId;
  }

}

