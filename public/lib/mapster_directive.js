var _ = require('lodash');
var $ = require('jquery');
var numeral = require('numeral');
var dateformat = require('dateformat');

// TODO Remove d3 lib it's already in kibana
var d3 = require('plugins/mapster/lib/d3.min.js');
var topojson = require('plugins/mapster/lib/topojson.min.js');
var geohash = require('plugins/mapster/lib/latlon-geohash.js');

var module = require('ui/modules').get('mapster');

module.directive('mapster', function (es, $timeout) {

  function link (scope, element) {

    var refresh_rate = 10; // Seconds
    var current_refresh = 1000; // Ms
    var target_coords = getCoords([48.85, 2.34]);

    var svg, projection, path;

    var circles_death = [];

    scope.$watch('data', function() {
      render_events();
    });

    //THIS FUNCTION IS NEEDED BECAUSE WORLD COORDS != MAP COORDS
    function getCoords(coords) {
      return [coords[1], coords[0]];
    }

    function delta(node) {
      var l = node.getTotalLength();
      return function(i) {
        return function(t) {
          var p = node.getPointAtLength(t * l);
          var t2 = Math.min(t + 0.05, 1);
          var p2 = node.getPointAtLength(t2 * l);

          var x = p2.x - p.x;
          var y = p2.y - p.y;
          var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;
          //var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.5);
          //return "translate(" + p.x + "," + p.y + ") scale(" + s + ") rotate(" + r + ")";
          var posX = p.x - 1;
          var posY = p.y - 1;
          return "translate(" + posX + "," + posY + ") scale(0.4) rotate(" + r + ")";
        }
      }

    }

    function get_event_color(e) {
      var color = {
        'apache_404': 'red',
        'naxsi': 'green',
        'naxsi_learning': 'yellow',
        'nginx_auth': 'blue',
        'naxsi_uwa': 'purple'
      };

      return color[e["sensor"]];
    }

    function prepare_remove_circle(circle) {
      return $timeout(function() {
        circle.transition()
          .attr("r", 0)
          .duration(1000)
          .remove();
      }, refresh_rate * 1000);
    }

    function show_event(i, event, diff) {
      $timeout(function() {
        /****** Draw it ! ******/
        var coords = geohash.decode(event["coords"]);
        coords = getCoords([coords.lat, coords.lon]);

        var circle;
        var route;
        var object;

        var color = get_event_color(event);

        var class_ip = "ip-" + event["peer_ip"].replace(/\./g, "_");
        circle = d3.select("." + class_ip);
        if (circle[0][0]) {
          // Already exists, make it bigger !
          var size = circle.attr("r") + 1;
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

        route = svg.append("path")
          .datum({type: "LineString", coordinates:[coords, target_coords]})
          .attr("class", "route")
          .attr("d", path);

        object = svg.append("path")
          .style("fill", color)
          .style("stroke", "black")
          .style("stroke-width", 1)
          .attr("class", "object")
          .attr("d", "M7.411 21.39l-4.054 2.61-.266-1.053c-.187-.744-.086-1.534.282-2.199l2.617-4.729c.387 1.6.848 3.272 1.421 5.371zm13.215-.642l-2.646-4.784c-.391 1.656-.803 3.22-1.369 5.441l4.032 2.595.266-1.053c.186-.743.085-1.533-.283-2.199zm-10.073 3.252h2.895l.552-2h-4l.553 2zm1.447-24c-3.489 2.503-5 5.488-5 9.191 0 3.34 1.146 7.275 2.38 11.809h5.273c1.181-4.668 2.312-8.577 2.347-11.844.04-3.731-1.441-6.639-5-9.156zm.012 2.543c1.379 1.201 2.236 2.491 2.662 3.996-.558.304-1.607.461-2.674.461-1.039 0-2.072-.145-2.641-.433.442-1.512 1.304-2.824 2.653-4.024z");

        var node = route.node();
        var l = node.getTotalLength();

        object.transition()
          .duration(1500)
          .attrTween("transform", delta(node))
          .remove();
      }, diff);
    }

    function render_events() {
      // Remove old useless elements
      $(".route").remove();

      var list = scope.data;

      console.log("Computing", list.length, "events.");

      /* Tmp */
      var f = list[0]["timestamp"];
      console.log(f);
      f = new Date(f); // Remove the +02
      console.log(f);

      var l = list[list.length-1]["timestamp"];
      console.log(l);
      l = new Date(l); // Remove the +02
      console.log(l);

      var wsize = l-f;
      console.log("Window time size:", wsize);
      current_refresh = wsize;
      /* Tmp */

      var ref_date = list[0]["timestamp"];
      ref_date = new Date(ref_date);
      console.log(ref_date);

      for (var i = 0; i < list.length; i++) {
        var date = list[i]["timestamp"];
        date = new Date(date);

        var diff = date - ref_date;
        diff = diff + 50*i;

        show_event(i, list[i], diff);
      }
    }

    function render_map() {
      element.css({
        height: element.parent().height(),
        width: '100%'
      });

      var height = element.height();
      var width = element.width();

      //TODO Compute scale automatically depending on window size
      var scale = (height/300)*100;

      projection = d3.geo.equirectangular()
        .scale(scale)
        .translate([width/2, height/2]);

      path = d3.geo.path()
        .projection(projection);

      svg = d3.select("mapster").append("svg")
        .attr("width", element.parent().width())
        .attr("height", element.parent().height());

      // Declare svg elem to make objects appear above the map
      var map = svg.append("svg")
        .attr("width", element.parent().width())
        .attr("height", element.parent().height());

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

    $timeout(render_map, 200);

  }

  return {
    restrict: 'E',
    scope: {
      data: '='
    },
    link: link
  };
});

