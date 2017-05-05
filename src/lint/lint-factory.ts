import { Configuration, Linter, LintResult } from 'tslint';
import { Program, getPreEmitDiagnostics, Diagnostic } from 'typescript';
import { BuildContext } from '../util/interfaces';
import { getTsConfigPath } from '../transpile';
import { isObject } from 'util';


export interface LinterOptions {
  typeCheck?: boolean;
}


/**
 * Run linter on a file
 * @param {BuildContext} context
 * @param {string} configFile
 * @param {string} filePath
 * @param {string} fileContents
 * @param {LinterOptions} linterOptions
 * @return {LintResult}
 */
export function lint(context: BuildContext, configFile: string, filePath: string, fileContents: string, linterOptions?: LinterOptions): LintResult {
  const linter = getLinter(context);
  const configuration = Configuration.findConfiguration(configFile, filePath);
  linter.lint(filePath, fileContents, Object.assign(configuration.results, isObject(linterOptions) ? {linterOptions} : {}));
  return linter.getResult();
}


/**
 * Type check a TS program
 * @param {BuildContext} context
 * @param {LinterOptions} linterOptions
 * @return {Promise<Diagnostic[]>}
 */
export function typeCheck(context: BuildContext, linterOptions?: LinterOptions): Promise<Diagnostic[]> {
  if (isObject(linterOptions) && linterOptions.typeCheck) {
    const program = createProgram(context);
    return Promise.resolve(getPreEmitDiagnostics(program));
  }
  return Promise.resolve([]);
}


/**
 * Create a TS program based on the BuildContext {srcDir} and TS config file path
 * @param {BuildContext} context
 * @return {Program}
 */
export function createProgram(context: BuildContext): Program {
  const tsconfig = getTsConfigPath(context);
  return Linter.createProgram(tsconfig, context.rootDir);
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
