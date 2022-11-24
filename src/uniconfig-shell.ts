import { Config, NodeSSH } from 'node-ssh';
import { ClientChannel } from 'ssh2';

const ssh = new NodeSSH();

const config: Config = {
  host: '10.19.0.12',
  port: 2022,
  username: 'admin',
  password: 'admin',
};

function* streamAdapter(stream: ClientChannel, input: string | null): Generator<string> {
  let done = false;
  stream.on('exit', () => {
    done = true;
  });

  stream.write(input);

  while (!done) {
    yield new Promise((resolve, reject) => {
      stream.once('data', resolve);
      stream.once('error', reject);
    });
  }
}

// eventuallly websocket will be an input parameter of this function
export async function* initSSH(input: string | null): AsyncGenerator<string> {
  await ssh.connect(config);
  const shellStream = await ssh.requestShell();

  yield* streamAdapter(shellStream, input);
}
