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

function defineFunction(node) {
    var params = node.parameters.map((p) => p.value);
    setFunction(node.name.value, params, node.body, node);
}

function executeStatement(node) {
    switch (node.type) {
        case "comment":
            break;
        case "var_assignment":
            executeAssignment(node);
            break;
        case "call_expression":
            executeFnCall(node);
            break;
        case "while_loop":
            executeWhileLoop(node);
            break;
        case "if_statement":
            executeIfStatement(node);
            break;
        case "for_loop":
            executeForLoop(node);
            break;
        case "indexed_assignment":
            executeIndexedAssignment(node);
            break;
        case "return_statement":
            executeReturnStatement(node);
            break;
        default:
            throw new Error(`Improper statement: ${node.type}`);
    }
}

function executeAssignment(node) {
    setVariable(node.var_name.value, evaluateExpression(node.value), node);
}

function executeFnCall(node) {
    // get function definition
    var fnName = node.function_name.value;
    var fnDef = getFunctionDef(fn_name, node);

    // make sure the number of function parameters match the number of expresions we have
    if (fnDef.params.length !== node.arguments.length) {
        throw executionError(
            `Argument mismatch for function (${fnName})`,
            node
        );
    }

    // is it a built-in function?
    if (fnDef.isBuiltIn) {
        // collect the argument values
        var args = [];
        for (let i = 0; i < node.arguments.length; i++) {
            args.push(evaluateExpression(node.arguments[i]));
        }
        return fnDef.builtInFn.apply(args);
    }

    // push new frame
    pushStackFrame(fnName, null, null);
    for (let i = 0; i < fnDef.params.length; i++) {
        setVariable(fnDef.params[i], evaluateExpression(node.arguments[i]));
    }

    // run the code of the function definition
    var returnValue = null;
    for (let i = 0; i < fnDef.body.length; i++) {
        executeStatement(fnDef.body[i]);
        if (stackTop().returnFlag) {
            returnValue = stackTop().returnValue;
            break;
        }
    }
    popStackFrame();
    return returnValue;
}

function executeWhileLoop(node) {
    while (evaluateExpression(node.condition)) {
        executeCodeBlock(node.body);
        if (stackTop().returnFlag) break;
    }
}

function executeIfStatement(node) {
    if (evaluateExpression(node.condition)) {
        executeCodeBlock(code.consequent);
    }

    // else clause can either be code block or another if statement (emulating elseif)
    else if (node.alternate.type === "if_statement") {
        executeStatement(node.alternate);
    } else {
        executeCodeBlock(node.alternate);
    }
}

function executeForLoop(node) {
    var loopVar = node.loop_variable.value;
    var list = evaluateExpression(node.iterable);
    var body = node.body;
    if (!Array.isArray(list)) {
        executionError("Invalid list in 'for' loop", node);
    }
    for (let i = 0; i < list.length; i++) {
        setVariable(loopVar, list[i], node);
        executeCodeBlock(body);
        if (stackTop().returnFlag) break;
    }
}

function executeCodeBlock(body) {
    for (let i = 0; i < body.statements.length; i++) {
        executeStatement(body.statements[i]);
        if (stackTop().returnFlag) {
            break;
        }
    }
}

function executeIndexedAssignment(node) {
    var ary = evaluateExpression(node.subject);
    if (!Array.isArray(ary)) {
        executionError("Indexed assignment of non-array", node);
    }
    ary[node.index] = evaluateExpression(node.value);
}

function executeReturnStatement(node) {
    stackTop().returnValue = evaluateExpression(node.value);
    stackTop().returnFlag = true;
}

function evaluateExpression(node) {}

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
        if (globalStack[i].vars.hasOwnProperty(name)) {
            return globalStack[i].vars[name];
    }
    throw executionError(`Undefined variable: ${name}`, node);
}

function setVariable(name, value, node) {
    for (let i = globalStack.length - 1; i >= 0; i--) {
        if (globalStack[i].vars.hasOwnProperty(name)) {
            globalStack[i].vars[name] = value;
            return;
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
