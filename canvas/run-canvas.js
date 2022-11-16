import fs from "fs";
import nearley from "nearley";
import grammar from "./canvas-lang.js";
import { pushStackFrame, addBuiltInFunction, execute } from "./canvas-exec.js";

var builtInFunctions = [
    {
        name: "print",
        function: printCanvas,
        parameters: [{ type: "none", value: "output" }],
        category: "printing",
        description: "low-level printing function",
    },
];

function printCanvas(output) {
    console.log(output);
}

function getCanvasFile() {
    if (process.argv.length !== 3) {
        console.log("Usage: node run-canvas.js <canvas file>");
        process.exit(1);
    }
    return process.argv[2];
}

function loadSource(fileName) {
    var source = null;
    try {
        source = fs.readFileSync(fileName, "utf8");
    } catch (err) {
        console.log("Error loading: ", err);
    }
    return source;
}

function validate(ast) {
    return ast.filter((node) => node);
}

function parseCanvas(source) {
    var ast = null;
    try {
        var parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(source);
        ast = parser.results[0];
    } catch (err) {
        // these error messages are a bit much - cut at the location
        var msg = err.message;
        var idx = msg.search(":\n");
        if (idx > 0) {
            msg = msg.slice(0, idx);
        }
        console.error("Parse error: ", msg);
        return null;
    }
    return validate(ast);
}

function runCanvas(ast) {
    console.log(JSON.stringify(ast, undefined, 2));

    // push a stack frame for built-in functions
    pushStackFrame("_base_", [], []);
    for (let i = 0; i < builtInFunctions.length; i++) {
        addBuiltInFunction(builtInFunctions[i]);
    }
    execute(ast);
}

function main() {
    var srcFile = getCanvasFile();
    var source = loadSource(srcFile);
    if (source) {
        var ast = parseCanvas(source);
        if (ast) {
            runCanvas(ast);
        }
    }
}

main();
