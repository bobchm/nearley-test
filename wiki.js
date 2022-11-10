// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "S", "symbols": ["S", {"literal":"+"}, "M"], "postprocess": 
        function (data) {
           return {
              op: "plus", 
              op1: data[0], 
              op2: data[2],
              };
        } 
        },
    {"name": "S", "symbols": ["M"], "postprocess": d => d[0]},
    {"name": "M", "symbols": ["M", {"literal":"*"}, "T"], "postprocess":  
        function (data) {
           return {
              op: "times", 
              op1: data[0], 
              op2: data[2],
              };
        } 
        },
    {"name": "M", "symbols": ["T"], "postprocess": d => d[0]},
    {"name": "T", "symbols": [{"literal":"1"}], "postprocess": d => d[0]},
    {"name": "T", "symbols": [{"literal":"2"}], "postprocess": d => d[0]},
    {"name": "T", "symbols": [{"literal":"3"}], "postprocess": d => d[0]},
    {"name": "T", "symbols": [{"literal":"4"}], "postprocess": d => d[0]}
]
  , ParserStart: "S"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
