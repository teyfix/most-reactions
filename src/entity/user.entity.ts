import { Document } from './util/document';
import { Column, Entity, OneToMany } from 'typeorm';
import { ReactionEntity } from './reaction.entity';
import { Expose } from 'class-transformer';

@Entity()
export class UserEntity extends Document {
  @Expose()
  @Column()
  username: string;

  @Expose()
  @Column()
  discriminator: string;

  @OneToMany(() => ReactionEntity, messageReaction => messageReaction.user)
  reactions: ReactionEntity[];
}
