# Mapster

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/893661b4aa2f45378d96c21768b7ea8b)](https://www.codacy.com?utm_source=github.com&amp;utm_content=xarkes/mapster&amp;utm_campaign=Badge_Grade)

Mapster is a real-time event map implemented as a [Kibana](https://github.com/elastic/kibana) [visualization](https://www.elastic.co/guide/en/kibana/current/visualize.html).

# How does it work
Mapster is not truely in real-time. It fetches the events from ElasticSearch using Kibana and replays the events in real
time with a lag corresponding to the Kibana refresh time.

For best performances, Kibana dashboard should be set to collect events from last 30 seconds and to refresh every 30 seconds too.
The refresh rate should be equal to the window time.

To draw the map, Mapster uses [d3js](https://d3js.org/).

# Installation
## Requirements
- Kibana 4.5.0 (the only supported version for now)

## Instructions
Simply clone the repository into your Kibana plugins folder:
```sh
cd installedPlugins && git clone https://github.com/xarkes/mapster
```

If you are using Kibana from git and starting it in `dev` mode, Kibana will automatically refresh its cache and the plugin
will be successfully loaded.
Otherwise you can force it by stopping kibana, deleting the cache and starting kibana again.
```sh
rm -r optimize/bundles
./bin/kibana
```

From now, you should see that Mapster is available in the Visualization tab of Kibana. Now set your kibana events to
last 30 seconds, enable auto-refresh and enjoy !

# Configuration
To add Mapster to a dashboard, first create a new [visualization](https://www.elastic.co/guide/en/kibana/current/visualize.html).

## Choosing correct aggregations
The metric should be set to `Count`.

The first aggregation is as described the timestamp matching the event. You should use a `Date Histogram` with the Interval set to `Seconds`.

The second aggregation is the event coordinates so you have to use a `Geohash` matching the event's origin.

The third aggregation is the target IP. It is used to aggregate multiple events from the same IP on the map.

The fourth aggregation is the sensor. The sensor is used to differentiate event types on the map.

Then you can add any other aggregation if you need to filter your events using the kibana search field.

## Plugin options
| Option name              | Meaning                                                                               |
|--------------------------|---------------------------------------------------------------------------------------|
| Special effects          | The sensor field used to display the event as a special effect.                       |
| Object shape             | The svg shape of the object thrown from the origin to the target.                     |
| Object scale             | The scale of the above shape.                                                         |
| Object rotation          | The object rotation. If the object is looking to the top, the rotation is 90 degrees. |
| Target coords            | This is the location on the map of the target.                                        |
| Special shape            | Shape used to mark a special event on the map.                                        |
| Special scale            | The scale of the above shape.                                                         |
| Special remaining time   | The duration the special shape stays on the map.                                      |
| Origin default size      | The default size of a circle (origin).                                                |
| Origin maximum size      | The maximum size used to avoid having too big circles.                                |
| Origin dying time        | The time the origin dies.                                                             |


# Screenshots
![Mapster](/docs/mapster.png?raw=true "Mapster")
