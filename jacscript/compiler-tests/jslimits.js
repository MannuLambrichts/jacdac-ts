var btnA = roles.button()
function foo() {
    let y = 2 //! only 'var' supported
    const z = 3 //! only 'var' supported

    // roles are not first class values
    var btnACopy = btnA //! number required here
}

async function bar() { } //! async not supported
function* baz() { } //! async not supported
