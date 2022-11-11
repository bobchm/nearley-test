var global_stack = [];
var global_heap = [];

function initBaseStack() {}

function addStackFrame(frame) {
    // this is for sharing stack frames with other execution stacks, not the normal "push new stack"
}

function addBuiltInFunction(fnDef) {}

function addBuiltInVar(varDef) {}

function execute(ast) {
    // are we set up to run
    if (global_stack.length === 0) {
        throw new Error("Execution environment not initialized");
    }
    var svStack = stackTop();

    // ast should be a list of executable records
    for (let i = 0; i < ast.lenght; i++) {
        try {
            executeNode(ast[i]);
        } catch (err) {
            resetStack(svStack);
            throw err;
        }
    }
}

function pushStackFrame(name, fns, vars) {}

function popStackFrame() {}

function stackTop() {}

function resetStack(toFrame) {}

function setFunction(name, params, body) {}

function setVariable(name, value) {}

function getVariableValue(name) {}

function getFunctionDef(name) {}

export {
    initBaseStack,
    addStackFrame,
    addBuiltInFunction,
    addBuiltInVar,
    execute,
};
