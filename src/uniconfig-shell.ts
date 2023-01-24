import { Config, NodeSSH } from 'node-ssh';
import { ClientChannel } from 'ssh2';
import config from './config';

const shellConfig: Config = {
  host: config.shellHost,
  port: 2022,
  username: 'admin',
  password: 'admin',
};

type RequestShellMap = Map<string, ClientChannel>;

class SSHClient {
  requestShellMap: RequestShellMap = new Map();

  done = false;

  ssh: NodeSSH = new NodeSSH();

  *streamAdapter(stream: ClientChannel, input: string | null): Generator<string> {
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

  async *initSSH(uuid: string, input: string | null): AsyncGenerator<string> {
    const shell = this.requestShellMap.get(uuid);
    if (shell == null) {
      throw new Error('shell session does not exist');
    }
    yield* this.streamAdapter(shell, input);
  }

  async prepareShell(uuid: string): Promise<void> {
    if (!this.ssh.isConnected()) {
      await this.ssh.connect(shellConfig);
    }
    this.requestShellMap.set(uuid, await this.ssh.requestShell());
    this.requestShellMap.get(uuid)?.on('close', () => {
      this.requestShellMap.delete(uuid);
      this.done = true;
    });
  }
}

export const sshClient = new SSHClient();
