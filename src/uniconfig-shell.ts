import { Config, NodeSSH } from 'node-ssh';
import { ClientChannel } from 'ssh2';

const config: Config = {
  host: process.env.SHELL_HOST || '10.19.0.12',
  port: 2022,
  username: 'admin',
  password: 'admin',
};

class SSHClient {
  requestShell: ClientChannel | null = null;

  done = false;

  ssh: NodeSSH = new NodeSSH();

  *streamAdapter(stream: ClientChannel, input: string | null): Generator<string> {
    stream.on('exit', () => {
      this.done = true;
    });

    stream.write(input);

    while (!this.done) {
      // TODO: FIX TYPES
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      yield new Promise((resolve, reject) => {
        stream.once('data', (data: Buffer) => resolve(data.toString()));
        stream.once('error', (error: string) => reject(error));
      });
    }
  }

  async *initSSH(input: string | null): AsyncGenerator<string> {
    if (!this.ssh.isConnected()) {
      await this.ssh.connect(config);
    }
    if (this.requestShell == null) {
      this.requestShell = await this.ssh.requestShell();
    }
    yield* this.streamAdapter(this.requestShell, input);
  }
}

export const sshClient = new SSHClient();
