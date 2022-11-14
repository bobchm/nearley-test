var globalStack = [];

function execute(ast) {
    var svStack = stackTop();
    pushStackFrame("_execute_", null, null);

    // ast should be a list of executable records
    for (let i = 0; i < ast.length; i++) {
        try {
            executeTopLevel(ast[i]);
        } catch (err) {
            resetStack(svStack);
            throw err;
        }
    }
    popStackFrame();
}

function executionError(err, node) {
    var msg = err;
    if (node) {
        msg += `: ${node.start.line}:${node.start.col}`;
    }
    return new Error(msg);
}

function executeTopLevel(node) {
    switch (node.type) {
        case "comment":
            break;
        case "function_definition":
            defineFunction(node);
            break;
        case "return_statement":
            throw executionError("Return statement at top level", node);
            break;
        default:
            executeStatement(node);
    }
}

function defineFunction(node) {}

function executeStatement(node) {
    switch (node.type) {
        case "comment":
            break;
        case "var_assignment":
            executeAssignment(node);
            break;
        case "call_expression":
            break;
        case "while_loop":
            break;
        case "if_statement":
            break;
        case "for_loop":
            break;
        case "indexed_assignment":
            break;
        case "return_statement":
            break;
        default:
            throw new Error(`Improper statement: ${node.type}`);
    }
}

function executeAssignment(node) {}

function pushStackFrame(name, fns, vars) {
    globalStack.push({
        name: name,
        fns: fns,
        vars: vars,
        returnFlag: false,
        returnValue: null,
    });
}

function popStackFrame() {
    if (globalStack.length > 0) {
        globalStack.pop();
    }
}

function stackTop() {
    if (globalStack.length === 0) return null;
    return globalStack[globalStack.length - 1];
}

function resetStack(toFrame) {
    for (let i = 0; i < globalStack.length - 1; i++) {
        if (globalStack[i] === toFrame) {
            globalStack = globalStack.slice(0, i + 1);
        }
    }
}

function addStackFrame(frame) {
    // this is for sharing stack frames with other execution stacks, not the normal "push new stack"
    globalStack.push(frame);
}

function getVariableValue(name, node) {
    for (let i = globalStack.length - 1; i >= 0; i--) {
        var variable = globalStack[i].vars[name];
        if (variable) {
            return variable.value;
        }
    }
    throw executionError(`Unknown variable: ${name}`, node);
}

function setVariable(name, value, node) {
    for (let i = globalStack.length - 1; i >= 0; i--) {
        var variable = globalStack[i].vars[name];
        if (variable) {
            variable.value = value;
        }
    }
    stackTop().vars[name] = value;
}

function getFunctionDef(name, node) {
    for (let i = globalStack.length - 1; i >= 0; i--) {
        var fn = globalStack[i].fns[name];
        if (fn) {
            return fn.def;
        }
    }
    throw executionError(`Unknown variable: ${name}`, node);
}

function setFunction(name, params, body, node) {
    addFnDefToStackFrame(name, params, false, body, null, node);
}

function addBuiltInFunction(fnDef) {
    // build fake parameters
    var params = [];
    for (let i = 0; i < fnDef.nParams; i++) {
        params.push(`param${i}`);
    }
    addFnDefToStackFrame(fnDef.name, params, true, null, fnDef.function, null);
}

function addFnDefToStackFrame(name, params, isBuiltIn, body, builtInFn, node) {
    var frame = stackTop();
    if (stackTop.fns[name]) {
        throw executionError(`Duplicate function definition (${name})`, node);
    }
    stackTop.fns[name] = {
        params: params,
        isBuiltIn: isBuiltIn,
        body: body,
        builtInFn: builtInFn,
    };
}

export { pushStackFrame, addStackFrame, addBuiltInFunction, execute };
