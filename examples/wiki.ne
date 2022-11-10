S -> S "+" M {%
   function (data) {
      return {
         op: "plus", 
         op1: data[0], 
         op2: data[2],
         };
   } 
%}
   | M {% d => d[0] %}
   
M -> M "*" T {% 
   function (data) {
      return {
         op: "times", 
         op1: data[0], 
         op2: data[2],
         };
   } 
%}
| T {% d => d[0] %}

T -> "1" {% d => d[0] %}
   | "2" {% d => d[0] %}
   | "3" {% d => d[0] %}
   | "4" {% d => d[0] %}