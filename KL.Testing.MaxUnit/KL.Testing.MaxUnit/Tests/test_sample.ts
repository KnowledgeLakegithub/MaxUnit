/// <reference path="../maxUnit.ts" />

class test_sample extends maxUnit.TestClassBase {
    constructor() {
        //give test suite a name
        super('test_sample');

        //add test by name
        this.AddTest('sample_expectation', 'Sample Test with expectation');
        this.AddTest('sample_expectation_failing', 'Sample Failing Test with expectation');

        //requirejs will load modules in test_sample_context context instead of _
        //this allows you to 
        //override modules in test context
        //per test
        this.addOverride('jquery', {});
    }
    setUpAsync(dfdSetup: JQueryDeferred<any>) {
        var cb = super.setUpAsync;

        //require(['kl.webindex.dev'], () => {
        //    require(['application/webindex/commands/releasebatchcommand'], (control) => {
        //        this._ReleaseBatchCommand = control;
        //        cb(dfdSetup);
        //    });
        //});
        //example above
        //asynchronously setup the test
        setTimeout(() => {
            cb(dfdSetup);
        }, 200);
    }
    tearDown() {
        super.tearDown();
    }

    sample_expectation() {
        //arrange
        var fn = (x) => x + 3;

        //act
        var res = fn(3);

        //assert
        this.Assert.AreIdentical(6, res, "Should have had 6");
    }
    sample_expectation_failing() {
        //arrange
        var fn = (x) => x + 3;

        //act
        var res = fn(3);

        //assert
        this.Assert.AreIdentical(7, res, "Should have had 7");
    }
}

export = test_sample;