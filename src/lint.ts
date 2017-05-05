import { access } from 'fs';
import { join } from 'path';

import { lintFiles } from './lint/lint-utils';
import { getFileNames } from './lint/lint-factory';
import { Logger } from './logger/logger';
import { getUserConfigFile } from './util/config';
import { ENV_BAIL_ON_LINT_ERROR, ENV_TYPE_CHECK_ON_LINT } from './util/constants';
import { BuildError } from './util/errors';
import { getBooleanPropertyValue } from './util/helpers';
import { BuildContext, ChangedFile, TaskInfo } from './util/interfaces';
import { runWorker } from './worker-client';


export interface LintWorkerConfig {
  configFile: string;
  filePaths: string[];
}


const taskInfo: TaskInfo = {
  fullArg: '--tslint',
  shortArg: '-i',
  envVar: 'ionic_tslint',
  packageConfig: 'IONIC_TSLINT',
  defaultConfigFile: '../tslint'
};


export function lint(context: BuildContext, configFile?: string) {
  const logger = new Logger('lint');
  return runWorker('lint', 'lintWorker', context, configFile)
    .then(() => {
      logger.finish();
    })
    .catch((err: Error) => {
      if (getBooleanPropertyValue(ENV_BAIL_ON_LINT_ERROR)) {
        throw logger.fail(new BuildError(err));
      }
      logger.finish();
    });
}

export function lintWorker(context: BuildContext, configFile: string) {
  return getLintConfig(context, configFile)
    .then(configFile => lintApp(context, configFile));
}


export function lintUpdate(changedFiles: ChangedFile[], context: BuildContext) {
  const changedTypescriptFiles = changedFiles.filter(changedFile => changedFile.ext === '.ts');
  const workerConfig: LintWorkerConfig = {
    filePaths: changedTypescriptFiles.map(changedTypescriptFile => changedTypescriptFile.filePath),
    configFile: getUserConfigFile(context, taskInfo, null)
  };
  return runWorker('lint', 'lintUpdateWorker', context, workerConfig);
}

export function lintUpdateWorker(context: BuildContext, workerConfig: LintWorkerConfig) {
  return getLintConfig(context, workerConfig.configFile)
    .then(configFile => lintFiles(context, configFile, workerConfig.filePaths, {typeCheck: getBooleanPropertyValue(ENV_TYPE_CHECK_ON_LINT)}))
    // Don't throw if linting failed
    .catch(() => {});
}


function lintApp(context: BuildContext, configFile: string | null) {
  const files = getFileNames(context);
  return lintFiles(context, configFile, files, {typeCheck: getBooleanPropertyValue(ENV_TYPE_CHECK_ON_LINT)});
}


function getLintConfig(context: BuildContext, configFile: string): Promise<string> {
  return new Promise((resolve, reject) => {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    if (!configFile) {
      configFile = join(context.rootDir, 'tslint.json');
    }

    Logger.debug(`tslint config: ${configFile}`);

    access(configFile, (err: Error) => {
      if (err) {
        // if the tslint.json file cannot be found that's fine, the
        // dev may not want to run tslint at all and to do that they
        // just don't have the file
        reject(err);
        return;
      }
      resolve(configFile);
    });
  });
}
