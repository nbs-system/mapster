var _ = require('lodash');
var $ = require('jquery');
var numeral = require('numeral');
var dateformat = require('dateformat');
var d3 = require('d3');

var topojson = require('plugins/mapster/lib/topojson.min.js');
var geohash = require('plugins/mapster/lib/latlon-geohash.js');

var module = require('ui/modules').get('mapster');

module.directive('mapster', function (es, $timeout) {

  function link ($scope, $element) {
    /* Shared variables */
    var svg, projection, path;
    var circles_death = [];
    var object_box = null;

    /* Constants */
    var coords = $scope.vis.params.target_coords.replace(/ /g, "").split(',');
    const target_coords = getCoords([parseInt(coords[0]), parseInt(coords[1])]);
    const object_shape = $scope.vis.params.object_shape;
    const object_scale = parseFloat($scope.vis.params.object_scale);
    const object_rotation = parseInt($scope.vis.params.object_rotation); // The object is oriented to the top

    $scope.open = $scope.open || true;

    $scope.toggleLegend = function() {
      $scope.open = !$scope.open;
    }

    /* Render events each time kibana fetches new data */
    $scope.$watch('data', function() {
      render_events();
    });

    /* Revert lat/lon to lon/lat (math view vs world view) */
    function getCoords(coords) {
      return [coords[1], coords[0]];
    }

    /* Transform the object rotation/position etc. */
    function delta(node) {
      var l = node.getTotalLength();
      return function(i) {
        return function(t) {
          var p = node.getPointAtLength(t * l);
          var t2 = Math.min(t + 0.05, 1);
          var p2 = node.getPointAtLength(t2 * l);

          var x = p2.x - p.x;
          var y = p2.y - p.y;
          var r = object_rotation - Math.atan2(-y, x) * 180 / Math.PI;

          return "translate(" + p.x + "," + p.y + ") scale(" + object_scale + ") rotate(" + r + ")";
        }
      }

    }

    /* Set a timeout to remove a circle */
    function prepare_remove_circle(circle) {
      return $timeout(function() {
        circle.transition()
          .attr("r", 0)
          .duration(1000)
          .remove();
      }, 10000);
    }

    /* Set a timeout to display a specific event */
    function show_event(event, diff) {
      $timeout(function() {
        var coords = geohash.decode(event["coords"]);
        coords = getCoords([coords.lat, coords.lon]);

        var circle;
        var route;
        var object;
        var container;

        var color = $scope.colors[event["sensor"]].color;

        var class_ip = "ip-" + event["peer_ip"].replace(/\./g, "_");
        circle = d3.select("." + class_ip);
        if (circle[0][0]) {
          // Already exists, make it bigger !
          var size = parseInt(circle.attr("r")) + 1;
          if (size > 10) size = 10;
          circle.transition()
            .duration(2000)
            .attr("r", size);

          // Don't die !
          $timeout.cancel(circles_death[class_ip]);
        } else {
          // Create circle
          circle = svg.append("circle")
            .attr("r", 0)
            .attr("cx", projection(coords)[0])
            .attr("cy", projection(coords)[1])
            .attr("class", "origin " + class_ip)
            .style("fill", color)
            .style("stroke", "black")
            .style("stroke-width", 1);

          // Make it bigger smoothly
          circle.transition()
            .duration(1000)
            .attr("r", 3);
        }

        // Tell it to die in the future
        circles_death[class_ip] = prepare_remove_circle(circle);

        // Draw the path and the object
        if (object_box != null) {
          route = svg.append("path")
            .datum({type: "LineString", coordinates:[coords, target_coords]})
            .attr("class", "route")
            .attr("d", path);

          var width = object_box.width/-2;
          var height = object_box.height/-2;

          // Container is used to move origin to the center of the object
          container = svg.append("g");
          object = container.append("path")
            .style("fill", color)
            .style("stroke", "black")
            .style("stroke-width", 1)
            .attr("class", "object")
            .attr("transform", "scale("+object_scale+")")
            .attr('transform', 'translate(' + width + ',' + height + ')')
            .attr("d", object_shape);

            // Animate the object
            container.transition()
            .duration(1500)
            .attrTween("transform", delta(route.node()))
            .remove();

            }
        }, diff);
    }


    function show_special_event(event, diff) {
      $timeout(function() {
        var coords = geohash.decode(event["coords"]);
        coords = getCoords([coords.lat, coords.lon]);

        var circle;
        var container;

        var color = $scope.colors[event["sensor"]].color;

        var class_ip = "special ip-" + event["peer_ip"].replace(/\./g, "_");
        circle = d3.select("." + class_ip);
        if (circle[0][0]) {
          // Already exists, make it bigger !
          var size = parseInt(circle.attr("r")) + 1;
          if (size > 15) size = 15;
          circle.transition()
            .duration(3000)
            .attr("r", size);

          // Don't die !
          $timeout.cancel(circles_death[class_ip]);
        } else {
          // Create circle
          circle = svg.append("circle")
            .attr("r", 25)
            .attr("cx", projection(coords)[0])
            .attr("cy", projection(coords)[1])
            .attr("class", "origin " + class_ip)
            .style("fill", color)
            .style("stroke", "red")
            .style("stroke-width", 2);

          // Make it bigger smoothly
          circle.transition()
            .duration(2000)
            .attr("r", 5);
        }

        // Tell it to die in the future
        circles_death[class_ip] = prepare_remove_circle(circle);
      }, diff);
    }


    /* Render events in the data scope */
    function render_events() {
      // Remove old useless elements
      $(".route").remove();

      var list = $scope.data;
      if (list == undefined) {
        return;
      }

      /* Tmp */
      var f = list[0]["timestamp"];
      f = new Date(f); // Remove the +02
      var l = list[list.length-1]["timestamp"];
      l = new Date(l); // Remove the +02
      var wsize = l-f;
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
          for (var j = i; j < list.length-1; j++) {
            if (new Date(list[j]["timestamp"]) > last_date) {
              break;
            } 
            count++;
          }
        }

        /* Make events with same timestamp appear smoothly/distributively on 1 second */
        var diff = date - ref_date;
        diff = diff + 1000/count * index;
        if (list[i]["sensor"] == $scope.vis.params.special_effects) {
          show_special_event(list[i], diff);
        } else {
          show_event(list[i], diff);
        }
        index++;
      }
    }

    /* Render the map */
    function render_map() {
      $element.css({
        height: $element.parent().height(),
        width: '100%'
      });

      var height = $element.height();
      var width = $element.width();

      var scale = (height/300)*100;

      projection = d3.geo.equirectangular()
        .scale(scale)
        .translate([width/2, height/2]);

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
        .attr("d", object_shape);
      object_box = object.node().getBBox();
      object.remove();

      // Draw d3 map
      // The first '/' in the url below is required to really access http://url/plugins/... and not app/plugins
      d3.json('/plugins/mapster/lib/map.topo.json', function(error, world) {
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

