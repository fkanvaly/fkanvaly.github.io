"use strict";

let intra = () => {
    let vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {"url": "/data/intra.csv"},
        "title": "intraclass variation",
        "encoding": {
            "y": {"field": "x", "type": "ordinal"},
            "x": {"field": "y", "type": "ordinal"}
        },
        "layer": [
            {
                "mark": "rect",
                "encoding": {
                    "color": {
                        "field": "val",
                        "type": "quantitative",
                        "title": "NCD",
                        "scale": {"domain": [0, 1]},
                        "legend": {"direction": "vertical", "gradientLength": 120}
                    }
                }
            },
            {
                "mark": {"type": "text", "fontSize": 6},
                "encoding": {
                    "text": {"field": "val", "type": "quantitative", "format": ".2f"},
                    "color": {
                        "condition": {"test": "datum['val'] < 0.4", "value": "black"},
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
    vegaEmbed("#intra", vlSpec, vlOpts);

}

let extra = () => {
    let vlSpec = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "data": {"url": "/data/extra.csv"},
        "title": "extraclass variation",
        "encoding": {
            "y": {"field": "x", "type": "ordinal"},
            "x": {"field": "y", "type": "ordinal"}
        },
        "layer": [
            {
                "mark": "rect",
                "encoding": {
                    "color": {
                        "field": "val",
                        "scale": {"domain": [0,1]},
                        "type": "quantitative",
                        "title": "NCD",
                        "legend": {"direction": "vertical", "gradientLength": 120}
                    }
                }
            },
            {
                "mark": {"type": "text", "fontSize": 6},
                "encoding": {
                    "text": {"field": "val", "type": "quantitative", "format":".2f"},
                    "color": {
                        "condition": {"test": "datum['val'] < 0.4", "value": "black"},
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
    vegaEmbed("#extra", vlSpec, vlOpts);

}

intra()
extra()