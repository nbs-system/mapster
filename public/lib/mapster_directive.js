var _ = require("lodash");
var $ = require("jquery");
var numeral = require("numeral");
var dateformat = require("plugins/mapster/lib/dateformat.js");
var d3 = require("d3");

var topojson = require("plugins/mapster/lib/topojson.min.js");

var module = require("ui/modules").get("mapster");

module.directive("mapster", function (es, $timeout) {

  function link($scope, $element) {
    /* Shared variables */
    var svg, projection, path;
    var OriginDeath = [];
    var ObjectBox = null;
    var SpecialBox = null;

    /* Constants TODO Use `const` instead of `var` but what happens when loadConfig is called ? */
    var coords;
    var OriginDefaultSize;
    var OriginMaximumSize;
    var OriginDyingTime;
    var TargetCoords;
    var ObjectShape;
    var ObjectScale;
    var ObjectRotation;
    var SpecialShape;
    var SpecialShapeScale;
    var SpecialShapeRemaining;
    var HideUnlocated;
    var EnableExplosion;
    var ExplosionFile;
    var ExplosionWidht;
    var ExplosionHeight;
    var ExplosionDelay;

    /* Revert lat/lon to lon/lat (math view vs world view) */
    function getCoords(coords) {
      return [coords[1], coords[0]];
    }

    /* (re)load the configuration */
    function loadConfig() {
      coords = $scope.vis.params.TargetCoords.replace(/ /g, "").split(",");
      OriginDefaultSize = parseInt($scope.vis.params.OriginDefaultSize);
      OriginMaximumSize = parseInt($scope.vis.params.OriginMaximumSize);
      OriginDyingTime = parseInt($scope.vis.params.OriginDyingTime);
      TargetCoords = getCoords([parseInt(coords[0]), parseInt(coords[1])]);
      ObjectShape = $scope.vis.params.ObjectShape;
      ObjectScale = parseFloat($scope.vis.params.ObjectScale);
      ObjectRotation = parseInt($scope.vis.params.ObjectRotation);
      SpecialShape = $scope.vis.params.SpecialShape;
      SpecialShapeScale = parseFloat($scope.vis.params.SpecialShapeScale);
      SpecialShapeRemaining = parseInt($scope.vis.params.SpecialShapeRemaining);
      HideUnlocated = $scope.vis.params.HideUnlocated;
      EnableExplosion = $scope.vis.params.EnableExplosion;
      ExplosionFile = $scope.vis.params.ExplosionFile;
      ExplosionHeight = parseInt($scope.vis.params.ExplosionHeight);
      ExplosionWidht = parseInt($scope.vis.params.ExplosionWidht);
      ExplosionDelay = parseInt($scope.vis.params.ExplosionDelay);
    }

    /* Transform the object rotation/position etc. */
    function delta(node, scale) {
      var l = node.getTotalLength();
      return function (i) {
        return function (t) {
          var p = node.getPointAtLength(t * l);
          var t2 = Math.min(t + 0.05, 1);
          var p2 = node.getPointAtLength(t2 * l);

          var x = p2.x - p.x;
          var y = p2.y - p.y;
          var r = ObjectRotation - Math.atan2(-y, x) * 180 / Math.PI;

          return "translate(" + p.x + "," + p.y + ") scale(" + scale + ") rotate(" + r + ")";
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
      $timeout(function() {
        explosion.remove();
      }, delay);
    }

    /* Set a timeout to display a specific event */
    function showEvent(event, diff) {
      $timeout(function () {
        var coords = getCoords([event["coords"].lat, event["coords"].lon]);

        var color = $scope.colors[event["sensor"]].color;

        var ClassIp = "ip-" + event["peer_ip"].replace(/\./g, "_");
        var origin = d3.select("." + ClassIp);
        var size;

        if (origin[0][0]) {
          // Already exists, stop dying !
          $timeout.cancel(OriginDeath[ClassIp]);
          delete OriginDeath[ClassIp];

          // Make it bigger now :)
          size = parseInt(origin.attr("r"));
          if (size < OriginDefaultSize / 2) {
            size = OriginDefaultSize;
          } else if (size > OriginMaximumSize) {
            size = OriginMaximumSize;
          } else {
            size += OriginDefaultSize;
          }

          origin.attr("r", size);
        } else {
          // Create origin
          origin = svg.append("circle")
            .attr("r", OriginDefaultSize)
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
          .attr("r", OriginDefaultSize)
          .attr("cx", projection(coords)[0])
          .attr("cy", projection(coords)[1])
          .attr("class", "halo " + ClassIp);

        // Make the halo grow and disappear
        halo.transition()
          .duration(2000)
          .attr("r", OriginDefaultSize * 4)
          .ease("linear")
          .each("end", function () {
            var halo = d3.select(this);
            halo.transition()
              .ease("linear")
              .duration(1000)
              .attr("r", OriginDefaultSize * 5)
              .style("opacity", 0)
              .remove();
          });

        // Make the origin die slowly
        var time = OriginDyingTime * size / OriginDefaultSize * 1000;
        OriginDeath[ClassIp] = removeOrigin(origin, time, 0);

        // Draw the path and the object
        if (ObjectBox != null) {
          var route = svg.append("path")
            .datum({type: "LineString", coordinates: [coords, TargetCoords]})
            .style("stroke", color)
            .attr("class", "route")
            .attr("d", path);

          var width = ObjectBox.width / -2; //TODO Wtf scale is not needed here but below yes
          var height = ObjectBox.height / -2;

          // Container is used to move origin to the center of the object
          var container = svg.append("g");
          var object = container.append("path")
            .style("fill", color)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("transform", "translate(" + width + "," + height + ")")
            .attr("d", ObjectShape);

          var duration = 2000;

          // Animate the route
          var MaxLength = route.node().getTotalLength();
          route.transition()
            .duration(duration)
            .attrTween("stroke-dasharray", function() {
              var i = d3.interpolateString("0," + MaxLength, MaxLength + "," + MaxLength);
              return function(t) {
                return i(t);
              }
            })
            .transition()
              .duration(duration*0.4)
              .ease("linear")
              .attrTween("stroke-dasharray", function() {
                var i = d3.interpolateString(MaxLength + "," + MaxLength, "0," + MaxLength);
                return function(t) {
                  return i(t);
                }
              })
              .attrTween("stroke-dashoffset", function() {
                return function(t) {
                  return (1-t)*MaxLength - MaxLength;
                }
              })
            .remove();

          // Animate the object
          container.transition()
            .duration(duration)
            .attrTween("transform", delta(route.node(), ObjectScale))
            .remove();

        }
      }, diff);
    }

    function showSpecialEvent(event, diff) {
      $timeout(function () {
        var coords = getCoords([event["coords"].lat, event["coords"].lon]);

        // Draw the path and the object
        if (ObjectBox != null) {
          var route = svg.append("path")
            .datum({type: "LineString", coordinates: [TargetCoords, coords]})
            .attr("class", "route")
            .attr("d", path);

          var width = ObjectBox.width / -2; //TODO Wtf scale is not needed here but below yes
          var height = ObjectBox.height / -2;

          // Container is used to move origin to the center of the object
          var container = svg.append("g");
          var object = container.append("path")
            .style("fill", "orange")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("transform", "translate(" + width + "," + height + ")")
            .attr("d", ObjectShape);

          // Animate the object
          var PathDuration = 4000;
          container.transition()
            .ease("linear")
            .duration(PathDuration)
            .attrTween("transform", delta(route.node(), ObjectScale * 2))
            .remove();

        }

        var color = $scope.colors[event["sensor"]].color;
        var ClassIp = "ban_ip-" + event["peer_ip"].replace(/\./g, "_");

        $timeout(function () {
          // Create origin cross
          var width = SpecialShapeScale * SpecialBox.width / -2;
          var height = SpecialShapeScale * SpecialBox.height / -2;

          // Container is used to move origin to the center of the object
          var container = svg.append("g");
          var origin = container.append("path")
            .style("fill", "red")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("transform", "translate(" + width + "," + height + ") scale(" + SpecialShapeScale + ")")
            .attr("d", SpecialShape);
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
          OriginDeath[ClassIp] = removeOrigin(origin, 5000, SpecialShapeRemaining);

          // Create explosion
          if (EnableExplosion) {
            var explosion = svg.append("svg:image")
              .attr("class", "explosion")
              .attr("xlink:href", "/plugins/mapster/img/" + ExplosionFile + "?" + Date.now()) // ?param is a little trick to force gif to reload
              .attr("width", ExplosionWidht)
              .attr("height", ExplosionHeight)
              .attr("x", projection(coords)[0]-ExplosionWidht/2)
              .attr("y", projection(coords)[1]-ExplosionHeight);
            removeExplosion(explosion, ExplosionDelay);
          }

          // Remove route
          route.remove();
        }, PathDuration);

      }, diff);
    }


    /* Render events in the data scope */
    function renderEvents() {
      var list = $scope.data;
      if (list == null) {
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
        var diff = date - RefDate;
        diff = diff + 1000 / count * index;

        if (list[i]["sensor"] === $scope.vis.params.special_effects) {
          showSpecialEvent(list[i], diff);
        } else {
          /* Should we display unlocated events ? */
          if (HideUnlocated) {
            var coords = list[i]["coords"];
            var unlocated = (coords.lat | 0) === 0 && (coords.lon | 0) === 0;
            if (!unlocated) {
              showEvent(list[i], diff);
            }
          } else {
            showEvent(list[i], diff);
          }
        }
        index++;
      }
    }

    /* Render the map */
    function renderMap() {
      loadConfig();
      $element.css({
        height: $element.parent().height(),
        width: "100%"
      });

      var height = $element.height();
      var width = $element.width();

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
        .attr("width", $element.parent().width())
        .attr("height", $element.parent().height());

      // Draw a sample object to get its size
      var object = svg.append("path")
        .attr("transform", "scale(" + ObjectScale + ")")
        .attr("d", ObjectShape);
      ObjectBox = object.node().getBBox();
      object.remove();

      // Draw a sample special object to get its size
      var special = svg.append("path")
        .attr("d", SpecialShape);
      SpecialBox = special.node().getBBox();
      special.remove();

      // Draw d3 map
      // The first "/" in the url below is required to really access http://url/plugins/... and not app/plugins
      d3.json("/plugins/mapster/lib/map.topo.json", function (error, world) {
        var countries = topojson.feature(world, world.objects.collection).features;
        map.selectAll(".country")
          .data(countries)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path);
      });
    }

    $scope.open = $scope.open || true;

    $scope.toggleLegend = function () {
      $scope.open = !$scope.open;
    };

    /* Render events each time kibana fetches new data */
    $scope.$watch("data", function () {
      renderEvents();
    });

    /* Redraw everything when options are modified */
    $scope.$watch("vis.params", loadConfig);

    // First map render is a bit postponed otherwise it does not work
    $timeout(renderMap, 100);

  }

  return {
    restrict: "E",
    link: link
  };
});

