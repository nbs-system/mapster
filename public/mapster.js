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
        object_scale: 0.5,
        object_rotation: 90,
        target_coords: "48.85, 2.34",
        special_shape: "M412.861,78.976c3.404-6.636,2.831-14.159-0.15-20.404c0.84-7.106-1.02-14.321-7.746-19.855c-6.262-5.151-12.523-10.305-18.781-15.457c-11.005-9.055-28.237-11.913-38.941,0c-48.619,54.103-99.461,105.856-152.167,155.725c-39.185-36.605-78.846-72.713-118.223-108.868c-13.82-12.693-33.824-8.71-42.519,6.411c-12.665,6.286-22.931,14.481-31.42,28.468c-4.042,6.664-3.727,15.076,0,21.764c25.421,45.578,74.557,85.651,114.957,122.529c-5.406,4.839-10.772,9.724-16.287,14.461c-54.43,46.742-91.144,76.399-23.029,124.325c0.919,0.647,1.856,0.504,2.789,0.882c1.305,0.602,2.557,1.026,4.004,1.264c0.45,0.017,0.87,0.093,1.313,0.058c1.402,0.114,2.774,0.471,4.195,0.192c36.621-7.18,70.677-35.878,101.576-67.48c30.1,29.669,62.151,58.013,97.395,74.831c8.391,4.005,18.395,1.671,24.855-3.931c10.832,0.818,20.708-5.913,25.665-15.586c0.734-0.454,1.207-0.713,2.002-1.21c15.748-9.838,17.187-29.431,5.534-42.936c-26.313-30.492-54.284-59.478-82.798-87.95C316.426,196.043,380.533,141.939,412.861,78.976z",
        special_shape_scale: 0.04,
        special_shape_remaining: 600000
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

