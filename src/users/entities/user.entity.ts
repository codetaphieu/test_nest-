import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({default: '', unique: true})
  email: string;

  @Column({default: '', unique: true})
  username: string;

  @Column({default: ''})
  password: string;
}