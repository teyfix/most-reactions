import environment from '../environment';
import { join, resolve } from 'path';
import { readdir, readFile } from 'fs/promises';
import escapeRegExp from '../helper/escape-regexp';
import { parse } from 'yaml';
import propName from '../helper/prop-name';

type Dict = Record<string, string>

export class Lang {
  private _dict?: Dict;
  private readonly code: string;

  constructor(lang?: string) {
    this.code = lang ?? environment.lang.current;
  }

  static load(code: string): Promise<Dict> {
    const dir = resolve(process.cwd(), 'lang');

    return readdir(dir)
      .then(files => {
        const pattern = new RegExp('^' + escapeRegExp(code) + '\.ya?ml$');
        const file = files.find(item => pattern.test(item));

        if (null == file) {
          throw new Error(`Could not find dictionary for ${ code }`);
        }

        return readFile(join(dir, file), 'utf-8');
      })
      .then(parse)
      .then(content => {
        if ('then' in content) {
          throw new Error(`${ code } contains reserved key "then"`);
        }

        return new Proxy(content, {
          get: (t, p): string => {
            if ('then' === p) {
              return t[p];
            }

            if (p in t) {
              if ('string' === typeof t[p]) {
                return t[p];
              }

              throw new TypeError(`${ code }${ propName(p) } is not a string`);
            }

            throw new Error(`${ code }${ propName(p) } does not exist`);
          },
        });
      });
  }

  async translate(key: string): Promise<string>;
  async translate(...keys: string[]): Promise<string>;
  async translate(...params: string[]): Promise<string | string[]> {
    const input = params.length > 1 ? params : params[0];
    const dict = await this.dict();

    if (input instanceof Array) {
      return input.map(item => dict[item]);
    }

    return dict[input];
  }

  async reverse(value: string): Promise<string> {
    const match = Object.entries(await this.dict()).find(([_, locale]) => value === locale.toLowerCase());

    if (null == match) {
      return null;
    }

    return match[0];
  }

  async dict(): Promise<Dict> {
    return this._dict ??= await Lang.load(this.code);
  }
}
