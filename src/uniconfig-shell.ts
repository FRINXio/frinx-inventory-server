import { Config, NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

const config: Config = {
  host: '10.19.0.12',
  port: 2022,
  username: 'admin',
  password: 'admin',
};

// eventuallly websocket will be an input parameter of this function
export const initSSH = async (/* ws */) => {
  await ssh.connect(config);
  const shellStream = await ssh.requestShell();

  // this is just for testing purposes
  // some snippet like below should be used send websocket messages
  shellStream.write('show\n');

  // we can listen to websocket messages and send them to ssh shell
  //   ws.on('message', (data) => {
  //     shellStream.write(data.trim() + '\n');
  //   });

  shellStream.on('data', (data: Buffer) => {
    console.log(data.toString());
  });

  shellStream.stderr.on('data', (data) => {
    console.log(data);
  });
};
