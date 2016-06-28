var _ = require("lodash");
var $ = require("jquery");
var moment = require("moment");
var d3 = require("d3");

var Map = function () {
  /* Attributes */
  var svg, projection, path, logs;
  var OriginDeath = [];
  var ObjectBox = null;
  var SpecialBox = null;
  var config;
  var $timeout;

  function setConfig(c, t) {
    config = c;
    $timeout = t;
  }

  /* Revert lat/lon to lon/lat (math view vs world view) */
  function getCoords(coords) {
    return [coords[1], coords[0]];
  }

  /* Transform the object rotation/position etc. */
  function delta(node) {
    var l = node.getTotalLength();
    return function (i) {
      return function (t) {
        var p = node.getPointAtLength(t * l);
        var t2 = Math.min(t + 0.05, 1);
        var p2 = node.getPointAtLength(t2 * l);

        var x = p2.x - p.x;
        var y = p2.y - p.y;
        var r = config.ObjectRotation - Math.atan2(-y, x) * 180 / Math.PI;

        return "translate(" + p.x + "," + p.y + ") rotate(" + r + ")";
      };
    };

  }

  /* Set a timeout to remove an origin */
  function removeOrigin(origin, time, delay) {
    return $timeout(function () {
      origin.transition()
        .ease("linear")
        .attr("r", 0)
        .duration(time)
        .each("end", function () {
          // Remove IPs from OriginDeath array (free memory)
          var ClassIp = origin[0][0].classList[1];
          delete OriginDeath[ClassIp];
        })
        .remove();
    }, delay);
  }

  function removeExplosion(explosion, delay) {
    $timeout(function () {
      explosion.remove();
    }, delay);
  }

  /* Set a timeout to display a specific event */
  function showEvent(event, color, diff) {
    $timeout(function () {
      var coords = getCoords([event.coords.lat, event.coords.lon]);

      var ClassIp = "ip-" + event.peer_ip.replace(/\./g, "_");
      var origin = d3.select("." + ClassIp);
      var size;

      if (origin[0][0]) {
        // Already exists, stop dying !
        $timeout.cancel(OriginDeath[ClassIp]);
        delete OriginDeath[ClassIp];

        // Make it bigger now :)
        size = parseInt(origin.attr("r"));
        if (size < config.OriginDefaultSize / 2) {
          size = config.OriginDefaultSize;
        } else if (size > config.OriginMaximumSize) {
          size = config.OriginMaximumSize;
        } else {
          size += config.OriginDefaultSize;
        }

        origin.attr("r", size);
      } else {
        // Create origin
        origin = svg.append("circle")
          .attr("r", config.OriginDefaultSize)
          .attr("cx", projection(coords)[0])
          .attr("cy", projection(coords)[1])
          .attr("class", "origin " + ClassIp)
          .style("fill", color)
          .style("stroke", "#333")
          .style("stroke-width", 1);
        size = parseInt(origin.attr("r"));
      }

      // Create a halo
      var halo = svg.append("circle")
        .attr("r", config.OriginDefaultSize)
        .attr("cx", projection(coords)[0])
        .attr("cy", projection(coords)[1])
        .attr("class", "halo " + ClassIp);

      // Make the halo grow and disappear
      halo.transition()
        .duration(2000)
        .attr("r", config.OriginDefaultSize * 4)
        .ease("linear")
        .each("end", function () {
          var halo = d3.select(this);
          halo.transition()
            .ease("linear")
            .duration(1000)
            .attr("r", config.OriginDefaultSize * 5)
            .style("opacity", 0)
            .remove();
        });

      // Make the origin die slowly
      var time = config.OriginDyingTime * size / config.OriginDefaultSize * 1000;
      OriginDeath[ClassIp] = removeOrigin(origin, time, 0);

      // Draw the path and the object
      if (config.multipleTargets) {
        var targetCoords = getCoords([event.target.lat, event.target.lon]);
      } else {
        var targetCoords = getCoords(config.TargetCoords);
      }
      if (ObjectBox !== null) {
        var route = svg.append("path")
          .datum({type: "LineString", coordinates: [coords, targetCoords]})
          .style("stroke", color)
          .attr("class", "route")
          .attr("d", path);

        var width = config.ObjectScale * ObjectBox.width / -2;
        var height = config.ObjectScale * ObjectBox.height / -2;

        // Container is used to move origin to the center of the object
        var container = svg.append("g");
        var object = container.append("path")
          .style("fill", color)
          .style("stroke", "black")
          .style("stroke-width", 1)
          .attr("transform", "translate(" + width + "," + height + ") scale(" + config.ObjectScale + ")")
          .attr("d", config.ObjectShape);

        var duration = 2000;

        // Animate the route
        var MaxLength = route.node().getTotalLength();
        route.transition()
          .duration(duration)
          .attrTween("stroke-dasharray", function () {
            var i = d3.interpolateString("0," + MaxLength, MaxLength + "," + MaxLength);
            return function (t) {
              return i(t);
            };
          })
          .transition()
          .duration(duration * 0.4)
          .ease("linear")
          .attrTween("stroke-dasharray", function () {
            var i = d3.interpolateString(MaxLength + "," + MaxLength, "0," + MaxLength);
            return function (t) {
              return i(t);
            };
          })
          .attrTween("stroke-dashoffset", function () {
            return function (t) {
              return (1 - t) * MaxLength - MaxLength;
            };
          })
          .remove();

        // Animate the object
        container.transition()
          .duration(duration)
          .attrTween("transform", delta(route.node()))
          .remove();

      }
    }, diff);
  }

  function showSpecialEvent(event, diff) {
    $timeout(function () {
      var coords = getCoords([event.coords.lat, event.coords.lon]);

      // Draw the path and the object
      if (config.multipleTargets) {
        var targetCoords = getCoords([event.target.lat, event.target.lon]);
      } else {
        var targetCoords = getCoords(config.TargetCoords);
      }
      if (ObjectBox !== null) {
        var route = svg.append("path")
          .datum({type: "LineString", coordinates: [targetCoords, coords]})
          .attr("class", "route")
          .attr("d", path);

        var width = config.SpecialEffectsScale * ObjectBox.width / -2;
        var height = config.SpecialEffectsScale * ObjectBox.height / -2;

        // Container is used to move origin to the center of the object
        var container = svg.append("g");
        var object = container.append("path")
          .style("fill", "orange")
          .style("stroke", "black")
          .style("stroke-width", 1)
          .attr("transform", "translate(" + width + "," + height + ") scale(" + config.SpecialEffectsScale + ")")
          .attr("d", config.ObjectShape);

        // Animate the object
        var PathDuration = 4000;
        container.transition()
          .ease("linear")
          .duration(PathDuration)
          .attrTween("transform", delta(route.node()))
          .remove();

      }

      var ClassIp = "ban_ip-" + event.peer_ip.replace(/\./g, "_");

      $timeout(function () {
        // Create origin cross
        var width = config.SpecialShapeScale * SpecialBox.width / -2;
        var height = config.SpecialShapeScale * SpecialBox.height / -2;

        // Container is used to move origin to the center of the object
        var container = svg.append("g");
        var origin = container.append("path")
          .style("fill", "red")
          .style("stroke", "black")
          .style("stroke-width", 1)
          .attr("transform", "translate(" + width + "," + height + ") scale(" + config.SpecialShapeScale + ")")
          .attr("d", config.SpecialShape);
        container.attr("transform", "translate(" + projection(coords)[0] + "," + projection(coords)[1] + ")");

        // Create a halo
        var halo = svg.append("circle")
          .attr("r", 10)
          .style("stroke", "red")
          .style("stroke-width", 2)
          .attr("cx", projection(coords)[0])
          .attr("cy", projection(coords)[1])
          .attr("class", "halo " + ClassIp);

        // Make the halo grow and disappear
        halo.transition()
          .duration(3000)
          .attr("r", 25)
          .ease("linear")
          .each("end", function () {
            var halo = d3.select(this);
            halo.transition()
              .ease("linear")
              .duration(1000)
              .attr("r", 30)
              .style("opacity", 0)
              .remove();
          });

        // Tell it to die in the future
        OriginDeath[ClassIp] = removeOrigin(origin, 5000, config.SpecialShapeRemaining);

        // Create explosion
        if (config.EnableExplosion) {
          var explosion = svg.append("svg:image")
            .attr("class", "explosion")
            .attr("xlink:href", "/plugins/mapster/img/" + config.ExplosionFile + "?" + Date.now()) // ?param is a little trick to force gif to reload
            .attr("width", config.ExplosionWidth)
            .attr("height", config.ExplosionHeight)
            .attr("x", projection(coords)[0] - config.ExplosionWidth / 2)
            .attr("y", projection(coords)[1] - config.ExplosionHeight);
          removeExplosion(explosion, config.ExplosionDelay);
        }

        // Remove route
        route.remove();
      }, PathDuration);

    }, diff);
  }

  /* Show the event in the log list */
  function showEventLog(event, color, diff) {
    $timeout(function () {
      // Create new row
      var tr = logs.append("tr");
      tr.html("<td>" + moment(event.timestamp).format('YYYY-MM-DD HH:mm:ss') + "</td><td>" + event.coords.lat + ","
        + event.coords.lon + "</td><td>" + event.peer_ip + "</td><td style=\"color: " + color + "\">" + event.sensor + "</td>");

      // Remove extra elements
      var l = logs[0][0];
      if (l.children.length >= config.maximumEvents) {
        l.deleteRow(0);
      }
    }, diff);
  }


  /* Render events in the data scope */
  function renderEvents(list, colors) {
    if (list === null || typeof list == "undefined") {
      return;
    }

    /* Tmp */
    var f = list[0]["timestamp"];
    f = new Date(f); // Remove the +02
    var l = list[list.length - 1]["timestamp"];
    l = new Date(l); // Remove the +02
    var wsize = l - f;
    console.log("Window time size:", wsize);
    /* Tmp */

    var RefDate = new Date(list[0]["timestamp"]);
    var LastDate = RefDate;
    var count = 0;
    var index = 0;

    for (var i = 0; i < list.length; i++) {
      var date = new Date(list[i]["timestamp"]);

      /* Count should be at 0 when the condition is triggered */
      if (date > LastDate) {
        LastDate = date;
        index = 0;
      }

      /* Recount events with same timestamp */
      if (count === 0) {
        for (var j = i; j < list.length - 1; j++) {
          if (new Date(list[j]["timestamp"]) > LastDate) {
            break;
          }
          count++;
        }
      }

      /* Make events with same timestamp appear smoothly/distributively on 1 second */
      // TODO Improve this (it pauses before switching to another second 
      var diff = date - RefDate;
      diff = diff + 1000 / count * index;

      var color = colors[list[i]["sensor"]].color;

      if ($.inArray(list[i]["sensor"], config.SpecialEffects) > -1) {
        showSpecialEvent(list[i], diff);
        showEventLog(list[i], color, diff);
      } else {
        /* Should we display unlocated events ? */
        if (config.HideUnlocated) {
          var coords = list[i]["coords"];
          var unlocated = (coords.lat | 0) === 0 && (coords.lon | 0) === 0;
          if (!unlocated) {
            showEvent(list[i], color, diff);
            showEventLog(list[i], color, diff);
          }
        } else {
          showEvent(list[i], color, diff);
          showEventLog(list[i], color, diff);
        }
      }
      index++;
    }
  }

  /* Render the map */
  function renderMap(element) {
    if (element === null || typeof element == "undefined") {
      console.error("Could not draw the map, the element is missing !");
      return;
    }

    element.css({
      height: element.parent().height(),
      width: "100%"
    });

    var height = element.height();
    var width = element.width();

    var scale = (height / 300) * 100;

    projection = d3.geo.equirectangular()
      .scale(scale)
      .translate([width / 2, height / 2]);

    path = d3.geo.path()
      .projection(projection);

    svg = d3.select("mapster").append("svg")
      .attr("width", "100%")
      .attr("height", "99%");

    // Declare svg elem to make objects appear above the map
    var map = svg.append("svg")
      .attr("width", element.parent().width())
      .attr("height", element.parent().height());

    // Draw a sample object to get its size
    var object = svg.append("path")
      .attr("d", config.ObjectShape);
    ObjectBox = object.node().getBBox();
    object.remove();

    // Draw a sample special object to get its size
    var special = svg.append("path")
      .attr("d", config.SpecialShape);
    SpecialBox = special.node().getBBox();
    special.remove();

    // Draw d3 map
    // The first "/" in the url below is required to really access http://url/plugins/... and not app/plugins
    d3.json("/plugins/mapster/lib/map.topo.json", function (error, world) {
      var countries = require("plugins/mapster/lib/topojson.min.js").feature(world, world.objects.collection).features;
      map.selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path);
    });

    // Get log table
    logs = d3.select("#logs");
  }

  this.setConfig = setConfig;
  this.renderEvents = renderEvents;
  this.renderMap = renderMap;

  return this;

};

module.exports = new Map();
