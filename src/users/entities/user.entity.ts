import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { GameRoom } from '../../game/entities/game-room.entity';
import { GameRoomPlayer } from '../../game/entities/game-room-player.entity';

@Entity()
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '', unique: true })
  email: string;

  @Column({ default: '', unique: true })
  username: string;

  @Column({ default: '' })
  password: string;

  @Column({ default: 50 })
  gold: number;

  @Column({ type: 'text', nullable: true })
  cards: string;

  @OneToMany(() => GameRoom, room => room.owner)
  ownedGameRooms: GameRoom[];

  @OneToMany(() => GameRoomPlayer, player => player.user)
  gameRoomPlayers: GameRoomPlayer[];
}
