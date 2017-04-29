import { Logger } from '../logger/logger';
import { getProjectJson } from '../util/ionic-project';
import { ServeConfig } from './serve-config';
import * as mdns from 'mdns';

export function createBonjourService(config: ServeConfig) {
  if (config.noBonjour) {
    return;
  }
  getProjectJson()
    .then(project => project.name)
    .catch(() => 'ionic-app-scripts')
    .then(projectName => {
      Logger.info(`publishing bonjour service`);
      const ad = mdns.createAdvertisement(mdns.tcp('ionicdev'), config.httpPort, {
        name: projectName,
      });
      ad.start();
    });
}
