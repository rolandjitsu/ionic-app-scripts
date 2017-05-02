import * as fs from 'fs';
import { LintResult } from 'tslint';
import * as lintUtils from './lint-utils';
import * as lintFactory from './lint-factory';
import * as helpers from '../util/helpers';

import * as tsLintLogger from '../logger/logger-tslint';
import * as loggerDiagnostics from '../logger/logger-diagnostics';

describe('lint utils', () => {
  describe('lintFile', () => {
    it('should return lint details', () => {
      const mockConfiguration = {
        path: 'fake-path.json',
        results: {}
      };
      const mockLintResult: any = {
        errorCount: 0,
        warningCount: 0,
        failures: [],
        fixes: [],
        format: '',
        output: ''
      };
      const mockLinter = {
        lint: () => {},
        getResult: () => {
          return mockLintResult;
        }
      };
      const filePath = 'test.ts';
      const fileContent = `
        export const foo = 'bar';
      `;
      const mockProgram: any = {};
      spyOn(lintFactory, lintFactory.getConfiguration.name).and.returnValue(mockConfiguration);
      spyOn(lintFactory, lintFactory.getLinter.name).and.returnValue(mockLinter);
      spyOn(lintFactory, lintFactory.getLintResult.name).and.returnValue(mockLintResult);
      spyOn(helpers, helpers.readFileAsync.name).and.returnValue(Promise.resolve(fileContent));
      spyOn(fs, 'openSync').and.returnValue(null);
      spyOn(fs, 'readSync').and.returnValue(null);
      spyOn(fs, 'closeSync').and.returnValue(null);

      return lintUtils.lintFile(mockProgram, filePath)
        .then((result: LintResult) => {
          expect(result).toEqual(mockLintResult);
          expect(lintFactory.getConfiguration).toHaveBeenCalledWith(filePath);
          expect(lintFactory.getLinter).toHaveBeenCalledWith(mockProgram);
          expect(lintFactory.getLintResult).toHaveBeenCalledWith(mockLinter);
        });
    });
  });

  describe('processLintResults', () => {
    it('should complete when no files have an error', () => {
      lintUtils.processLintResults({}, [
        {
          errorCount: 0,
          warningCount: 0,
          failures: [],
          fixes: [],
          format: '',
          output: ''
        }
      ]);
    });

    it('should throw an error when one or more file has failures', () => {
      const knownError = new Error('Should never get here');
      spyOn(loggerDiagnostics, loggerDiagnostics.printDiagnostics.name).and.returnValue(null);
      spyOn(tsLintLogger, tsLintLogger.runTsLintDiagnostics.name).and.returnValue(null);
      const lintResults: any[] = [
        {
          errorCount: 1,
          warningCount: 0,
          failures: [
            {
              getFileName() {
                return 'test.ts';
              }
            }
          ],
          fixes: [],
          format: '',
          output: ''
        }
      ];

      try {
        lintUtils.processLintResults({}, lintResults);
        throw knownError;
      } catch (ex) {
        expect(loggerDiagnostics.printDiagnostics).toHaveBeenCalledTimes(1);
        expect(ex).not.toEqual(knownError);
        console.log(ex);
      }
    });
  });
});
