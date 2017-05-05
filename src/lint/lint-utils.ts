import * as fs from 'fs';
import { LintResult, RuleFailure } from 'tslint';
import { BuildError } from '../util/errors';
import { lint } from './lint-factory';
import { readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { Logger } from '../logger/logger';
import { printDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTsLintDiagnostics } from '../logger/logger-tslint';


/**
 * Lint files
 * @param {BuildContext} context
 * @param {string|null} configFile - TSLint config file path
 * @param {Array<string>} filePaths
 */
export function lintFiles(context: BuildContext, configFile: string | null, filePaths: string[]): Promise<void> {
  return Promise.all(filePaths.map(filePath => lintFile(context, configFile, filePath)))
    .then((lintResults: LintResult[]) => processLintResults(context, lintResults));
}
export function lintFile(context: BuildContext, configFile: string | null, filePath: string): Promise<LintResult> {
  if (isMpegFile(filePath)) {
    return Promise.reject(`${filePath} is not a valid TypeScript file`);
  }
  return readFileAsync(filePath)
    .then((fileContents: string) => lint(context, configFile, filePath, fileContents));
}


/**
 * Process lint results
 * NOTE: This will throw a BuildError if there were any warnings or errors in any of the lint results.
 * @param {BuildContext} context
 * @param {Array<LintResult>} results
 */
export function processLintResults(context: BuildContext, results: LintResult[]) {
  const filesThatDidNotPass: string[] = [];

  for (const result of results) {
    // Only process result if there are no errors or warnings
    if (result.errorCount !== 0 || result.warningCount !== 0) {
      const diagnostics = runTsLintDiagnostics(context, result.failures);
      printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);

      // Only add new file entries if not already there
      for (const fileName of getFileNames(context, result.failures)) {
        if (filesThatDidNotPass.indexOf(fileName) === -1) {
          filesThatDidNotPass.push(fileName);
        }
      }
    }
  }

  if (filesThatDidNotPass.length > 0) {
    const errorMsg = generateFormattedErrorMsg(filesThatDidNotPass);
    throw new BuildError(errorMsg);
  }
}


function generateFormattedErrorMsg(failingFiles: string[]) {
  return `The following files did not pass tslint: \n${failingFiles.join('\n')}`;
}

function getFileNames(context: BuildContext, failures: RuleFailure[]): string[] {
  return failures.map(failure => failure.getFileName()
    .replace(context.rootDir, '')
    .replace(/^\//g, ''));
}

function isMpegFile(file: string) {
  const buffer = new Buffer(256);
  buffer.fill(0);

  const fd = fs.openSync(file, 'r');
  try {
    fs.readSync(fd, buffer, 0, 256, null);
    if (buffer.readInt8(0) === 0x47 && buffer.readInt8(188) === 0x47) {
      Logger.debug(`tslint: ${file}: ignoring MPEG transport stream`);
      return true;
    }
  } finally {
    fs.closeSync(fd);
  }
  return false;
}
