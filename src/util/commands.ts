import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { Lang } from './lang';
import { Service } from './service';
import { ChannelEntity } from '../entity/channel.entity';
import environment from '../environment';
import interpolate from '../helper/interpolate';
import ellipsis from '../helper/ellipsis';

export enum PageAction {
  First = '⏮',
  Prev = '⏪',
  Refresh = '🔄',
  Next = '⏩',
  Last = '⏭',
}

const PageActionValues = [
  '⏮',
  '⏪',
  '🔄',
  '⏩',
  '⏭',
];

export class Commands {
  constructor(private readonly lang: Lang, private readonly service: Service) {
  }

  async execute(message: Message): Promise<string | Message> {
    const channel = message.channel as TextChannel;

    if (!channel.permissionsFor(message.member).has('MANAGE_CHANNELS')) {
      return 'insufficientPermissions';
    }

    const command = message.content
      .replace(new RegExp(`<@!?${ message.client.user.id }>`, 'g'), '')
      .trim()
      .toLowerCase();

    if ('' == command) {
      return 'missingCommand';
    }

    const reverse = await this.lang.reverse(command);
    const key = '__' + reverse as ('__watch' | '__unwatch' | '__list');

    if (null == reverse || !(key in this) || 'function' !== typeof this[key]) {
      return 'unknownCommand';
    }

    return this[key].call(this, channel);
  }

  async __watch(channel: TextChannel): Promise<string> {
    try {
      await this.service.watchChannel(channel);
    } catch (error) {
      return 'watchFailed';
    }

    return 'watchSucceeded';
  }

  async __unwatch(channel: TextChannel): Promise<string> {
    try {
      await this.service.unwatchChannel(channel);
    } catch (error) {
      return 'unwatchFailed';
    }

    return 'unwatchSucceeded';
  }

  async __list(channel: TextChannel): Promise<string | Message> {
    if (await ChannelEntity.findOne({ id: channel.id, watch: true })) {
      return this.paginate(null, channel);
    }

    return 'channelDeafen';
  }

  async paginate(message: Message, channel: TextChannel, action?: PageAction): Promise<string | Message> {
    const page = message ? await this.getPage(message, action) : 1;
    const embed = await this.createEmbed(channel, page);

    if (embed === -1) {
      return message;
    }

    if (message) {
      return message.edit(embed);
    }

    const reply = await channel.send(embed);

    for (const emoji of PageActionValues) {
      await reply.react(emoji);
    }

    return reply;
  }

  private async getPage(message: Message, action: PageAction): Promise<number> {
    if (!message.embeds?.length) {
      throw new Error('Message does not contain any embed');
    }

    const [{ title }] = message.embeds;
    const match = title.match(/(?<=\()\d+(?=\/)|(?<=\/)\d+(?=\))/g);

    if (null == match) {
      throw new Error('Message does not contain any page metadata');
    }

    const [current, last] = match.map(item => parseInt(item, 10));

    switch (action) {
      case PageAction.First:
        return 1;

      case PageAction.Prev:
        return current - 1;

      case PageAction.Refresh:
        return current;

      case PageAction.Next:
        return current + 1;

      case PageAction.Last:
        return last;
    }

    throw new Error('Unknown page action');
  }

  private async createEmbed(channel: TextChannel, current: number, perPage = 25): Promise<-1 | MessageEmbed> {
    const [result, author, [title, countStr, madeBy]] = await Promise.all([
      this.service.getReactionInfo(channel),
      channel.client.users.fetch(environment.author),
      this.lang.translate('mostReacted', 'reactionCount', 'madeBy'),
    ]);
    const total = Math.ceil(result.length / perPage);

    if (!result.length || current < 1 || current > total) {
      return -1;
    }

    const skip = (current - 1) * perPage;

    return new MessageEmbed({
      title: interpolate(title, { current, total }),
      fields: result.slice(skip, skip + perPage).map(({ id, content, count }) => ({
        name: interpolate(countStr, { count }),
        value: `[${ ellipsis(content) }](https://discord.com/channels/${ channel.guild.id }/${ channel.id }/${ id })`,
        // inline: true,
      })),
      footer: {
        text: interpolate(madeBy, { author: author.tag }),
        iconURL: author.avatarURL(),
      },
    });
  }
}
