"use strict";

let plot = () => {
    let vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
        "data": {"url": "/blog/decryptage/bigrams.csv"},
        "title": "Bigram log-likelihood",
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
            {
                "mark": {"type": "text", "fontSize": 6},
                "encoding": {
                    "text": {"field": "val", "type": "quantitative", "format": ".2f"},
                    "color": {
                        "condition": {"test": "datum['val'] > -6", "value": "black"},
                        "value": "white"
                    }
                }
            }
        ],
        "config": {
            "axis": {"grid": true, "tickBand": "extent"}
        }
    };

    var vlOpts = {width: 300, height: 300, actions: false};
    vegaEmbed("#bigram", vlSpec, vlOpts);

}
plot()