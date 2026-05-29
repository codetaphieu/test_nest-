import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameRoomPlayer } from './game-room-player.entity';

export type GameRoomStatus = 'waiting' | 'playing' | 'ended';

@Entity('game_rooms')
export class GameRoom {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    ownerUserId: string;

    @ManyToOne(() => User, user => user.ownedGameRooms, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ownerUserId' })
    owner: User;

    @Column({ type: 'varchar', length: 20, default: 'playing' })
    status: GameRoomStatus;

    @Column({ type: 'longtext' })
    stateJson: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => GameRoomPlayer, player => player.room)
    players: GameRoomPlayer[];
}
