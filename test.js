if (process.argv.length !== 4) {
    console.log("Usage: node test.js <grammar file> <test file>");
    process.exit(1);
}

const fs = require("fs");
const nearley = require("nearley");
const grammar = require(process.argv[2]);

try {
    const testinput = fs.readFileSync(process.argv[3], "utf8");
    parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(testinput);
    var result = parser.results[0];
    console.log(JSON.stringify(result, undefined, 2));
} catch (err) {
    console.error(err);
}
