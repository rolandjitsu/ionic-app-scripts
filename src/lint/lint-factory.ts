import { Configuration, Linter, LintResult } from 'tslint';
import { Program, getPreEmitDiagnostics, Diagnostic } from 'typescript';
import { BuildContext } from '../util/interfaces';
import { isObject } from 'util';


export interface LinterOptions {
  typeCheck?: boolean;
}

export interface LinterConfig {
  [key: string]: any;
}


/**
 * Lint a file according to config
 * @param {Linter} tsLintConfig
 * @param {LinterConfig} config
 * @param {string} filePath
 * @param {string} fileContents
 * @return {LintResult}
 */
export function lint(linter: Linter, config: LinterConfig, filePath: string, fileContents: string): LintResult {
  linter.lint(filePath, fileContents, config as any);
  return linter.getResult();
}


/**
 * Type check a TS program
 * @param {BuildContext} context
 * @param {string} tsConfig
 * @param {LinterOptions} linterOptions
 * @return {Promise<Diagnostic[]>}
 */
export function typeCheck(context: BuildContext, program: Program, linterOptions?: LinterOptions): Promise<Diagnostic[]> {
  if (isObject(linterOptions) && linterOptions.typeCheck) {
    return Promise.resolve(getPreEmitDiagnostics(program));
  }
  return Promise.resolve([]);
}


/**
 * Create a TS program based on the BuildContext {rootDir} or TS config file path (if provided)
 * @param {BuildContext} context
 * @param {string} tsConfig
 * @return {Program}
 */
export function createProgram(context: BuildContext, tsConfig: string): Program {
  return Linter.createProgram(tsConfig, context.rootDir);
}


/**
 * Get all files that are sourced in TS config
 * @param {BuildContext} context
 * @param {Program} program
 * @return {Array<string>}
 */
export function getFileNames(context: BuildContext, program: Program): string[] {
  return Linter.getFileNames(program);
}


/**
 * Get lint configuration
 * @param {BuildContext} context
 * @param {Program} program
 * @param {LinterOptions} linterOptions
 * @return {Linter}
 */
export function getTsLintConfig(tsLintConfig: string, linterOptions?: LinterOptions): LinterConfig {
  const config = Configuration.loadConfigurationFromPath(tsLintConfig);
  Object.assign(config, isObject(linterOptions) ? {linterOptions} : {});
  return config;
}

/**
 * Create a TS linter
 * @param {BuildContext} context
 * @param {Program} program
 * @return {Linter}
 */
export function createLinter(context: BuildContext, program: Program): Linter {
  return new Linter({
    fix: false
  }, program);
}
