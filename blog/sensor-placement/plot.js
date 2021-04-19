"use strict";

//-------------------------SETTINGS--------------------------//
//-----------------------------------------------------------//

// Make an instance of two and place it on the page.
let elem = document.getElementById('mydraw');
let params = { width: 280, height: 280 };
let two = new Two(params).appendTo(elem);

// Border
let border = two.makeRectangle(0, 0, two.width, two.height);
border.translation.set(two.width/2, two.height/2)
border.linewidth = 4
border.stroke = '#ecf0f1'

let P_COLOR = ['#16a085', '#e67e22', '#bdc3c7']

//------------------------- PARAMS --------------------------//
//-----------------------------------------------------------//

let config = {
    init: "grid",
    n_sensor: 20,
    ratio: 0.2,
    domain: {w: two.width, h: two.height},
    scale: 0.05,
    nb_it: 200,
    algo: $('input[name=algo]:checked', '#algo_radio').val(),
    param: {T:2000, alpha:0.9},
    penalize: true
}

let GRID_SIZE = 30;
let begin = false;

//-------------------------  UTILS --------------------------//
//-----------------------------------------------------------//

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randint(max) {
    return Math.floor(Math.random() * max);
}

function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x,2)+Math.pow(p2.y - p1.y,2))
}

function get_pos(i, j) {
    let H = two.height/GRID_SIZE;
    let W = two.width/GRID_SIZE;
    return {x:H/2 + i*H, y:W/2 + j*W}
}

function plotSensor(p, conf){
    let radius = (conf.domain.w * conf.ratio)/2;

    let circle = two.makeCircle(0, 0, radius);
    circle.fill = P_COLOR[0];
    circle.stroke = P_COLOR[0];
    circle.opacity = 0.5;

    let rect = two.makeRectangle(0, 0, 5,5);
    rect.fill = P_COLOR[1];
    rect.stroke = P_COLOR[1];
    rect.opacity = 1;

    let sensor = two.makeGroup(circle, rect);
    sensor.translation.set(p.x, p.y);

    return {
        'sensor':sensor,
        getX : () => {return this.sensor.position.x},
        getY : () => {return this.sensor.position.y}
    };
}

function grid_plot() {
    let H = two.height/GRID_SIZE;
    let W = two.width/GRID_SIZE;
    for (let i = 0; i < GRID_SIZE; i++) {
        let rect1 = two.makeRectangle(two.width/2, H/2 + i*H, two.width,H);
        rect1.stroke = P_COLOR[2];
        rect1.opacity = 0.3;

        let rect2 = two.makeRectangle(W/2 + i*W, two.width/2, W, two.height);
        rect2.stroke = P_COLOR[2];
        rect2.opacity = 0.3;
    }
}

function two_draw(L) {
    let arr = [];
    for (let i = 0; i < L.length; i++) {
        arr.push(plotSensor(L[i], config));
    }
}

grid_plot()


//-------------------------  SHO   --------------------------//
//-----------------------------------------------------------//

function init_random(conf) {
    let sensors = []
    for (let i = 0; i < conf.n_sensor; i++) {
        sensors.push(get_pos(randint(GRID_SIZE), randint(GRID_SIZE)));
    }
    return sensors
}

function init_grid(conf) {
    let sensors = [];
    let radius = conf.domain.w*conf.ratio/2;
    let per_row = Math.floor(Math.sqrt(conf.n_sensor));
    let step = Math.floor((conf.domain.w-radius)/per_row)
    for (let i = 0; i < per_row; i++) {
        for (let j = 0; j < per_row; j++) {
            sensors.push({x:radius+i*step, y:radius+j*step})
        }
    }

    let left = conf.n_sensor - per_row*per_row;
    for (let i = 0; i < left; i++) {
        sensors.push(get_pos(randint(GRID_SIZE), randint(GRID_SIZE)));
    }

    return sensors
}

function coverage(conf, sensors) {
    let score = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {

            let p = get_pos(i,j);
            for (let k = 0; k < sensors.length; k++) {
                let dist = distance(sensors[k], p);
                if( dist < (conf.domain.w * conf.ratio)/2 ){
                    score+=1;
                    break;
                }
            }
        }
    }
    return score
}

function neighb_square(conf, sol) {
    let neigh = [];
    let side = conf.scale * conf.domain.w;
    for (let i = 0; i < sol.length; i++) {
        let p = {
            x: sol[i].x + rand(-side/2,side/2),
            y: sol[i].y + rand(-side/2,side/2)
        }
        neigh.push(p)
    }
    return neigh
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

function constraint(conf, sol) {
    for (let i = 0; i < sol.length; i++) {
        sol[i] = {
            x: Math.min(Math.max(sol[i].x, 0), conf.domain.w),
            y: Math.min(Math.max(sol[i].y, 0), conf.domain.w),
        }
    }
    return sol
}

//-----------------------------------------------------------//
//-------------------------  ALGO   --------------------------//
//-----------------------------------------------------------//

//-------------------------  GREEDY   --------------------------//

function greedy(func, init, neighb, pen, again){
    let start = init()
    return {
        "func": func,
        "sol_i": start,
        "val_i": func.score(start),
        "i": 1,
        "iter": function () {
            if (again(this.i, this.val_i, this.sol_i)) {
                let sol = pen(neighb(this.sol_i));
                let val = this.func.score(sol);
                if (val >= this.val_i) {
                    this.val_i = val
                    this.sol_i = sol
                }
                this.i += 1
            }
            return {"i":this.i ,"sol": this.func.best_sol, "val": this.func.best_val}
        }
    }
}

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
    let objective = obj_wrapper(coverage.bind(null, conf))

    let init = null;
    switch (conf.init) {
        case "grid":
            init = init_grid.bind(null, conf);
            break
        case "random":
            init = init_random.bind(null, conf);
            break
    }

    let neighb = neighb_square.bind(null, conf);
    let again = max_iter.bind(null, conf);

    let pen = (x) => {return x};
    if (conf.penalize){
        pen = constraint.bind(null, conf)
    }

    let algo = null;
    let unbound_iterator = null;
    let iterator = null;

    switch (conf.algo) {
        case "greedy":
            algo = greedy(objective, init, neighb, pen, again);
            unbound_iterator = algo.iter;
            iterator = unbound_iterator.bind(algo);
            break

        case "recuit":
            let init_t = init_temp.bind(null, conf);
            let decrease_t = decrease_temp.bind(null, conf);

            algo = recuit(objective, init, neighb, pen, again, init_t, decrease_t);
            unbound_iterator = algo.iter;
            iterator = unbound_iterator.bind(algo);
            break
    }
    return iterator;
}

let DATA = [];
let ALGO = null;
let RUN_ID = null;

function run(iterator, run_id=0) {
    let result = iterator();

    two.clear();
    grid_plot();
    two_draw(result.sol);

    return {"run_id": run_id, "iteration": result.i, "score": result.val, "goal":GRID_SIZE*GRID_SIZE}
}

function start() {
    config.algo = $('input[name=algo]:checked', '#algo_radio').val();
    config.init = $('input[name=init]:checked', '#initialize').val();

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

var t0 = 0;
two.bind('update', function(t) {
    if(begin) {
        if (t - t0 > 0.5) {
            if (ALGO!==null){
                let log = run(ALGO, RUN_ID);
                DATA.push(log);
            }
            vega_plot(DATA, config);
        }
    }
}).play();


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
