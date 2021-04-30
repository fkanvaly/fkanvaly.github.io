"use strict";

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
let emoji = [
    0x1F600, 0x1F601, 0x1F602, 0x1F603, 0x1F604, 0x1F605, 0x1F606, 0x1F607,
    0x1F608, 0x1F609, 0x1F610, 0x1F611, 0x1F612, 0x1F613, 0x1F614, 0x1F615,
    0x1F616, 0x1F617, 0x1F618, 0x1F619, 0x1F620, 0x1F621, 0x1F622, 0x1F623,
    0x1F624, 0x1F625]

emoji = shuffle(emoji);

let dst = "JKLMNOPQRSTUVWXYZABCDEFGHI"
let map = {}
let mape = {}

let word2id = {" ": 26};
let id2work = {26: " "};
for (let i = 0; i < alphabet.length; i++) {
    word2id[alphabet[i]] = i;
    id2work[i] = alphabet[i];
    mape[alphabet[i]]= String.fromCodePoint(emoji[i]);
    map[alphabet[i]]= dst[i];
}

function encrypt() {
    let txt = $('textarea#input').val()

    let encode = ""
    for (let i = 0; i < txt.length; i++) {
        if (txt[i] in map){
            encode += map[txt[i]];
        }else{
            encode += txt[i];
        }
    }

    return encode;
}

function encrypt_moji() {
    let txt = $('textarea#input').val()

    let encode = ""
    for (let i = 0; i < txt.length; i++) {
        if (txt[i] in map){
            encode += mape[txt[i]];
        }else{
            encode += txt[i];
        }
    }

    $("textarea#encrypt_msg").val(encode);
}
//------------------------- PARAMS --------------------------//
//-----------------------------------------------------------//

let config = {
    nb_it: 1000,
    param: {T:2000, alpha:0.98},
}

let DATA = [];
let ALGO = null;
let RUN_ID = null;
let begin = false;
let logdi = nj.zeros([27,27], 'float32')

d3.csv("/blog/decryptage/bigrams.csv").then(function(data) {
    for (let i = 0; i < data.length; i++) {
        let src = data[i].src;
        let dst = data[i].dst;
        logdi.set(word2id[src], word2id[dst], data[i].val)
    }
});

//-------------------------  SHO   --------------------------//
//-----------------------------------------------------------//

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randint(max) {
    return Math.floor(Math.random() * max);
}

function decode(sol) {
    encrypt_moji()
    let text = encrypt();
    let res = ""
    for (let i = 0; i < text.length; i++) {
        if (text[i] in sol['map']){
            res += sol['map'][text[i]];
        }else{
            res += text[i];
        }
    }
    return res;
}

function init_random(conf) {
    encrypt_moji();
    let txt = encrypt();
    let char = new Set(txt);

    let sol = [];
    for (let i = 0; i < alphabet.length; i++) {
        sol.push(null)
    }

    let k=0;
    char.forEach(function(value) {
        if(value !== " ") {
            sol[k] = value;
            k += 1;
        }
    });

    let map = {};
    for (let i = 0; i < sol.length; i++) {
        if (sol[i]!==null){
            map[sol[i]] = alphabet[i]
        }
    }

    return {'char':sol, 'map':map};
}

function score(conf, sol) {
    let res = decode(sol);
    let val = 0;
    for (let i = 0; i < res.length-1; i++) {
        let u = word2id[res[i]];
        let v = word2id[res[i+1]];
        val += logdi.get(u,v)
    }
    return val/res.length;
}

function neighbor(conf, sol) {
    let i = randint(27);
    let j = randint(27);

    //copy
    let new_sol = [];
    for (let i = 0; i < sol['char'].length; i++) {
        new_sol.push(sol['char'][i])
    }

    // swap
    let tmp = new_sol[i];
    new_sol[i]=new_sol[j]
    new_sol[j]=tmp

    // console.log("old: "+ sol[])

    let map = {};
    for (let i = 0; i < new_sol.length; i++) {
        if (new_sol[i]!==null){
            map[new_sol[i]] = alphabet[i]
        }
    }

    return {'char':new_sol, 'map':map};
}

