Working metric aggregations over entire query set:
```
POST /candlestick/_search
{
  "size": 2,
  "sort" : [
    { "openTime" : {"order" : "asc"}}
  ],
  "query": {
    "bool": {
      "filter": [
        { "term": { "symbols.keyword": "NEOETH" }},
        { "term": { "interval": "15m" }}
      ]
    }
  },
  "aggs" : {
    "avg_grade" : { "avg" : { "field" : "volume" } },
    "max_price" : { "max" : { "field" : "highPrice" } },
    "min_price" : { "min" : { "field" : "lowPrice" } }
  }
}
```

Half-finished script attempt:
Breaks down in variance agg.
```
POST /candlestick/_search
{
  "size": 2,
  "sort" : [
    { "openTime" : {"order" : "asc"}}
  ],
  "query": {
    "bool": {
      "filter": [
        { "term": { "symbols.keyword": "NEOETH" }},
        { "term": { "interval": "15m" }}
      ]
    }
  },
  "aggs" : {
    "avg_grade" : { "avg" : { "field" : "volume" } },
    "max_price" : { "max" : { "field" : "highPrice" } },
    "min_price" : { "min" : { "field" : "lowPrice" } },
    "variance"  : {
      "scripted_metric": {
        "init_script" : "params._agg.mins = []",
        "map_script" : "params._agg.mins.add(doc.lowPrice.value)",
        "combine_script" : "double profit = 0; for (t in params._agg.mins) { profit += t } return profit",
        "reduce_script" : "double profit = 0; for (a in params._aggs) { profit += a } return profit"
      }
    }
  }
}
```
