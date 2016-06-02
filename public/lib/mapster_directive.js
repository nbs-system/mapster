var _ = require('lodash');
var $ = require('jquery');
var numeral = require('numeral');
var dateformat = require('plugins/mapster/lib/dateformat.js');
var d3 = require('d3');

var topojson = require('plugins/mapster/lib/topojson.min.js');

var module = require('ui/modules').get('mapster');

module.directive('mapster', function (es, $timeout) {

  function link($scope, $element) {
    /* Shared variables */
    var svg, projection, path;
    var origin_death = [];
    var object_box = null;
    var special_box = null;

    /* Constants TODO Use `const` instead of `var` but what happens when load_config is called ? */
    var coords;
    var origin_default_size;
    var origin_maximum_size;
    var origin_dying_time;
    var target_coords;
    var object_shape;
    var object_scale;
    var object_rotation;
    var special_shape;
    var special_shape_scale;
    var special_shape_remaining;
    var hide_unlocated;

    $scope.open = $scope.open || true;

    $scope.toggleLegend = function () {
      $scope.open = !$scope.open;
    };

    /* Render events each time kibana fetches new data */
    $scope.$watch('data', function () {
      render_events();
    });

    /* Redraw everything when options are modified */
    $scope.$watch('vis.params', load_config);

    function load_config() {
      coords = $scope.vis.params.target_coords.replace(/ /g, "").split(',');
      origin_default_size = parseInt($scope.vis.params.origin_default_size);
      origin_maximum_size = parseInt($scope.vis.params.origin_maximum_size);
      origin_dying_time = parseInt($scope.vis.params.origin_dying_time);
      target_coords = getCoords([parseInt(coords[0]), parseInt(coords[1])]);
      object_shape = $scope.vis.params.object_shape;
      object_scale = parseFloat($scope.vis.params.object_scale);
      object_rotation = parseInt($scope.vis.params.object_rotation);
      special_shape = $scope.vis.params.special_shape;
      special_shape_scale = parseFloat($scope.vis.params.special_shape_scale);
      special_shape_remaining = parseInt($scope.vis.params.special_shape_remaining);
      hide_unlocated = $scope.vis.params.hide_unlocated;
    }

    /* Revert lat/lon to lon/lat (math view vs world view) */
    function getCoords(coords) {
      return [coords[1], coords[0]];
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
          var r = object_rotation - Math.atan2(-y, x) * 180 / Math.PI;

          return "translate(" + p.x + "," + p.y + ") scale(" + scale + ") rotate(" + r + ")";
        }
      }

    }

    /* Set a timeout to remove an origin */
    function remove_origin(origin, time, delay) {
      return $timeout(function () {
        origin.transition()
          .ease("linear")
          .attr("r", 0)
          .duration(time)
          .each("end", function () {
            // Remove IPs from origin_death array (free memory)
            var class_ip = origin[0][0].classList[1];
            delete origin_death[class_ip];
          })
          .remove();
      }, delay);
    }

    /* Set a timeout to display a specific event */
    function show_event(event, diff) {
      $timeout(function () {
        var coords = getCoords([event["coords"].lat, event["coords"].lon]);

        var color = $scope.colors[event["sensor"]].color;

        var class_ip = "ip-" + event["peer_ip"].replace(/\./g, "_");
        var origin = d3.select("." + class_ip);
        var size;

        if (origin[0][0]) {
          // Already exists, stop dying !
          $timeout.cancel(origin_death[class_ip]);
          delete origin_death[class_ip];

          // Make it bigger now :)
          size = parseInt(origin.attr("r"));
          if (size < origin_default_size / 2) {
            size = origin_default_size;
          } else if (size > origin_maximum_size) {
            size = origin_maximum_size;
          } else {
            size += origin_default_size;
          }

          origin.attr("r", size);
        } else {
          // Create origin
          origin = svg.append("circle")
            .attr("r", origin_default_size)
            .attr("cx", projection(coords)[0])
            .attr("cy", projection(coords)[1])
            .attr("class", "origin " + class_ip)
            .style("fill", color)
            .style("stroke", "#333")
            .style("stroke-width", 1);
          size = parseInt(origin.attr("r"));
        }

        // Create a halo
        var halo = svg.append("circle")
          .attr("r", origin_default_size)
          .attr("cx", projection(coords)[0])
          .attr("cy", projection(coords)[1])
          .attr("class", "halo " + class_ip);

        // Make the halo grow and disappear
        halo.transition()
          .duration(2000)
          .attr("r", origin_default_size * 4)
          .ease("linear")
          .each("end", function () {
            var halo = d3.select(this);
            halo.transition()
              .ease("linear")
              .duration(1000)
              .attr("r", origin_default_size * 5)
              .style("opacity", 0)
              .remove();
          });

        // Make the origin die slowly
        var time = origin_dying_time * size / origin_default_size * 1000;
        origin_death[class_ip] = remove_origin(origin, time, 0);

        // Draw the path and the object
        if (object_box != null) {
          var route = svg.append("path")
            .datum({type: "LineString", coordinates: [coords, target_coords]})
            .style("stroke", color)
            .attr("class", "route")
            .attr("d", path);

          var width = object_box.width / -2; //TODO Wtf scale is not needed here but below yes
          var height = object_box.height / -2;

          // Container is used to move origin to the center of the object
          var container = svg.append("g");
          var object = container.append("path")
            .style("fill", color)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr('transform', 'translate(' + width + ',' + height + ')')
            .attr("d", object_shape);

          var duration = 2000;

          // Animate the route
          route.transition()
            .duration(duration)
            .attrTween("stroke-dasharray", function () {
              var l = route.node().getTotalLength();
              return d3.interpolateString("0," + l, l + "," + l);
            })
            .remove();

          // Animate the object
          container.transition()
            .duration(duration)
            .attrTween("transform", delta(route.node(), object_scale))
            .remove();

        }
      }, diff);
    }

    function show_special_event(event, diff) {
      $timeout(function () {
        coords = getCoords([coords.lat, coords.lon]);

        // Draw the path and the object
        if (object_box != null) {
          var route = svg.append("path")
            .datum({type: "LineString", coordinates: [target_coords, coords]})
            .attr("class", "route")
            .attr("d", path);

          var width = object_box.width / -2; //TODO Wtf scale is not needed here but below yes
          var height = object_box.height / -2;

          // Container is used to move origin to the center of the object
          var container = svg.append("g");
          var object = container.append("path")
            .style("fill", "orange")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("transform", "translate(" + width + "," + height + ")")
            .attr("d", object_shape);

          // Animate the object
          var path_duration = 4000;
          container.transition()
            .ease("linear")
            .duration(path_duration)
            .attrTween("transform", delta(route.node(), object_scale * 2))
            .remove();

        }

        var color = $scope.colors[event["sensor"]].color;
        var class_ip = "ban_ip-" + event["peer_ip"].replace(/\./g, "_");

        $timeout(function () {
          // Create origin cross
          var width = special_shape_scale * special_box.width / -2;
          var height = special_shape_scale * special_box.height / -2;

          // Container is used to move origin to the center of the object
          var container = svg.append("g");
          var origin = container.append("path")
            .style("fill", "red")
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("transform", "translate(" + width + "," + height + ") scale(" + special_shape_scale + ")")
            .attr("d", special_shape);
          container.attr("transform", "translate(" + projection(coords)[0] + "," + projection(coords)[1] + ")");

          // Create a halo
          var halo = svg.append("circle")
            .attr("r", 10)
            .style("stroke", "red")
            .style("stroke-width", 2)
            .attr("cx", projection(coords)[0])
            .attr("cy", projection(coords)[1])
            .attr("class", "halo " + class_ip);

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
          origin_death[class_ip] = remove_origin(origin, 5000, special_shape_remaining);
        }, path_duration);

      }, diff);
    }


    /* Render events in the data scope */
    function render_events() {
      var list = $scope.data;
      if (list == undefined) {
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

      var ref_date = new Date(list[0]["timestamp"]);
      var last_date = ref_date;
      var count = 0;
      var index = 0;

      for (var i = 0; i < list.length; i++) {
        var date = new Date(list[i]["timestamp"]);

        /* Count should be at 0 when the condition is triggered */
        if (date > last_date) {
          last_date = date;
          index = 0;
        }

        /* Recount events with same timestamp */
        if (count == 0) {
          for (var j = i; j < list.length - 1; j++) {
            if (new Date(list[j]["timestamp"]) > last_date) {
              break;
            }
            count++;
          }
        }

        /* Make events with same timestamp appear smoothly/distributively on 1 second */
        var diff = date - ref_date;
        diff = diff + 1000 / count * index;

        if (list[i]["sensor"] == $scope.vis.params.special_effects) {
          show_special_event(list[i], diff);
        } else {
          /* Should we display unlocated events ? */
          if (hide_unlocated) {
            var coords = list[i]["coords"];
            var unlocated = (coords | 0) == 0 && (coords.lon | 0) == 0;
            if (!unlocated) {
              show_event(list[i], diff);
            }
          } else {
            show_event(list[i], diff);
          }
        }
        index++;
      }
    }

    /* Render the map */
    function render_map() {
      load_config();
      $element.css({
        height: $element.parent().height(),
        width: '100%'
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
        .attr("transform", "scale(" + object_scale + ")")
        .attr("d", object_shape);
      object_box = object.node().getBBox();
      object.remove();

      // Draw a sample special object to get its size
      var special = svg.append("path")
        .attr("d", special_shape);
      special_box = special.node().getBBox();
      special.remove();

      // Draw d3 map
      // The first '/' in the url below is required to really access http://url/plugins/... and not app/plugins
      d3.json('/plugins/mapster/lib/map.topo.json', function (error, world) {
        var countries = topojson.feature(world, world.objects.collection).features;
        map.selectAll(".country")
          .data(countries)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path);
      });
    }

    // First map render is a bit postponed otherwise it does not work
    $timeout(render_map, 100);

  }

  return {
    restrict: 'E',
    link: link
  };
});

