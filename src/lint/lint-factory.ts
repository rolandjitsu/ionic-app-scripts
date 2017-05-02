import { Configuration, Linter, LintResult } from 'tslint';
import { Program } from 'typescript';

export function createProgram(configFile: string, projectDirectory: string) {
  return Linter.createProgram(configFile, projectDirectory);
}

export function getFileNames(program: Program) {
  return Linter.getFileNames(program);
}

export function getConfiguration(filePath: string) {
  return Configuration.findConfiguration(null, filePath);
}

export function getLintResult(linter: Linter): LintResult {
  return linter.getResult();
}
export function getLinter(program: Program) {
  return new Linter({
    fix: false
  }, program);
}
