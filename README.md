# Requirements
- Install `nodejs` and `yarn` latest versions on your Mac
  - Visit the official sites to see how.
- [Install elastic search](https://www.elastic.co/guide/en/elasticsearch/reference/current/_installation.html)
  - `brew install elasticsearch`
- [Install Kibana](https://www.elastic.co/downloads/kibana) (Elastic Search visualization)
  - Follow Kibana installation instructions

# To get running
- Copy `credentials.example.js` to `credentials.js` and change details to match your API details.
  - KEEP THESE SECRET!
- Use the terminal and `cd to/awakoining`
- Run `yarn` to install the project dependencies
- Start elastic search
  - `brew services start elasticsearch`
- Start kibana: `open /your/path/to/kibana/bin/kibana`
  - Open [kibana at http://localhost:5601/](http://localhost:5601/)

# Usage
- `yarn run ping` to ping the API and verify connectivity
- `yarn run export -s [Symbol A]/[Symbol B] --startTime "2018-01-10 09:30:00"` to export the last 500 candlesticks for those symbols from that startTime to now
  - Where [Symbol A] is the 3-digit ticker symbol for the coin you're interested
  - And [Symbol B] is its trading pair
  - Get all candlesticks since  January 1st 2017 at 9:30am
  - e.g. `yarn run export ETH/BTC` to get the candlesticks for ETH as traded with BTC
- `yarn run store -s [Symbol A]/[Symbol B] --startTime "2018-01-10 09:30:00"` to populate ElasticSearch with the candlesticks since x time
- `yarn run store-all --startTime "2018-01-10 09:30:00"` to populate ElasticSearch with the candlesticks since x time

# Project Architecture
1. Execution begins in index.js, and interprets the command line arguments.
2. The BinanceApi class is called to process the given command.

# The Goal
Identify dormant crypto stocks, and await explosions.

Cryptocurrencies sometimes enter a period of stabilization before exploding upwards on a run:
```
                           /
-__-_                     /
     --__                /
         -_-___-_-^--_--'
```

The goal of this project is to scan for coins in a dormant period, and await an upturn.

## The algorithm:
### Variables
To begin, the following variables are used:
```
`I    - Interval` is the candlestick interval
`W    - Window` the number of intervals required to recognize a dormancy period
`DP   - Dormancy Period` the period over which dormancy is confirmed
`V    - Variance` the variance, over the dormancy period, expressed as a percentage
`Va   - Variance Average` the average variance of the `DP`
`MaxV - Max Variance` the variance maximum. The highest sell price during the `DP`
`MinV - Min Variance` the variance minimum. The lowest sell price during the `DP`
`BT   - Buy Threshold` the buy threshold
`S    - Stabilization period` the last % of the `W` during which the sales should have stabilized.
                              Note that this may be turned off to nullify its effects.
```

The following states exist in the script:
### Analysis
The algorithm begins here:
1. Get the candlesticks over some period, and scan each window for a dormancy period `DP`.
    Dormancy period is defined as follows, relative to the current price:
    - No swings of greater than `V` (5%?) within the `DP`
    - The `V` in last ~10% of the `DP` is less than the average `V` throughout
      (The line-of-best-fit may be of either slope up or down, no matter)

### Dormancy
When a `DP` is found, the coin goes into `watch` mode. and `MaxV` and `MinV` are recorded.
1. If a dip below `MinV` is encountered, the `DP` is rejected and forgotten.
1. If a surge above `MaxV` is encountered, the algorithm changes states and enters its `buy` state

### Buy and Protect

#### Buy
`Pz - Price zero` is the price we have launched from, also known as the high of the bullish candlestick-zero `Cz`
`SL - Stop Limit` is the trailing stop limit.
`Q  - Quantity`, quantity
Given some `Cz` that breaks the `MaxV`, we place a buy order for some `Q` purchased with Ethereum.

For example, suppose a `Cz` breaks out of its `DP` and establishes a price of .100 ETH. We buy at this price `Pz`.
  - Set a sell limit at `Pz - 1%` with order price `Pz - 1.5%` for the same `Q` we purchased with.
    - If the next candlestick is bearish, we may initiate the sell order immediately and lose 1.5%.
    - If the next candlestick is bullish, we will hold and ride the rise, entering the next state.

#### Protect
Assuming our stock is rising, we enter the *Protect State*. Here, we seek to preserve some of the gains acquired during this upturn.
  - With the first trend-breaking candlestick, `Cz`, we purchase at price `Pz` and set sell limits as outlined above.
  - Let's take the following concrete numbers:
    - `Pz` = *0.100 ETH*
    - `SLs - Stop Limit stop`       = 0.990 ETH
    - `SLl - Stop Limit limit`      = 0.985 ETH
    - `SLd - Stop Limit difference` = `SLs` - `SLl`
                                    = 0.005 ETH, recorded and reused throughout
  - Suppose the next candlestick is bullish and increases by a Delta `D` of *0.01 ETH*. Here use `D` to set new a new gain cieling `C` and reset our stops:
    - `Pz`                     = *0.100 ETH*
    - `SLt - Stop limit threshold` = The threshold at which to sell the gains - set at 30%
    - `Pc - Price, current`    = `Gprevious` + `D`
    - `C   - Ceiling`          = Max(`Gprevious`, `Pc`)
                               = 0.1 ETH + 0.01 Eth
                               = *0.11 ETH*
    - `Pz` = 0.100 ETH, this is fixed until we sell.
    - `SLs - Stop Limit stop`  = ( [net gain](`C` - `Pz`) * `SLt` ) + `Pz`
                               = (0.01 * 30%) + 0.1
                               = *0.103 ETH*
    - `SLl - Stop Limit limit` = `SLs` - `SLd`
                               = 0.103 - 0.005
                               = *0.908 ETH*
    - This step continues until we hit the stop limit.
    - *We may consider allowing a sliding `SLt` threshold to preserve 50% of large gains.*.
      *The 30% threshold is intentionally low to prevent early exits*.

### Completion
The algorithm completes under one of the following conditions:
- The script it terminated manually, leaving the stop orders in place.
- The script hits a stop limit sells the stock for `Ps` and prints the results of the transaction.


# Visual Interface
A simple command-line interface should suffice to:
- Show Coins in any of the above states
- Show variables pertaining to each of the states.

## Example interface:
```
1000 coins currently being analyzed each minute...

Dormancy:
ETH 1000 USD +/- 4.3% over I=30 - Last interval: -1.5

Protect:
40  ETH Pz: $1000.00 @ $1051    Sells at $1015
180 XLM PZ: $0.7515  @ $0.8131  Sells at $0.775

Sold:
40 BTC  @ Pz $17015 for Ps $17055  Total $1600    at 3:30pm January 15th
320 VEN @ Pz $4.30  for Ps $4.75   Total $144     at 3:30pm January 15th
```
*Requirements:*
- Use color for readability
- Interface should refresh in-place rather than console-log
- Columns should be aligned (pad each string section with spaces)
See this great module:
https://github.com/yaronn/blessed-contrib#table


# Using Elasic Search (ES)
Note that you interact with ES through Kibana (see below)

# Using Kibana
Use the [kibana console](http://localhost:5601/app/kibana#/dev_tools/console) for most interactions

```
# Create and list candlestick index
PUT /candlestick?pretty
GET /_cat/indices?v
```

```
# Delete the candlestick index, show it's deleted, then put it back
DELETE /candlestick?pretty
GET /_cat/indices?v
PUT /candlestick?pretty
```

```
# Put a doc in the index
PUT /candlestick/doc/1?pretty
{
  "openTime": 1515260700000,
  "openPrice": "0.00716500",
  "highPrice": "0.00716500",
  "lowPrice": "0.00716500",
  "closePrice": "0.00716500",
  "volume": "44.00000000",
  "closeTime": 1515260759999,
  "quoteAssetVolume": "0.31526000",
  "numberOfTrades": 1,
  "takerBuyBaseAssetVolume": "0.00000000",
  "takerBuyQuoteAssetVolume": "0.00000000",
  "ignored": "0"
}
```

```
# Get that newly created doc:
GET /candlestick/doc/1?pretty

response:
{
  "_index": "candlestick",
  "_type": "doc",
  "_id": "1",
  "_version": 1,
  "found": true,
  "_source": {
    "openTime": 1515260700000,
    "openPrice": "0.00716500",
    "highPrice": "0.00716500",
    "lowPrice": "0.00716500",
    "closePrice": "0.00716500",
    "volume": "44.00000000",
    "closeTime": 1515260759999,
    "quoteAssetVolume": "0.31526000",
    "numberOfTrades": 1,
    "takerBuyBaseAssetVolume": "0.00000000",
    "takerBuyQuoteAssetVolume": "0.00000000",
    "ignored": "0"
  }
}
```

Bulk insert a couple:
```
POST /candlestick/doc/_bulk
{ "index" : { "_index" : "candlestick" } }
{ "openTime": 1515260700003 }
{ "index" : { "_index" : "candlestick"} }
{ "openTime": 1515260700004 }
```

To get results/search:
```
GET /candlestick/_search
```

To calculate a moving average (*broken rolling window*)
```
GET candlestick/_search?size=0
{
  "sort": [
      { "openTime": "asc" }
  ],
  "aggs": {
    "histogram_by_date": {
      "date_histogram": {
        "field":     "openTime",
        "interval":  "2m"
      },
      "aggs":{
        "the_sum":{
          "sum":{ "field": "volume" }
        },
        "the_movavg":{
          "moving_avg":{
            "buckets_path": "the_sum",
            "window": 3
          }
        }
      }
    }
  }
}
```

*Search for candlesticks of a certain symbol/interval*
```
POST /candlestick/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "symbols.keyword": "NEOETH"}},
        { "term": { "interval": "15m" }}
      ]
    }
  }
}
```


Read more about in the [ES docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/_modifying_your_data.html)!

## Troubleshooting ES/Kibana Errors
If you get an error like this:
```
({
  "type"=>"cluster_block_exception",
  "reason"=>"blocked by: [FORBIDDEN/12/index read-only / allow delete (api)
])
```

Then you'll have to run this in the [kibana console](http://localhost:5601/app/kibana#/dev_tools/console) change some settings:
```
PUT candlestick/_settings
{
  "index": {
    "blocks": {
      "read_only_allow_delete": "false"
    }
  }
}
```

## Changing Config Settings
To find where your config settings live:
```
$ brew info elasticsearch
elasticsearch: stable 6.1.1, HEAD
Distributed search & analytics engine
https://www.elastic.co/products/elasticsearch
/usr/local/Cellar/elasticsearch/5.5.2 (103 files, 35.6MB)
  Built from source on 2017-09-08 at 23:48:40
/usr/local/Cellar/elasticsearch/6.1.1 (107 files, 30.2MB) *
  Built from source on 2018-01-07 at 22:03:51
From: https://github.com/Homebrew/homebrew-core/blob/master/Formula/elasticsearch.rb
==> Requirements
Required: java = 1.8 ✔
==> Caveats
Data:    /usr/local/var/lib/elasticsearch/elasticsearch_coreysanford/
Logs:    /usr/local/var/log/elasticsearch/elasticsearch_coreysanford.log
Plugins: /usr/local/var/elasticsearch/plugins/
Config:  /usr/local/etc/elasticsearch/
```

The last line above points to `/user/local/etc/elasticsearch/`
where you'll find an `elasticsearch.yml` file.

### To Enable CORS
Add this to the config you found above:
```
# ENABLE CORS
http.cors.enabled : true
http.cors.allow-origin : "*"
http.cors.allow-methods : OPTIONS, HEAD, GET, POST, PUT, DELETE
http.cors.allow-headers : X-Requested-With,X-Auth-Token,Content-Type, Content-Length
```