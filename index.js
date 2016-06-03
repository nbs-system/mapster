module.exports = function (kibana) {
  return new kibana.Plugin({
    uiExports: {
      visTypes: ["plugins/mapster/mapster"]
    }
    /*init: function(server, options) {
      server.exposeStaticDir('/testlol/{path*}', 'plugins/mapster/lib');
    }*/
  });
};

