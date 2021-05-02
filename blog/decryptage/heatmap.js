"use strict";

let plot = () => {
    let vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "data": {"url": "/blog/decryptage/bigrams.csv"},
        "title": "Bigram log-likelihood",
        "height":300,
        "width":300,
        "encoding": {
            "y": {"field": "src", "type": "ordinal", "sort":"descending"},
            "x": {"field": "dst", "type": "ordinal"}
        },
        "layer": [
            {
                "mark": "rect",
                "encoding": {
                    "color": {
                        "field": "val",
                        "type": "quantitative",
                        "title": "NCD",
                        "scale": {"domain": [0,-15]},
                        "legend": {"direction": "vertical", "gradientLength": 120}
                    }
                }
            },
        ],
        "config": {
            "axis": {"grid": true, "tickBand": "extent"}
        }
    };

    var vlOpts = {width: 300, height: 300, actions: false};
    vegaEmbed("#bigram", vlSpec, vlOpts);

}
plot()