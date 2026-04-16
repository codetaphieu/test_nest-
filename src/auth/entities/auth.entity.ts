import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Auth {

  @Column({default: 'name'})
  username!: string;

  @Column({default: 'password123'})
  password!: string;
}