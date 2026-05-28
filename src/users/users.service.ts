import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Tìm kiếm cư dân theo Email (dùng cho Login)
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // MỚI: Tìm kiếm cư dân theo ID (dùng cho Socket Gateway)
  async findById(id: any): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  // Lấy danh sách toàn bộ cư dân
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // Logic "Khởi nghiệp": Tặng 50 vàng và thẻ bài đầu tiên
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = await this.findByEmail(createUserDto.email);
    if (newUser) {
      throw new Error('Email đã tồn tại');
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
    });
    return this.userRepository.save(user);
  }

  // Cập nhật vị trí thẻ bài
  // async updateCardPosition(userId: string, cardId: number, newX: number, newY: number) {
  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   if (!user || !user.cards) return;

  //   let cards = typeof user.cards === 'string' ? JSON.parse(user.cards) : user.cards;
  //   const cardIndex = cards.findIndex((c: any) => c.id === cardId);

  //   if (cardIndex !== -1) {
  //     cards[cardIndex].position = { x: newX, y: newY };
  //     user.cards = JSON.stringify(cards);
  //     await this.userRepository.save(user);
  //   }
  // }

  // // Lưu lại trạng thái toàn bộ ngôi làng
  // async saveVillageState(userId: string, currentCards: any[]) {
  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   if (user) {
  //     user.cards = JSON.stringify(currentCards);
  //     await this.userRepository.save(user);
  //   }
  // }
}