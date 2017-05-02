import * as fs from 'fs';
import { Program } from 'typescript';
import { LintResult } from 'tslint';
import { BuildError } from '../util/errors';
import { getLinter, getConfiguration, getLintResult } from './lint-factory';
import { readFileAsync } from '../util/helpers';
import { BuildContext } from '../util/interfaces';
import { Logger } from '../logger/logger';
import { printDiagnostics, DiagnosticsType } from '../logger/logger-diagnostics';
import { runTsLintDiagnostics } from '../logger/logger-tslint';


export function lintFile(program: Program, filePath: string): Promise<LintResult> {
  return Promise.resolve()
    .then(() => {
      if (isMpegFile(filePath)) {
        throw new Error(`${filePath} is not a valid TypeScript file`);
      }
      return readFileAsync(filePath);
    })
    .then((fileContents: string) => {
      const linter = getLinter(program);
      const configuration = getConfiguration(filePath);
      linter.lint(filePath, fileContents, configuration.results);
      return getLintResult(linter);
    });
}


export function processLintResults(context: BuildContext, lintResults: LintResult[]) {
  const filesThatDidNotPass: string[] = [];
  for (const lintResult of lintResults) {
    if (lintResult.errorCount > 0) {
      const diagnostics = runTsLintDiagnostics(context, lintResult.failures);
      printDiagnostics(context, DiagnosticsType.TsLint, diagnostics, true, false);
      filesThatDidNotPass.push(...lintResult.failures.map(failure => failure.getFileName()));
    }
  }
  if (filesThatDidNotPass.length) {
    const errorMsg = generateFormattedErrorMsg(filesThatDidNotPass);
    throw new BuildError(errorMsg);
  }
}


function generateFormattedErrorMsg(failingFiles: string[]) {
  let listOfFilesString = '';
  failingFiles.forEach(file => listOfFilesString = listOfFilesString + file + '\n');
  return `The following files did not pass tslint: \n${listOfFilesString}`;
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
