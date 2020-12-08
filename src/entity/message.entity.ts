import { Document } from './util/document';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { ChannelEntity } from './channel.entity';
import { ReactionEntity } from './reaction.entity';
import { Expose, Type } from 'class-transformer';

@Entity()
export class MessageEntity extends Document {
  @Expose()
  @Column()
  content: string;

  @Expose()
  @Column()
  createdAt: Date;

  @Type(() => ChannelEntity)
  @Expose()
  @ManyToOne(() => ChannelEntity, channel => channel._messages)
  channel: ChannelEntity;

  @OneToMany(() => ReactionEntity, messageReaction => messageReaction.message, { onDelete: 'CASCADE' })
  _reactions: ReactionEntity[];
}
