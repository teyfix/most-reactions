import {
  Channel,
  ClientEvents,
  Collection,
  GuildEmoji,
  GuildMember,
  Message,
  MessageReaction,
  PartialDMChannel,
  PartialMessage,
  PartialUser,
  TextChannel,
  User,
} from 'discord.js';
import { Service } from './util/service';
import { Commands, PageAction } from './util/commands';
import { Lang } from './util/lang';

type A = Pick<ClientEvents,
  'message'
  | 'messageDelete'
  | 'messageReactionRemoveAll'
  | 'messageReactionRemoveEmoji'
  | 'messageDeleteBulk'
  | 'messageReactionAdd'
  | 'messageReactionRemove'
  | 'emojiUpdate'
  | 'emojiDelete'
  | 'channelDelete'>;
type B = { [K in keyof A]: (...args: A[K]) => void; };

export class App implements B {
  constructor(
    private readonly lang: Lang,
    private readonly service: Service,
    private readonly commands: Commands,
  ) {
    for (const _ in this) {
      const key = _ as keyof this;
      const method = this[key];

      if ('function' === typeof method) {
        this[key] = method.bind(this);
      }
    }
  }

  static checkMessage(message: Message | PartialMessage): boolean {
    return (
      message.member instanceof GuildMember &&
      message.member.id !== message.client.user.id &&
      message.channel instanceof TextChannel
    );
  }

  channelDelete(channel: Channel | PartialDMChannel): void {
    if (channel instanceof TextChannel) {
      this.service.deleteChannel(channel).catch(console.error);
    }
  }

  emojiUpdate(_: any, after: GuildEmoji): void {
    this.service.saveEmoji(after).catch(console.error);
  }

  emojiDelete(emoji: GuildEmoji): void {
    this.service.deleteEmoji(emoji).catch(console.error);
  }

  async message(message: Message): Promise<void> {
    if (App.checkMessage(message)) {
      if (message.mentions.has(message.client.user)) {
        let result = await this.commands.execute(message);

        if ('string' === typeof result) {
          try {
            result = await this.lang.translate(result);
          } catch (err) {
            // response string is not in dictionary
            console.warn(err);
          }
        }

        if ('string' === typeof result) {
          await message.channel.send(result);
        }
      } else if (message.content) {
        this.service.saveMessage(message).catch(console.error);
      }
    }
  }

  messageDelete(message: Message | PartialMessage): void {
    if (App.checkMessage(message)) {
      this.service.deleteMessage(message).catch(console.error);
    }
  }

  messageDeleteBulk(messages: Collection<string, Message | PartialMessage>): void {
    this.service.deleteMessages(messages).catch(console.error);
  }

  messageReactionAdd(reaction: MessageReaction, user: User | PartialUser): void {
    reaction.users.fetch().then(async users => {
      if (users.has(reaction.client.user.id)) {
        await this.commands.paginate(
          reaction.message,
          reaction.message.channel as TextChannel,
          reaction.emoji.name as PageAction,
        );
      } else if (App.checkMessage(reaction.message)) {
        await this.service.addMessageReaction(reaction, user);
      }
    }).catch(console.error);
  }

  messageReactionRemove(reaction: MessageReaction, user: User | PartialUser): void {
    reaction.users.fetch().then(async users => {
      if (users.has(reaction.client.user.id)) {
        await this.commands.paginate(
          reaction.message,
          reaction.message.channel as TextChannel,
          reaction.emoji.name as PageAction,
        );
      } else if (App.checkMessage(reaction.message)) {
        await this.service.removeReaction(reaction, user);
      }
    }).catch(console.error);
  }

  messageReactionRemoveEmoji(reaction: MessageReaction): void {
    if (App.checkMessage(reaction.message)) {
      this.service.removeReaction(reaction).catch(console.error);
    }
  }

  messageReactionRemoveAll(message: Message | PartialMessage): void {
    if (App.checkMessage(message)) {
      this.service.removeReaction(message).catch(console.error);
    }
  }
}