function max_iter(conf, i, val, sol) {
    return i < conf.nb_it;
}

function obj_wrapper(func) {
    return {
        best_val: null,
        best_sol: null,
        foo: func,
        score:  function (sol) {
            let val = this.foo(sol)
            if (this.best_val === null){
                this.best_val = val;
                this.best_sol = sol;
            }
            else if(this.best_val < val){
                this.best_val = val;
                this.best_sol = sol;
            }
            return val
        }
    }
}


//-----------------------------------------------------------//
//-------------------------  ALGO   --------------------------//
//-----------------------------------------------------------//

//-------------------------  RECUIT   --------------------------//
function init_temp(conf) {
    return conf.param.T;
}

function decrease_temp(conf, T) {
    return conf.param.alpha*T;
}

function recuit(func, init, neighb, pen, again, init_t, decrese_t){
    let start = init()
    return {
        "func": func,
        sol_i: start,
        val_i: func.score(start),
        "i": 1,
        "T": init_t(),
        "iter": function () {
            if (again(this.i, this.val_i, this.sol_i)) {
                let sol = pen(neighb(this.sol_i));
                let val = this.func.score(sol);

                if (val > this.val_i || (this.T > 0 && rand(0,1) < Math.exp((val - this.val_i) / this.T))){
                    this.val_i = val
                    this.sol_i = sol
                }
                this.i += 1;
                this.T = decrese_t(this.T);
            }
            return {"i":this.i ,"sol": this.func.best_sol, "val": this.func.best_val}
        }
    }
}

function build(conf) {
    let objective = obj_wrapper(score.bind(null, conf))
    let init = init_random.bind(null, conf);
    let neighb_fn = neighbor.bind(null, conf);
    let again = max_iter.bind(null, conf);
    let pen = (x) => {return x};

    let init_t = init_temp.bind(null, conf);
    let decrease_t = decrease_temp.bind(null, conf);

    let algo = recuit(objective, init, neighb_fn, pen, again, init_t, decrease_t);
    let unbound_iterator = algo.iter;
    let iterator = unbound_iterator.bind(algo);

    return iterator;
}


function run(iterator, run_id=0) {
    let result = iterator();
    $("textarea#decrypt_msg").val(decode(result.sol));

    return {"run_id": run_id, "iteration": result.i, "score": result.val, "goal":0}
}

function start() {
    ALGO = build(config);

    if(RUN_ID===null){
        RUN_ID=0
    }else {
        RUN_ID += 1
    }

    begin=true;
}

function stop() {
    begin=false;
}


// var t0 = 0;
// two.bind('update', function(t) {
//     if(begin) {
//         if (t - t0 > 0.5) {
//             if (ALGO!==null){
//                 let log = run(ALGO, RUN_ID);
//                 DATA.push(log);
//             }
//             vega_plot(DATA, config);
//         }
//     }
// }).play();


// --------------- VEGA LITE --------------

var vega_plot = function (data, conf){
    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "description": "A simple bar chart with embedded data.",
        "data": {
            "values": data
        },
        "layer":[
            {
                "mark": "line",
                "encoding": {
                    "x": {"field": "iteration", "type": "temporal", "scale": {"domain": [0, conf.nb_it]}},
                    "y": {"field": "score", "type": "quantitative"},
                    "color": {"field": "run_id", "type": "nominal"},
                }
            },
            {
                "mark": "rule",
                "encoding": {
                    "y": {"aggregate": "max", "field": "goal"},
                    "color": {"value": "red"},
                    "size": {"value": 2}
                }
            }
        ]
    }

    var vlOpts = {width: 250, height:280, actions:false};
    vegaEmbed("#vega", vlSpec, vlOpts);
}

vega_plot(DATA, config)

var t0 = 0;
let t=0;
function setup() {
}

function draw() {
    if(begin) {
        if (t - t0 > 0.5) {
            if (ALGO!==null){
                let log = run(ALGO, RUN_ID);
                DATA.push(log);
            }
            vega_plot(DATA, config);
            t0=t;
        }
        t+=0.1;
    }

}

