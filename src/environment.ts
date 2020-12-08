import yenv from 'yenv';

interface Env {
  lang: { dir: string; current: string };
  token: string;
  author: string;
}

const file = process.env.NODE_ENV === 'dev' ? 'env.yaml' : 'env.prod.yaml';
const environment = yenv<Env>(file, { env: 'app' });

export type { Env };
export default environment;
