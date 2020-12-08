import { Client } from 'discord.js';
import environment from './environment';
import { resolve } from 'path';
import { createConnection } from 'typeorm';
import { ChannelEntity } from './entity/channel.entity';
import { MessageEntity } from './entity/message.entity';
import { ReactionEntity } from './entity/reaction.entity';
import { EmojiEntity } from './entity/emoji.entity';
import { UserEntity } from './entity/user.entity';
import { App } from './app';
import { Service } from './util/service';
import { Commands } from './util/commands';
import { Lang } from './util/lang';

async function bootstrap(): Promise<void> {
  const connection = await createConnection({
    type: 'sqlite',
    database: resolve(process.cwd(), 'data', 'line.sqlite'),
    entities: [
      ChannelEntity,
      MessageEntity,
      ReactionEntity,
      EmojiEntity,
      UserEntity,
    ],
    synchronize: true,
  });

  const service = new Service(connection);
  const lang = new Lang();
  const commands = new Commands(lang, service);
  const app = new App(lang, service, commands);
  const client = new Client();

  client.login(environment.token).then(() => {
    console.info('Authorized');
  }, error => {
    console.error('Authorization failed');
    console.error(error);

    process.exit(1);
  });

  client.on('ready', () => {
    console.info('Client is ready');

    client.on('channelDelete', app.channelDelete);
    client.on('emojiUpdate', app.emojiUpdate);
    client.on('emojiDelete', app.emojiDelete);
    client.on('message', app.message);
    client.on('messageDelete', app.messageDelete);
    client.on('messageReactionRemoveAll', app.messageReactionRemoveAll);
    client.on('messageReactionRemoveEmoji', app.messageReactionRemoveEmoji);
    client.on('messageDeleteBulk', app.messageDeleteBulk);
    client.on('messageReactionAdd', app.messageReactionAdd);
    client.on('messageReactionRemove', app.messageReactionRemove);
  });
}

bootstrap().catch(console.error);
