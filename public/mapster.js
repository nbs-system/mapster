require('plugins/mapster/mapster.less');
require('plugins/mapster/lib/mapster_controller.js');
require('plugins/mapster/lib/mapster_directive.js');
import 'ui/visualize/visualize_legend';

function mapsterProvider(Private) {
  var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
  var Schemas = Private(require('ui/Vis/Schemas'));

  return new TemplateVisType({
    name: 'mapster',
    title: 'Mapster',
    description: 'MAPSTER MUCH PIEW MUCH WOW',
    icon: 'fa-globe',
    template: require('plugins/mapster/mapster.html'),
    schemas: new Schemas([
        {
          group: 'metrics',
          name: 'count',
          title: 'Count',
          aggFilter: ['count'],
          min: 1,
          max: 1
        }, 
        {
          group: 'buckets',
          name: 'timestamp',
          icon: 'fa fa-clock-o',
          title: 'Timestamp',
          min: 1,
          max: 1
        },
        {
          group: 'buckets',
          name: 'src_coords',
          icon: 'fa fa-map-marker',
          title: 'Coordinates',
          min: 1,
          max: 1
        },
        {
          group: 'buckets',
          name: 'peer_ip',
          icon: 'fa fa-server',
          title: 'IP',
          min: 1,
          max: 1
        },
        {
          group: 'buckets',
          name: 'sensor',
          icon: 'fa fa-signal',
          title: 'Sensor',
          min: 1,
          max: 1
        },
        {
          group: 'buckets',
          name: 'extra',
          title: 'Extra data to filter',
          icon: 'fa fa-database',
          min: 0,
          max: 10
        }
    ])
  });
}

require('ui/registry/vis_types').register(mapsterProvider);

