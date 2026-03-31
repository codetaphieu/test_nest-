import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/cerate-user.dto';


@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }
    
    async findAll() {
        console.log('Finding all users');
        return this.userRepository.find();
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({...createUserDto});
        return this.userRepository.save(user);
    }

}