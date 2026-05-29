import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GameRoom } from './game-room.entity';

export type GameRoomPlayerRole = 'owner' | 'player' | 'spectator';

@Entity('game_room_players')
@Index(['roomId', 'userId'], { unique: true })
export class GameRoomPlayer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    roomId: string;

    @ManyToOne(() => GameRoom, room => room.players, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roomId' })
    room: GameRoom;

    @Column()
    userId: string;

    @ManyToOne(() => User, user => user.gameRoomPlayers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'varchar', length: 20, default: 'player' })
    role: GameRoomPlayerRole;

    @CreateDateColumn()
    joinedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    leftAt?: Date | null;
}
