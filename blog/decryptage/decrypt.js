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


let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase()
let emoji = [
    0x1F600, 0x1F601, 0x1F602, 0x1F603, 0x1F604, 0x1F605, 0x1F606, 0x1F607,
    0x1F608, 0x1F609, 0x1F610, 0x1F611, 0x1F612, 0x1F613, 0x1F614, 0x1F615,
    0x1F616, 0x1F617, 0x1F618, 0x1F619, 0x1F620, 0x1F621, 0x1F622, 0x1F623,
    0x1F624, 0x1F625]

emoji = shuffle(emoji);

let dst = "JKLMNOPQRSTUVWXYZABCDEFGHI".toLowerCase()
let map_char = {}
let mape = {}

let word2id = {" ": 26};
let id2work = {26: " "};
for (let i = 0; i < alphabet.length; i++) {
    word2id[alphabet[i]] = i;
    id2work[i] = alphabet[i];
    mape[alphabet[i]]= String.fromCodePoint(emoji[i]);
    map_char[alphabet[i]]= dst[i];
}

let order_fr = [ 4,  0,  8, 18, 19, 13, 20, 17, 11, 14,  3, 12,  2, 15, 21, 16,  5, 1,  6,  7,  9, 23, 24, 25, 22, 10]

function encrypt() {
    let txt = $('textarea#input').val().toLowerCase()

    let encode = ""
    for (let i = 0; i < txt.length; i++) {
        if (txt[i] in map_char){
            encode += map_char[txt[i]];
        }else{
            encode += txt[i];
        }
    }

    return encode;
}

function encrypt_moji() {
    let txt = $('textarea#input').val().toLowerCase()

    let encode = ""
    for (let i = 0; i < txt.length; i++) {
        if (txt[i] in map_char){
            encode += mape[txt[i]];
        }else if(txt[i] === " "){
            encode += "  ";
        }
        else{
            encode += txt[i];
        }
    }

    $("textarea#encrypt_msg").val(encode);
}
//------------------------- PARAMS --------------------------//
//-----------------------------------------------------------//

let config = {
    nb_it: 5000,
    gamma: 4.0,
    param: {T:0.05, alpha:0.99},
}

let DATA = [];
let ALGO = null;
let RUN_ID = null;
let begin = false;
let logdi = nj.zeros([27,27], 'float32')

d3.csv("/blog/decryptage/bigrams.csv").then(function(data) {
    for (let i = 0; i < data.length; i++) {
        let src = data[i].src.toLowerCase();
        let dst = data[i].dst.toLowerCase();
        logdi.set(word2id[src], word2id[dst], data[i].val)
    }
});

let dico = {}

d3.csv("/blog/decryptage/dico.csv").then(function(data) {
    for (let i = 0; i < data.length; i++) {
        dico[data[i].word]=true;
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

const dsu = (arr1, arr2) => arr1
    .map((item, index) => [arr2[index], item]) // add the args to sort by
    .sort(([arg1], [arg2]) => arg2 - arg1) // sort by the args
    .map(([, item]) => item); // extract the sorted items

function decode(sol) {
    // encrypt_moji()
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

    //init
    let sol = [];
    for (let i = 0; i < alphabet.length; i++) {
        sol.push(null)
    }

    //count char
    let counts = {}
    for (let i = 0; i < txt.length; i++) {
        if(txt[i] in map_char) {
            if (txt[i] in counts) {
                counts[txt[i]] += 1
            } else {
                counts[txt[i]] = 1
            }
        }
    }
    let char = Object.keys(counts)
    let char_count = Object.values(counts)

    let ordered_char = dsu(char, char_count)

    //assign
    let k=0;
    ordered_char.forEach(function(value) {
        sol[order_fr[k]] = value;
        k += 1;
    });

    let map = {};
    for (let i = 0; i < sol.length; i++) {
        if (sol[i]!==null){
            map[sol[i]] = alphabet[i]
        }
    }

    return {'char':sol, 'map':map};
}

function likelihood(sol) {
    let res = decode(sol);
    let val = 0;
    for (let i = 0; i < res.length-1; i++) {
        let char1 =  res[i];
        let char2 =  res[i+1];
        if (char1 in word2id && char2 in word2id) {
            let u = word2id[char1];
            let v = word2id[char2];
            val += logdi.get(u, v)
        }
    }
    return val/res.length;
}

function word_score(sol) {
    let res = decode(sol);
    let words = res.split(' ')
    let val = 0;
    for (let i = 0; i < words.length; i++) {
        if(words[i] in dico){
            val+=1;
        }
    }
    // console.log(val)
    return val/words.length;
}

function combine(sol) {
    return word_score(sol) * config.gamma + likelihood(sol)
}

function neighbor(conf, sol) {
    let i = randint(26);
    let j = randint(26);

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

function obj_wrapper() {
    return {
        best_val: null,
        best_sol: null,
        score:  function (foo, sol) {
            let val = foo(sol)
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

function recuit(track, init, neighb, pen, again, init_t, decrese_t){
    let start = init()
    return {
        "func": track,
        sol_i: start,
        val_i: track.score(likelihood, start),
        "phase": 0,
        "i": 0,
        "T": init_t(),
        "iter": function (phase=0) {
            let progress = again(this.i, this.val_i, this.sol_i)
            if (progress) {
                let sol = pen(neighb(this.sol_i));
                let val = null;

                let p = null;
                if(this.phase===0) {
                    val = this.func.score(likelihood, sol);
                    let ALPHA = 1;
                    let size = $('textarea#input').val().toLowerCase().length
                    p = Math.exp(ALPHA * (val - this.val_i) * size)

                }else if(this.phase===1){
                    val = this.func.score(combine, sol);
                    p = Math.exp((val - this.val_i) / this.T)
                }

                if (val > this.val_i || (this.T > 0 && rand(0,1) < p)){
                    this.val_i = val
                    this.sol_i = sol
                }

                this.i += 1;
                if(this.phase===1) {
                    this.T = decrese_t(this.T);
                }

                if(this.phase===0) {
                    if (!again(this.i, this.val_i, this.sol_i)) {
                        config.nb_it += config.nb_it/2
                        this.phase = 1;
                    }
                }
            }

            return {"progress":progress, "i":this.i ,"sol": this.func.best_sol, "val": this.func.best_val}
        }
    }
}

function build(conf) {
    let tracker = obj_wrapper()
    let init = init_random.bind(null, conf);
    let neighb_fn = neighbor.bind(null, conf);
    let again = max_iter.bind(null, conf);
    let pen = (x) => {return x};

    let init_t = init_temp.bind(null, conf);
    let decrease_t = decrease_temp.bind(null, conf);

    let algo = recuit(tracker, init, neighb_fn, pen, again, init_t, decrease_t);
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
    if(RUN_ID===null){
        ALGO = build(config);
        RUN_ID=0
    }else {
        RUN_ID = 1
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
        // if (t - t0 > 0.5) {
            if (ALGO!==null){
                let log = run(ALGO, RUN_ID);
                DATA.push(log);
            }
            vega_plot(DATA, config);
            t0=t;
        // }
        // t+=0.1;
    }

}

