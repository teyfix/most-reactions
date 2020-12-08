import {
  BaseEntity,
  DeepPartial,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  ObjectType,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { EmojiEntity } from './emoji.entity';
import { UserEntity } from './user.entity';
import { Expose, plainToClass, Type } from 'class-transformer';

@Entity()
@Index(['message', 'user', 'emoji'], { unique: true })
export class ReactionEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Type(() => MessageEntity)
  @Expose()
  @ManyToOne(() => MessageEntity, message => message._reactions)
  message: MessageEntity;

  @Type(() => EmojiEntity)
  @Expose()
  @ManyToOne(() => EmojiEntity, emoji => emoji.reactions, { onUpdate: 'CASCADE' })
  emoji: EmojiEntity;

  @Type(() => UserEntity)
  @Expose()
  @ManyToOne(() => UserEntity, user => user.reactions, { onUpdate: 'CASCADE' })
  user: UserEntity;

  @DeleteDateColumn()
  deletedAt: Date;

  static create<T extends ReactionEntity>(this: ObjectType<T>): T;
  static create<T extends ReactionEntity>(this: ObjectType<T>, entityLike: DeepPartial<T>): T;
  static create<T extends ReactionEntity>(this: ObjectType<T>, entityLikeArray: DeepPartial<T>[]): T[];
  static create(plain?: DeepPartial<ReactionEntity> | DeepPartial<ReactionEntity>[]): ReactionEntity | ReactionEntity[] {
    return plainToClass(this, plain ?? {}, { excludeExtraneousValues: true });
  }
}
