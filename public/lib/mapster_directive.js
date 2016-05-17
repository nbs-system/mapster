var _ = require('lodash');
var $ = require('jquery');
var numeral = require('numeral');
//require('plugins/mapster/lib/svg.js');
var d3 = require('plugins/mapster/lib/d3.js');
var topojson = require('plugins/mapster/lib/topojson.js');
var map_data = require('plugins/mapster/lib/map.json');

// jvectormap - version 2.0.3
require('plugins/mapster/lib/jvectormap/jquery-jvectormap.min');
require('plugins/mapster/lib/jvectormap/jquery-jvectormap.css');

var module = require('ui/modules').get('mapster');

module.directive('vectormap', function (es) {

  function link (scope, element) {

    function onSizeChange() {
      return {
        width: element.parent().width(),
        height: element.parent().height()
      };
    }

    function displayFormat(val) {
      var formats = {
        number: '0[.]0a',
        bytes: '0[.]0b',
        currency: '$0[.]00a',
        percentage: '0%'
      }

      return formats[val] || formats.number;
    }

    /*scope.$watch('data',function(){
      render();
      });

      scope.$watch('options',function(){
      render();
      });*/

    scope.$watch(onSizeChange, _.debounce(function () {
      console.log("ONSIZECHANGE");
      render();
    }, 10000), true);

    // Re-render if the window is resized
    angular.element(window).bind('resize', function(){
      console.log("Resize :))))))");
      render();
    });

    function render() {
      console.log("You called render !");
      element.css({
        height: element.parent().height(),
        width: '100%'
      });

      element.text('');

      // Remove previously drawn vector map
      /*$('.jvectormap-zoomin, .jvectormap-zoomout, .jvectormap-label .jvectormap-tip').remove();

        require(['plugins/mapster/lib/jvectormap/maps/map.world_mill'], function () {
        element.vectorMap({
        map: 'world_mill',
        regionStyle: { initial: { fill: '#8c8c8c' }},
        zoomOnScroll: false, 
        backgroundColor: null,*/
      /*series: {
        regions: [{
        values: scope.data,
        scale: [scope.options.minColor, scope.options.maxColor],
        normalizeFunction: 'polynomial'
        }]
        },
        onRegionTipShow: function(event, el, code) {
        if (!scope.data) { return; }

        var count = _.isUndefined(scope.data[code]) ? 0 : scope.data[code];
        el.html(el.html() + ": " + numeral(count).format(displayFormat(scope.options.tipNumberFormat)));
        },*/
      /*markers: [
        {name:'Houston', latLng:[29.761993,-95.369568]},
        {name:'New York', latLng:[40.710833,-74.002533]},
        {name:'Kansas City', latLng:[39.115145,-94.633484]}
        ]*/
      /*});
        });
        */
      var height = element.parent().height();

      //TODO Compute scale automatically depending on window size
      //var projection = d3.geo.mercator();
      var projection = d3.geo.equirectangular();

      var path = d3.geo.path()
        .projection(projection);

      // Remove previously drawn map
      $('svg').remove();

      var svg = d3.select("vectormap").append("svg")
        .attr("width", element.parent().width())
        .attr("height", element.parent().height());

      var map = svg.append("g")
        .attr("class", "countries");

      // Draw d3 map
      // The first '/' in the url below is required to really access http://url/plugins/... and not app/plugins
      //d3.json('/plugins/mapster/lib/map.json', function(error, world) {
      d3.json('/plugins/mapster/lib/admin0_polygons_topo.json', function(error, world) {
        /*OLD WAY BUT STILL GOOD
         * var countries = topojson.feature(world, world.objects
        //     .land
        .admin0_polygons
        ).features;
        svg.selectAll(".country")
        .data(countries)
        .enter().insert("path", ".graticule")
        .attr("class", "country")
        .attr("d", path);*/
        var countries = topojson.feature(world, world.objects.admin0_polygons).features;
        map.selectAll(".country")
          .data(countries)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path);
      });
      //TODO Move this above
      var coords = [29.76, -95.36];
      var target_coords = [48.85, 2.34];

      //THIS FUNCTION IS NEEDED BECAUSE WORLD COORDS != NORMAL COORDS
      function getCoords(coords) {
        return [coords[1], coords[0]];
      }

      var coords = getCoords(coords);
      var target_coords = getCoords(target_coords);

      var route = svg.append("path")
        .datum({type: "LineString", coordinates:[coords, target_coords]})
        .attr("class", "route")
        .attr("d", path);

      var object = svg.append("path")
        .attr("class", "object")
        //.attr("d", "M455.456,249.343l-13.932,3.993v53.451h-40.142l-30.042-37.909h-68.935v50.638c0,6.752-2.573,12.224-5.734,12.224l-78.506-62.856H101.073c-1.374,0-2.733-0.027-4.09-0.05v-78.049c1.357-0.022,2.717-0.047,4.09-0.047h121.717l73.873-62.862c3.169,0,5.729,5.475,5.729,12.238v50.624h64.635l34.354-43.598h40.142v59.82l13.927,4.169C464.818,230.934,455.456,249.343,455.456,249.343z M0,229.808c0,19.485,34.821,35.634,80.359,38.594v-77.169C34.827,194.19,0,210.327,0,229.808z");
        //.attr("d", "m25.21488,3.93375c-0.44355,0 -0.84275,0.18332 -1.17933,0.51592c-0.33397,0.33267 -0.61055,0.80884 -0.84275,1.40377c-0.45922,1.18911 -0.74362,2.85964 -0.89755,4.86085c-0.15655,1.99729 -0.18263,4.32223 -0.11741,6.81118c-5.51835,2.26427 -16.7116,6.93857 -17.60916,7.98223c-1.19759,1.38937 -0.81143,2.98095 -0.32874,4.03902l18.39971,-3.74549c0.38616,4.88048 0.94192,9.7138 1.42461,13.50099c-1.80032,0.52703 -5.1609,1.56679 -5.85232,2.21255c-0.95496,0.88711 -0.95496,3.75718 -0.95496,3.75718l7.53,-0.61316c0.17743,1.23545 0.28701,1.95767 0.28701,1.95767l0.01304,0.06557l0.06002,0l0.13829,0l0.0574,0l0.01043,-0.06557c0,0 0.11218,-0.72222 0.28961,-1.95767l7.53164,0.61316c0,0 0,-2.87006 -0.95496,-3.75718c-0.69044,-0.64577 -4.05363,-1.68813 -5.85133,-2.21516c0.48009,-3.77545 1.03061,-8.58921 1.42198,-13.45404l18.18207,3.70115c0.48009,-1.05806 0.86881,-2.64965 -0.32617,-4.03902c-0.88969,-1.03062 -11.81147,-5.60054 -17.39409,-7.89352c0.06524,-2.52287 0.04175,-4.88024 -0.1148,-6.89989l0,-0.00476c-0.15655,-1.99844 -0.44094,-3.6683 -0.90277,-4.8561c-0.22699,-0.59493 -0.50356,-1.07111 -0.83754,-1.40377c-0.33658,-0.3326 -0.73578,-0.51592 -1.18194,-0.51592l0,0l-0.00001,0l0,0z");
        .attr("d", "M7.411 21.39l-4.054 2.61-.266-1.053c-.187-.744-.086-1.534.282-2.199l2.617-4.729c.387 1.6.848 3.272 1.421 5.371zm13.215-.642l-2.646-4.784c-.391 1.656-.803 3.22-1.369 5.441l4.032 2.595.266-1.053c.186-.743.085-1.533-.283-2.199zm-10.073 3.252h2.895l.552-2h-4l.553 2zm1.447-24c-3.489 2.503-5 5.488-5 9.191 0 3.34 1.146 7.275 2.38 11.809h5.273c1.181-4.668 2.312-8.577 2.347-11.844.04-3.731-1.441-6.639-5-9.156zm.012 2.543c1.379 1.201 2.236 2.491 2.662 3.996-.558.304-1.607.461-2.674.461-1.039 0-2.072-.145-2.641-.433.442-1.512 1.304-2.824 2.653-4.024z");


      console.log("Using coords:", coords);
      console.log("Using coords:", target_coords);

      function transition(object, route) {
        var l = route.node().getTotalLength();
        object.transition()
          .duration(5000)
          .attrTween("transform", delta(route.node())); //TODO Tween sucks
      }

      function delta(path) {
        var l = path.getTotalLength();
        return function(i) {
          return function(t) {
            var p = path.getPointAtLength(t * l);
            var t2 = Math.min(t + 0.05, 1);
            var p2 = path.getPointAtLength(t2 * l);

            var x = p2.x - p.x;
            var y = p2.y - p.y;
            var r = 90 - Math.atan2(-y, x) * 180 / Math.PI;
            //var s = Math.min(Math.sin(Math.PI * t) * 0.7, 0.5);
            //return "translate(" + p.x + "," + p.y + ") scale(" + s + ") rotate(" + r + ")";
            var posX = p.x;
            var posY = p.y - 5;
            return "translate(" + p.x + "," + posY + ") scale(0.5) rotate(" + r + ")";
          }
        }
      }


      transition(object, route);

      /*// Remove old SVGs and create a new one
        try {
        $("#drawArea").empty();
      //var draw = SVG('drawArea').size(element.parent().width(), element.parent().height());
      var map = element.vectorMap('get', 'mapObject');
      } catch(err) {
      console.log("Error: could not create new svg");
      return false;
      }*/

      // Generate index and retrieve data from es
      //TODO generate index from current date
      var r = es.search({
        index: 'events_storage_2016-05-16',
        body: {
          query: {
            range: {
              // We filter timestamp_insert instead of timestamp_syslog because this last one is often doing shit
              timestamp_insert: {
                gt: 'now-10s'
              }
                                // TODO Percentage aggregation
                                // TODO Filter by IP?
            }
          }
        },
        size: 100,
        sort: 'timestamp_insert'
      });

      //var nbs_coords = map.latLngToPoint(48.859682,2.3472953);

      // Compute promise
      r.then(function(result) {
        var list = result["hits"]["hits"];
        console.log("Computing", list.length, "events.");
        for (var i = 0; i < 1 && list.length; i++) {
          if (list[i] == undefined) {
            console.log("Err", i);
            console.log("List", list);
            break;
          }
          var coords = list[i]["_source"]["src_coords"].split(',');
          //coords = map.latLngToPoint(coords[0], coords[1]);
          //draw.line(coords.x, coords.y, nbs_coords.x, nbs_coords.y).stroke({ width: 1, color: 'blue' });
          /*var line = svg.append('line')
            .style('stroke', 'blue')
            .attr('x1', coords.x)
            .attr('y1', coords.y)
            .attr('x2', nbs_coords.x)
            .attr('y2', nbs_coords.y);
            */
        }

      }, function(error) {
        console.log("Error", error);
      });

    }
    }

    return {
      restrict: 'E',
      scope: {
        data: '=',
        options: '='
      },
      link: link
    };
  });

