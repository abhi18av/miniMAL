// 3 arguments: new environment with bindings
// 2 arguments: eval_ast
function env_or_eval_ast(ast, env, exprs) {
    if (exprs) {
        // Env implementation
        env = Object.create(env);
        // Returns a new Env with symbols in ast bound to
        // corresponding values in exprs
        for (var i=0; i<ast.length; i++) {
            if (ast[i] == "&") {
                // variable length arguments
                env[ast[i+1]] = Array.prototype.slice.call(exprs, i);
                break;
            } else {
                env[ast[i]] = exprs[i];
            }
        }
        return env;
    }
    return Array.isArray(ast)
        ? ast.map(function(e){return EVAL(e, env);}) // list
        : (typeof ast == "string")                  // symbol
            ? ast in env
                ? env[ast]                           // lookup symbol
                : null[ast]                          // undefined symbol
            : ast;                                   // just return ast
}

function EVAL(ast, env) {
  while (true) {
    //console.log("EVAL:", ast);
    if (!Array.isArray(ast)) return env_or_eval_ast(ast, env);

    // apply
    if (ast[0] == "def") {
        return env[ast[1]] = EVAL(ast[2], env);
    } else if (ast[0] == "let") {
        env = Object.create(env);
        for (var i in ast[1]) {
            if (i%2) {
                env[ast[1][i-1]] = EVAL(ast[1][i], env);
            }
        }
        ast = ast[2]; // TCO
    } else if (ast[0] == "`") {
        return ast[1];
    } else if (ast[0] == ".-") {  // get or set attribute
        var el = env_or_eval_ast(ast.slice(1), env),
            x = el[0][el[1]];
        return el[2] ? x = el[2] : x;
    } else if (ast[0] == ".") {   // call object method
        var el = env_or_eval_ast(ast.slice(1), env),
            x = el[0][el[1]];
        return x.apply(el[0], el.slice(2));
    } else if (ast[0] == "do") {
        var el = env_or_eval_ast(ast.slice(1,ast.length-1), env);
        ast = ast[ast.length-1]; // TCO
    } else if (ast[0] == "if") {
        ast = EVAL(ast[1], env) ? ast[2] : ast[3]; // TCO
    } else if (ast[0] == "fn") {
        var f = function() {
            return EVAL(ast[2], env_or_eval_ast(ast[1], env, arguments));
        }
        f.data = [ast[2], env, ast[1]];
        return f;
    } else {
        var el = env_or_eval_ast(ast, env), f = el[0];
        if (f.data) {
            ast = f.data[0];
            env = env_or_eval_ast(f.data[2], f.data[1], el.slice(1))
            // TCO
        } else {
            return f.apply(f, el.slice(1))
        }
    }
  }
}

E = Object.create(this);
E["="]     = function(a,b) { return a===b; }
E["<"]     = function(a,b) { return a<b; }
E["+"]     = function(a,b) { return a+b; }
E["-"]     = function(a,b) { return a-b; }
E["*"]     = function(a,b) { return a*b; }
E["/"]     = function(a,b) { return a/b; }
E["map"]   = function(a,b) { return b.map(a); }
E["eval"]  = function(a)   { return EVAL(a, E); }
//env["throw"] = function(a) { throw(a); }

// Web specific
b.innerHTML = '<textarea rows=9 cols=60>["let",["m",["`","mini"]],["+","m",["`","MAL"]]]\n["def","F",["fn",["n"],["if","n",["*","n",["F",["-","n",1]]],1]]]\n["map","F",["`",[7,8,9]]]</textarea><textarea rows=9 cols=60></textarea>';

t = b.children;
function R(){
    t[1].value = t[0].value.split('\n').map(function(a) { if (a) return JSON.stringify(EVAL(JSON.parse(a),E)); }).join('\n');
}
t[0].onkeyup = R;
R();
