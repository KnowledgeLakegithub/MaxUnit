module.exports = {
    "No Errors": function(test) {
        test
            .open('index.html')
            .log.message(function() {
                return "Running Typescript tests";
            })
            .wait(1000) // gives time for maxUnit to complete
            .assert.doesntExist('#failed')// will only exist if 1 or more tests failed
            .execute(function() {
                var contents = window.document.getElementById("failedInfo");
                if (contents) {
                    this.data('table', contents.firstElementChild.outerHTML.toString());
                }

                return;
            })
            .log.message(function() {
                if (test.data('table')) {
                    return test.data('table');
                } else {
                    return '';
                }
            })
            .done();
    }
}