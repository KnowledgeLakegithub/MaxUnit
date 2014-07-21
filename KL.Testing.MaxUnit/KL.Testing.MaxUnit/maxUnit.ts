/// <reference path="Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="Scripts/typings/requirejs/require.d.ts" /> 


module maxUnit {

    export interface IAssert {
        AreIdentical(expected: any, actual: any, message: string): void;
        AreNotIdentical(a: any, b: any, message: string): void;
        IsTrue(a: boolean, message: string);
        IsFalse(a: boolean, message: string);
        IsTruthy(a: any, message: string);
        IsFalsey(a: any, message: string);
        AreDeepEqual(a: any, b: any, message: string): void;
        AreNotDeepEqual(a: any, b: any, message: string): void;
        Throws(a: { (): void; }, message: string);
        Fail();
    }
    export class AssertClass implements IAssert {

        AreIdentical(expected: any, actual: any, message= ""): void {
            if (expected !== actual) {
                throw 'areIdentical failed when passed ' +
                    'expected: {' + (typeof expected) + '} "' + expected + '" and ' +
                    'actual:{' + (typeof actual) + '} "' + actual + '" ' + message;
            }
        }

        AreNotIdentical(a: any, b: any, message= ""): void {
            if (a === b) {
                throw 'areNotIdentical failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" and ' +
                    '{' + (typeof b) + '} "' + b + '" ' + message;
            }
        }

        IsTrue(a: boolean, message= "") {
            if (!a) {
                throw 'isTrue failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" ' + message;
            }
        }

        IsFalse(a: boolean, message= "") {
            if (a) {
                throw 'isFalse failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" ' + message;
            }
        }

        IsTruthy(a: any, message= "") {
            if (!a) {
                throw 'isTrue failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" ' + message;
            }
        }

        IsFalsey(a: any, message= "") {
            if (a) {
                throw 'isFalse failed when passed ' +
                    '{' + (typeof a) + '} "' + a + '" ' + message;
            }
        }

        AreDeepEqual(a: any, b: any, message= ""): void {
            var errMessage = 'areDeepEqual failed when passed ' +
                '{' + (typeof a) + '} "' + a + '" and ' +
                '{' + (typeof b) + '} "' + b + '" ' + message;

            if ((!a && b) || (a && !b)) {
                throw errMessage;
            }
            else if (a && b) {
                if (JSON.stringify(a).toLowerCase() != JSON.stringify(b).toLowerCase()) {
                    throw errMessage;
                }
            }
            //otherwise, !a && !b is OK
        }

        AreNotDeepEqual(a: any, b: any, message= ""): void {
            var errMessage = 'areNotDeepEqual failed when passed ' +
                '{' + (typeof a) + '} "' + a + '" and ' +
                '{' + (typeof b) + '} "' + b + '" ' + message;

            if (a && b) {
                if (JSON.stringify(a).toLowerCase() == JSON.stringify(b).toLowerCase()) {
                    throw errMessage;
                }
            }
            else if (!a && !b) {
                throw errMessage;
            }
            //otherwise, only 1 is null/undefined, which is OK
        }

        Throws(a: { (): void; }, message= "") {
            var isThrown = false;
            try {
                a();
            } catch (ex) {
                isThrown = true;
            }
            if (!isThrown) {
                throw 'did not throw an error ' + message;
            }
        }

        Fail() {
            throw 'fail';
        }
    }

    var globalAssert = new AssertClass();
    export var Assert = globalAssert;

    export interface ITestMethod {
        MethodName: string;
        MethodDescription: string;
    }
    export interface ITestClass {
        Name: string;
        Tests: ITestMethod[];
        setUpAsync(dfdSetup: JQueryDeferred<any>);
        tearDown();
        Overrides: {};
    }

    export class TestClassBase implements ITestClass {
        constructor(testName: string) {
            this.Name = testName;
            this.Assert = globalAssert;
        }
        Overrides = {};
        Name: string;
        addOverride(moduleName, obj) {

            this.Overrides[moduleName] = (obj);
        }
        Tests: ITestMethod[] = [];
        setUpAsync(dfdSetup: JQueryDeferred<any>) {
            console.log("SetUp - " + this.Name);
            dfdSetup.resolve();
        }
        tearDown() {
            console.log("Teardown - " + this.Name);
        }
        AddTestFunction(funcRef: Function, description?: string) {
            var testFunction = this.getFunctionVariableName(this, funcRef);

            if (!description)
                description = testFunction;

            this.AddTest(testFunction, description);
        }
        AddTest(name: string, description: string = "") {
            this.Tests.push(<ITestMethod>{ MethodName: name, MethodDescription: description });
        }

        private getFunctionVariableName(parentObj: any, funcRef: Function): string {
            if (typeof funcRef !== 'function' || typeof parentObj != 'object')
                return "";

            for (var item in parentObj) {
                if (parentObj[item] === funcRef)
                    return item;
            }

            return "";
        }

