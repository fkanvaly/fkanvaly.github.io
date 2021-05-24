"use strict";

//#################################################################
// Make an instance of two and place it on the page.
var elem = document.getElementById('draw');
var params = { width: 600, height: 300 };
var two = new Two(params).appendTo(elem);

var radius = two.height/2-10;
var mar = 5

var center = {left:{x:radius+mar, y:mar+radius},
                right:{x:two.width-radius-mar, y:mar+radius},}

var left_bord = two.makeCircle(center.left.x, center.left.y, radius);
left_bord.linewidth = 4
left_bord.stroke = '#ecf0f1'

var right_bord = two.makeCircle(center.right.x, center.left.y, radius);
right_bord.linewidth = 4
right_bord.stroke = '#ecf0f1'

// Border
var border = two.makeRectangle(two.width/2, radius, two.width-two.height, two.height);
border.linewidth = 4
border.stroke = '#ffffff'

var up = two.makeLine(radius, mar, two.width-radius, mar);
up.linewidth = 4
up.stroke = '#ecf0f1'

var down = two.makeLine(radius, 2*radius+mar, two.width-radius, 2*radius+mar);
down.linewidth = 4
down.stroke = '#ecf0f1'

// Cage
var cage = two.makeRectangle(0, 0, two.width/2, two.height/2);
cage.translation.set(two.width/2, two.height/2)
cage.linewidth = 1.5
cage.stroke = '#e67e22'

// SETTINGS
var P_COLOR = ['#3498db', '#e67e22', '#1abc9c', '#9b59b6', '#34495e', '#2ecc71', '#9AECDB', '#F97F51']
let pop_size = 250;


function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randint(max) {
    return Math.floor(Math.random() * max);
}

function choose(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

// two has convenience methods to create shapes.
var createParticle = function (x,y, id) {
    let particle = two.makeCircle(x, y, 2);
    particle.fill = P_COLOR[0];
    particle.stroke = P_COLOR[0]; // Accepts all valid css color
    let mean = 10;
    let std = 8;
    let v_x_sign = choose([-1,1]);
    let v_y_sign = choose([-1,1]);
    return {
        particle: particle,
        v: {
            x: mean*v_x_sign + std*rand(-1, 1),
            y: mean*v_y_sign + std*rand(-1, 1)
        },
        k: 0,
        id:id
    };
}

var collision = function (p) {
    // bottom
    if(p.particle.position.y + p.particle.radius > mar+radius*2){
        p.particle.position.y = mar+radius*2 - p.particle.radius;
        p.v.y = -p.v.y;
    }
    // top
    if(p.particle.position.y - p.particle.radius< mar){
        p.particle.position.y = mar+p.particle.radius;
        p.v.y = -p.v.y;
    }
    //left
    if(p.particle.position.x - p.particle.radius < mar+radius){

        //distance to center
        let dist = Math.sqrt(
            Math.pow(p.particle.position.x-center.left.x, 2)+
            Math.pow(p.particle.position.y-center.left.y, 2)
        )
        if(dist>radius){
            p.particle.position.x = mar+radius+p.particle.radius;
            p.v.x = -p.v.x;
        }
    }
    //right
    if(p.particle.position.x + p.particle.radius > two.width-radius-mar){
        p.particle.position.x = two.width-radius-mar - p.particle.radius;
        p.v.x = -p.v.x;
    }
}

let particles = [];
let part_capt = [];
for (let i=0; i<pop_size; i++){
    part_capt.push(0)
    particles.push(createParticle(
        two.width*Math.random(),
        two.height*Math.random(),
        i
    ))
}

let captured_counts = 0;
var capture = function (){
    cage.position.x = rand(cage.width/2, two.width-cage.width/2);
    cage.position.y = rand(cage.height/2, two.height-cage.height/2);

    let newly_captured = 0;

    particles.forEach(function (p) {
        if ( Math.abs(p.particle.position.x-cage.position.x) < cage.width/2
            && Math.abs(p.particle.position.y-cage.position.y) < cage.height/2 ) {

            if (p.k === 0){
                newly_captured += 1;
            }

            p.k += 1;
            p.particle.fill = P_COLOR[p.k];
            p.particle.stroke = P_COLOR[p.k];
        }
    })

    update_belief(newly_captured, captured_counts);
    plot()
}

// Don't forget to tell two to render everything
// to the screen
var t0 = 0;
two.bind('update', function(t) {
    if(t-t0>1e-2) {
        particles.forEach(function (p) {
            p.particle.position.y = p.particle.position.y + p.v.y * (t - t0) * 10e-2;
            p.particle.position.x = p.particle.position.x + p.v.x * (t - t0) * 10e-2;
            collision(p)
        })
        t0 = t;
    }
}).play();  // Finally, start the animation loop

//#######################################################################

let candidate_pop_sizes = nj.arange(350, 'int32').add(100);
let belief = nj.ones(pop_size, 'float64');
belief = belief.divide(nj.sum(belief));

function binom(n, k) {
    let coeff = 1;
    let i;

    if (k < 0 || k > n) return 0;

    for (i = 0; i < k; i++) {
        coeff = coeff * (n - i) / (i + 1);
    }

    return coeff;
}

function hypergeom(N, n, k, K){
    return binom(K, k)*binom(N-K, n-k)/binom(N,n)
}

var update_belief = function (newly_capture, already_captured) {
    for (let i = 0; i < pop_size; i++) {
        let N = candidate_pop_sizes.get(i);
        let hypo_pop_size = N - already_captured;
        let likelihood = hypergeom(
            N,
            newly_capture+already_captured,
            newly_capture,
            hypo_pop_size);
        belief.set(i, belief.get(i)* likelihood);
        if (isNaN(belief.get(i))){belief.set(i,0)}
    }
    belief = belief.divide(nj.sum(belief));
    captured_counts += newly_capture;
}

var plot = function (){
    let data = [];
    for(let i=0; i<pop_size; i++){
        data.push({
            "pop_size" : candidate_pop_sizes.get(i),
            "belief" : belief.get(i),
            "gt": pop_size
        })
    }

    var vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "description": "A simple bar chart with embedded data.",
        "data": {
            "values": data
        },
        "layer":[
            {
                "mark": "bar",
                "encoding": {
                    "x": {
                        "field": "pop_size",
                        "type": "quantitative",
                        "axis": {"labelAngle": -90},
                        },

                    "y": {
                        "field": "belief",
                        "type": "quantitative",
                    }}
            },
            {
                "mark": "rule",
                "encoding": {
                    "x": {"aggregate": "min", "field": "gt"},
                    "color": {"value": "red"},
                    "size": {"value": 2}
                }
            }
        ]
    }

    var vlOpts = {width: 280, height:280, actions:false};
    vegaEmbed("#plot", vlSpec, vlOpts);
}

plot()