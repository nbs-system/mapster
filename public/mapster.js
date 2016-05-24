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
    params: {
      defaults: {
        special_effects: ['ban_manager_legacy'],
        object_shape: "M7.411 21.39l-4.054 2.61-.266-1.053c-.187-.744-.086-1.534.282-2.199l2.617-4.729c.387 1.6.848 3.272 1.421 5.371zm13.215-.642l-2.646-4.784c-.391 1.656-.803 3.22-1.369 5.441l4.032 2.595.266-1.053c.186-.743.085-1.533-.283-2.199zm-10.073 3.252h2.895l.552-2h-4l.553 2zm1.447-24c-3.489 2.503-5 5.488-5 9.191 0 3.34 1.146 7.275 2.38 11.809h5.273c1.181-4.668 2.312-8.577 2.347-11.844.04-3.731-1.441-6.639-5-9.156zm.012 2.543c1.379 1.201 2.236 2.491 2.662 3.996-.558.304-1.607.461-2.674.461-1.039 0-2.072-.145-2.641-.433.442-1.512 1.304-2.824 2.653-4.024z",
        object_scale: 0.4,
        object_rotation: 90,
        target_coords: "48.85, 2.34"
      },
      editor: require('plugins/mapster/mapster_params_editor.html')
    },
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

