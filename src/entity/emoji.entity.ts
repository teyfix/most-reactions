import { Document } from './util/document';
import { Column, Entity, OneToMany } from 'typeorm';
import { ReactionEntity } from './reaction.entity';
import { Expose, Transform } from 'class-transformer';

@Entity()
export class EmojiEntity extends Document {
  @Transform((_, $) => _ ?? $.name)
  id: string;

  @Expose()
  @Column({ nullable: true })
  url: string;

  @Expose()
  @Column()
  name: string;

  @OneToMany(() => ReactionEntity, messageReaction => messageReaction.emoji, { onDelete: 'CASCADE' })
  reactions: ReactionEntity[];
}
