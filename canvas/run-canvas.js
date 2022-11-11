import fs from "fs";
import nearley from "nearley";
import grammar from "./canvas-lang.js";
// const fs = require("fs");
// const nearley = require("nearley");
// const grammar = require("./canvas-lang.js");

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

function parseCanvas(source) {
    var ast = null;
    try {
        var parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(source);
        ast = parser.results[0];
    } catch (err) {
        console.error("Parse error: ", err);
    }
    return ast;
}

function runCanvas(ast) {
    console.log(JSON.stringify(ast, undefined, 2));
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
