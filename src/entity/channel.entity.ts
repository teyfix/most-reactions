import { Document } from './util/document';
import { Column, Entity, OneToMany } from 'typeorm';
import { MessageEntity } from './message.entity';
import { Expose } from 'class-transformer';


@Entity()
export class ChannelEntity extends Document {
  @Expose()
  @Column()
  name: string;

  @Expose()
  @Column()
  watch: boolean;

  @OneToMany(() => MessageEntity, message => message.channel, { onDelete: 'CASCADE' })
  _messages?: MessageEntity[];
}
