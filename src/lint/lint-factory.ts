import { Configuration, Linter, LintResult } from 'tslint';
import { Program } from 'typescript';
import { BuildContext } from '../util/interfaces';
import { getTsConfigPath } from '../transpile';


/**
 * Run linter on a file
 * @param {BuildContext} context
 * @param {string} configFile
 * @param {string} filePath
 * @param {string} fileContents
 * @return {LintResult}
 */
export function lint(context: BuildContext, configFile: string, filePath: string, fileContents: string): LintResult {
  const linter = getLinter(context);
  const configuration = Configuration.findConfiguration(configFile, filePath);
  linter.lint(filePath, fileContents, configuration.results);
  return linter.getResult();
}


/**
 * Create a TS program based on the BuildContext {srcDir} and TS config file path
 * @param {BuildContext} context
 * @return {Program}
 */
export function createProgram(context: BuildContext): Program {
  const tsconfig = getTsConfigPath(context);
  return Linter.createProgram(tsconfig, context.srcDir);
}


/**
 * Get all files that are sourced in TS config
 * @param {BuildContext} context
 * @return {Array<string>}
 */
export function getFileNames(context: BuildContext): string[] {
  const program = createProgram(context);
  return Linter.getFileNames(program);
}


/**
 * Get linter
 * @param {BuildContext} context
 * @return {Linter}
 */
export function getLinter(context: BuildContext): Linter {
  const program = createProgram(context);

  return new Linter({
    fix: false
  }, program);
}