        Assert: IAssert;
    }
    export class TestRunner {
        _tests: string[] = [];
        constructor(private _baseUrl: string, private _testRenderer: ITestRenderer) {
        }

        AddTest(testModuleName) {
            this._tests.push(testModuleName);
        }
        Run() {
            for (var i = 0, len = this._tests.length; i < len; i++) {
                var test = this._tests[i];
                var promise = this.RunTestClass(test);
                if (this._testRenderer) {
                    promise.done((result: TestResults) => {
                        this._testRenderer.RenderCompletedTest(result);
                    });
                }
            }
        }

        RunTestClass(testModuleName: string): JQueryPromise<TestResults> {
            var myRequire: Require = require.config({
                baseUrl: this._baseUrl,
                context: testModuleName,
                catchError: true
            });
            var dfdResult = $.Deferred<TestResults>();
            myRequire([testModuleName], (testClassToRun) => {
                var test = <ITestClass>new testClassToRun();

                var dfdSetup = $.Deferred();
                var currentContext = (<any>require).s.contexts[testModuleName].defined;
                $.extend(currentContext, test.Overrides);
                test.setUpAsync(dfdSetup);

                dfdSetup.done(function () {
                    var testResult: TestResults = new TestResults(testModuleName),
                        asyncTestDfd = $.Deferred(),
                        executed = 0,
                        len = test.Tests.length

                    asyncTestDfd.done(function () {
                        dfdResult.resolve(testResult);
                    });

                    for (var i = 0; i < len; i++) {
                        var testMethod = test.Tests[i];

                        try {
                            var promise = test[testMethod.MethodName]();

                            if (!promise) {
                                executed++;
                                testResult.PassedTests.push(new TestRun(testMethod.MethodName, testMethod.MethodDescription, 'OK'));
                            }
                            else {
                                //attach TestRun parameters to promise for use 
                                promise.MethodName = testMethod.MethodName;
                                promise.MethodDescription = testMethod.MethodDescription;

                                promise.done(function () {
                                    testResult.PassedTests.push(new TestRun(this.MethodName, this.MethodDescription, 'OK'));
                                });
                                promise.fail(function (err) {
                                    testResult.FailedTests.push(new TestRun(this.MethodName, this.MethodDescription, err));
                                });
                                promise.always(function () {
                                    executed++;

                                    if (executed === len)
                                        asyncTestDfd.resolve();
                                });
                            }
                        } catch (err) {
                            executed++;
                            testResult.FailedTests.push(new TestRun(testMethod.MethodName, testMethod.MethodDescription, err));
                        }
                    }

                    if (executed === len)
                        asyncTestDfd.resolve();
                }).then(function () {
                        test.tearDown();
                        delete (<any>require).s.contexts[testModuleName];
                    });
            });

            return dfdResult.promise();
        }
    }

    export interface ITestRenderer {
        RenderCompletedTest(result: TestResults);
    }

    export class CollapsableTestResults {
        constructor(public TestResults: TestResults) {
            if (TestResults.FailedTests.length) {
                this.Expanded(true);
            }
        }
        Expanded: KnockoutObservable<boolean> = ko.observable(false);
        ExpandContract() {
            this.Expanded(!this.Expanded());
        }
    }

    export class KOTestRenderer implements ITestRenderer {
        constructor(selector: string) {
            ko.applyBindings(this, document.getElementById(selector));
        }
        RenderCompletedTest(result: TestResults) {
            this.TotalFailed(this.TotalFailed() + result.FailedTests.length);
            this.TotalSucceded(this.TotalSucceded() + result.PassedTests.length);

            this.Results.push(new CollapsableTestResults(result));
        }
        TotalFailed = ko.observable(0);
        TotalSucceded = ko.observable(0);
        Results = ko.observableArray<CollapsableTestResults>();
        private encodeHtmlEntities(input: string) {
            var entitiesToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
            input.replace(/[&<>]/g, function (entity) { return entitiesToReplace[entity] || entity; });
            return input;
        }
    }



    export class Fake {
        constructor(obj: any) {
            for (var prop in obj) {
                if (typeof obj[prop] === 'function') {
                    this[prop] = function () { };
                } else {
                    this[prop] = null;
                }
            }
        }

        create(): any {
            return this;
        }

        addFunction(name: string, delegate: { (...args: any[]): any; }) {
            this[name] = delegate;
        }

        addProperty(name: string, value: any) {
            this[name] = value;
        }
    }


    export class TestRun {
        constructor(public TestName: string, public TestDescription: string, public Message: string) {
        }
    }


    export class TestResults {
        constructor(public TestClassName: string) {
        }
        public PassedTests: TestRun[] = [];
        public FailedTests: TestRun[] = [];
    }
}