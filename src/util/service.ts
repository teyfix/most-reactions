import {
  Collection,
  GuildEmoji,
  Message,
  MessageReaction,
  PartialMessage,
  PartialUser,
  ReactionEmoji,
  Snowflake,
  User,
} from 'discord.js';
import { ChannelEntity } from '../entity/channel.entity';
import { MessageEntity } from '../entity/message.entity';
import { ReactionEntity } from '../entity/reaction.entity';
import { EmojiEntity } from '../entity/emoji.entity';
import { Connection } from 'typeorm';
import { App } from '../app';
import { UserEntity } from '../entity/user.entity';
import { readFile } from 'fs/promises';
import { resolve } from 'path';


interface RawItem {
  id: Snowflake;
  content: string;
  count: number;
}

export interface ReactionInfo {
  url: string;
  count: number;
  content: string;
}

export class Service {
  private _queries: Record<string, string> = {};

  constructor(private readonly connection: Connection) {
  }

  async saveChannel(channel: Message['channel'], watch: boolean): Promise<void> {
    await this.connection
      .createQueryBuilder()
      .insert()
      .into(ChannelEntity)
      .values(
        ChannelEntity.create({ ...channel, watch }),
      )
      .orUpdate({ conflict_target: ['id'], overwrite: ['watch'] })
      .execute();
  }

  async watchChannel(channel: Message['channel']): Promise<void> {
    await this.saveChannel(channel, true);
  }

  async unwatchChannel(channel: Message['channel']): Promise<void> {
    await this.saveChannel(channel, false);
  }

  async deleteChannel(channel: Message['channel']): Promise<void> {
    await ChannelEntity.create(channel).softRemove();
  }

  async saveEmoji(emoji: GuildEmoji | ReactionEmoji): Promise<void> {
    await this.connection
      .createQueryBuilder()
      .insert()
      .into(EmojiEntity)
      .values(
        EmojiEntity.create(emoji),
      )
      .orUpdate({ conflict_target: ['id'], overwrite: ['url', 'name'] })
      .execute();
  }

  async saveUser(user: User | PartialUser): Promise<void> {
    await this.connection
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values(
        UserEntity.create(user),
      )
      .orUpdate({ conflict_target: ['id'], overwrite: ['username', 'discriminator'] })
      .execute();
  }

  async deleteEmoji(emoji: GuildEmoji): Promise<void> {
    await this.connection
      .createQueryBuilder()
      .softDelete()
      .from(EmojiEntity, 'emoji')
      .where('emoji.id = :id', { id: emoji.id ?? emoji.name })
      .execute();
  }

  async saveMessage(message: Message): Promise<void> {
    if (await ChannelEntity.count({ id: message.channel.id, watch: true })) {
      await this.connection
        .createQueryBuilder()
        .insert()
        .into(MessageEntity)
        .values(
          MessageEntity.create(message),
        )
        .orIgnore()
        .execute();
    }
  }

  async deleteMessage(message: Message | PartialMessage): Promise<void> {
    await MessageEntity.create(message).softRemove();
  }

  async deleteMessages(messages: Snowflake[] | Collection<Snowflake, Message | PartialMessage>): Promise<void> {
    if (messages instanceof Collection) {
      messages = messages.filter(message => App.checkMessage(message)).map(message => message.id);
    }

    await this.connection
      .createQueryBuilder()
      .softDelete()
      .from(MessageEntity, 'message')
      .where('message.id IN (:messages)', { messages })
      .execute();
  }

  async addMessageReaction({ emoji, message }: MessageReaction, user: User | PartialUser): Promise<void> {
    if (await MessageEntity.findOne(message.id)) {
      await this.saveUser(user);
      await this.saveEmoji(emoji);

      await ReactionEntity.create({ emoji, message, user }).save();
    }
  }

  async removeReaction(message: Message | PartialMessage): Promise<void>;
  async removeReaction(reaction: MessageReaction, user?: User | PartialUser): Promise<void>;
  async removeReaction(first: Message | PartialMessage | MessageReaction, user?: User | PartialUser): Promise<void> {
    let query = this.connection
      .getRepository(ReactionEntity)
      .createQueryBuilder('r')
      .softDelete();

    if ('emoji' in first) {
      query = query
        .where('emojiId = :emoji', { emoji: first.emoji.id ?? first.emoji.name })
        .andWhere('messageId = :message', { message: first.message.id });

      if (user) {
        query = query.andWhere('userId = :user', { user: user.id });
      }
    } else {
      query = query.where('messageId = :message', { message: first.id });
    }

    await query.execute();
  }

  async getReactionInfo(channel: Message['channel']): Promise<RawItem[]> {
    return this.sql('getReactionInfo').then(sql => {
      return this.connection.query(sql, [channel.id]);
    });
  }

  private async sql(filename: string): Promise<string> {
    return this._queries[filename] ??= await readFile(
      resolve(process.cwd(), 'res', 'sql', filename + '.sql'),
      'utf-8',
    );
  }
}
