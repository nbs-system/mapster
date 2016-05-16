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
      var projection = d3.geo.mercator()
        .scale(100);

      var path = d3.geo.path()
        .projection(projection);

      // Remove previously drawn map
      $('svg').remove();

      var svg = d3.select("vectormap").append("svg")
        .attr("width", element.parent().width())
        .attr("height", element.parent().height());

      var g = svg.append("g");

      // Draw d3 map
      // The first '/' in the url below is required to really access http://url/plugins/... and not app/plugins
      d3.json('/plugins/mapster/lib/map.json', function(error, world) {
          var countries = topojson.feature(world, world.objects.land).features;
          svg.selectAll(".country")
          .data(countries)
          .enter().insert("path", ".graticule")
          .attr("class", "country")
          .attr("d", path);
      });
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

        //TODO Move this above
        var coords = [29.76, -95.36];
        var target_coords = [48.85, 2.34];

        console.log(path);

        var route = svg.append("path")
            .datum({ type: "LineString", coordinates: [coords, target_coords] })
            .attr("class", "route")
            .attr("d", path);

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

