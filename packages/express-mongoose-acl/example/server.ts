import initExpresss from './express-server';
import createServer from './create-server';

const dev = process.env.NODE_ENV !== 'production';

async function main() {
  const expressServer = await initExpresss();
  createServer(expressServer);
}

main();
