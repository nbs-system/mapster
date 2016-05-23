var _ = require('lodash');
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';
import VislibComponentsColorColorPaletteProvider from 'ui/vislib/components/color/color_palette';

var module = require('ui/modules').get('mapster');

module.controller('MapsterController', function ($scope, Private) {
  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
  const createColorPalette = Private(VislibComponentsColorColorPaletteProvider);

  $scope.$watch('esResponse', function (resp) {
    if (resp) {
      const vis = $scope.vis;
      const params = vis.params;

      var table = tabifyAggResponse(vis, resp, {
        partialRows: params.showPatialRows,
        minimalColumns: vis.isHierarchical() && !params.showMeticsAtAllLevels,
        asAggConfigResults: true
      });

      var table = table.tables[0];

      if (table == undefined) {
        $scope.data = null;
        return;
      }

      var colors = {};
      var nb_colors = 0;

      $scope.data = table.rows.map(function(row) {
        var sensor = row[3].key;
        if (colors[sensor] == undefined) {
          colors[sensor] = '';
          nb_colors += 1;
        }

        return {
          timestamp: row[0].key,
          coords: row[1].key,
          peer_ip: row[2].key,
          sensor: sensor, 
          count: row[4].key
        };
      });

      var colors_code = createColorPalette(nb_colors);
      var i = 0;
      for (var c in colors) {
        if (c == undefined) break;
        colors[c] = colors_code[i];
        i++;
      }
      $scope.colors = colors;

    }

  });
});

