import join from 'url-join';
import config from '../config';

export function makeUniconfigURL(zoneName: string): string {
  return join([`${config.uniconfigApiProtocol}://`, `${zoneName}:${config.uniconfigApiPort}`]);
}
