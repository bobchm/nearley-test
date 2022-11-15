var globalStack = [];

function execute(ast) {
    var svStack = stackTop();
    pushStackFrame("_execute_", [], []);

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
    var fnName = node.fn_name.value;
    var fnDef = getFunctionDef(fnName, node);

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
        return fnDef.builtInFn.apply(null, args);
    }

    var values = [];
    for (let i = 0; i < fnDef.params.length; i++) {
        values[i] = evaluateExpression(node.arguments[i]);
    }

    // push new frame and set parameter values
    pushStackFrame(fnName, [], []);
    for (let i = 0; i < fnDef.params.length; i++) {
        setVariable(fnDef.params[i], values[i]));
    }


    // run the code of the function definition
    executeCodeBlock(fnDef.body);
    var returnValue = stackTop().returnFlag ? stackTop().returnValue : null;
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

function evaluateExpression(node) {
    switch (node.type) {
        case "string_literal":
            return node.value;
        case "number_literal":
            return node.value;
        case "boolean_literal":
            return node.value;
        case "list_literal":
            return evaluateList(node);
        case "dictionary_literal":
            return evaluateDictionary(node);
        case "binary_operation":
            var left = evaluateExpression(node.left);
            var right = evaluateExpression(node.right);
            return evaluateBinaryOp(node.operator.value, left, right, node);
        case "var_reference":
            return getVariableValue(node.var_name.value, node);
        case "call_expression":
            return executeFnCall(node);
        case "indexed_access":
            var subject = evaluateExpression(node.subject);
            var index = evaluateExpression(node.index);
            try {
                return subject[index];
            } catch (err) {
                throw executionError("Error accessing index value", node);
            }
        case "function_expression":
            defineFunction(node);
            break;
        default:
            throw executionError(`Unknown AST node type (${node.type})`, node);
    }
}

function evaluateList(node) {
    return node.items((map) => evaluateExpression(item));
}

function evaluateDictionary(node) {
    var val = {};
    for (let i = 0; i < node.entries.length; i++) {
        var entry = node.entries[i];
        val[entry[0].value] = evaluateExpression(entry[1]);
    }
    return val;
}

function evaluateBinaryOp(op, left, right, node) {
    try {
        switch (op) {
            case ">":
                return left > right;
            case ">=":
                return left >= right;
            case "<":
                return left < right;
            case "<=":
                return left <= right;
            case "==":
                return left === right;
            case "+":
                return left + right;
            case "-":
                return left - right;
            case "*":
                return left * right;
            case "/":
                return left / right;
            case "%":
                return left % right;
            case "or":
                return left || right;
            case "and":
                return left && right;
        }
    } catch (err) {
        throw executionError(err, node);
    }
    return false;
}

function pushStackFrame(name, fns, vars) {
    if (!Array.isArray(fns) || !Array.isArray(vars)) {
        throw executionError("Non-array arguments to pushStackFrame", null);
    }
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
        if (globalStack[i].vars.hasOwnProperty(name))
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
            return fn;
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
    if (frame.fns[name]) {
        throw executionError(`Duplicate function definition (${name})`, node);
    }
    frame.fns[name] = {
        params: params,
        isBuiltIn: isBuiltIn,
        body: body,
        builtInFn: builtInFn,
    };
}

export { pushStackFrame, addStackFrame, addBuiltInFunction, execute };
