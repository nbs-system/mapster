var THREE = require("plugins/mapster/lib/three.min.js");
var moment = require("moment");

var Globe = function () {

  var Shaders = {
    'earth': {
      uniforms: {
        'texture': {type: 't', value: null}
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        'vNormal = normalize( normalMatrix * normal );',
        'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
        'vec3 diffuse = texture2D( texture, vUv ).xyz;',
        'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
        'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
        'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere': {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
        'vNormal = normalize( normalMatrix * normal );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
        'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
        'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var config;
  var $timeout;

  var PI_HALF = Math.PI / 2;

  var scene, camera, renderer;
  var sphere, atmosphere;
  var mouseOnDown = {x: 0, y: 0};
  var mouse = {x: 0, y: 0};
  var targetOnDown = {x: 0, y: 0};
  var target = {x: PI_HALF + 0.2, y: Math.PI / 6.0};
  var rotation = {x: 0, y: 0};
  var overRenderer;

  var textureLoader;
  var origins = {};

  var distance = 100000;
  var distanceTarget = 100000;

  var sphereRadius = 200;
  var MAX_POINTS = 100;

  var container;

  var idleTime = 0;

  function setConfig(c, t) {
    config = c;
    $timeout = t;
  }

  function init(c) {
    container = c[0];
    var w = container.offsetWidth || window.innerWidth;
    var h = container.offsetHeight || window.innerHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    addSphere();

    /* Sphere controls */
    container.addEventListener('mousedown', onMouseDown, false);

    // Support for chrome and firefox
    container.addEventListener('mousewheel', onMouseWheel, false);
    container.addEventListener('DOMMouseScroll', onMouseWheel, false);

    container.addEventListener('mouseover', function () {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function () {
      overRenderer = false;
    }, false);
  }

  function addSphere() {
    // Add sphere
    var geometry = new THREE.SphereGeometry(sphereRadius, 40, 30);
    textureLoader = new THREE.TextureLoader();

    var uniforms = THREE.UniformsUtils.clone(Shaders['earth'].uniforms);
    uniforms['texture'].value = textureLoader.load('/plugins/mapster/img/world.jpg');

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: Shaders['earth'].vertexShader,
      fragmentShader: Shaders['earth'].fragmentShader
    });

    sphere = new THREE.Mesh(geometry, material);
    //sphere.rotation.y = Math.PI;
    scene.add(sphere);

    // Add atmosphere
    uniforms = THREE.UniformsUtils.clone(Shaders['atmosphere'].uniforms);
    material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: Shaders['atmosphere'].vertexShader,
      fragmentShader: Shaders['atmosphere'].fragmentShader,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    atmosphere = new THREE.Mesh(geometry, material);
    atmosphere.scale.set(1.1, 1.1, 1.1);
    scene.add(atmosphere);
  }

  // get the point in space on surface of sphere radius radius from lat lng
  // lat and lng are in degrees
  function latlngPosFromLatLng(lat, lng, radius) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (360 - lng) * Math.PI / 180;
    var x = radius * Math.sin(phi) * Math.cos(theta);
    var y = radius * Math.cos(phi);
    var z = radius * Math.sin(phi) * Math.sin(theta);

    return {
      phi: phi,
      theta: theta,
      x: x,
      y: y,
      z: z
    };
  }

  // Find intermediate points on sphere between two lat/lngs
  // lat and lng are in degrees
  // offset goes from 0 (lat/lng1) to 1 (lat/lng2)
  // formula from http://williams.best.vwh.net/avform.htm#Intermediate
  function latlngInterPoint(lat1, lng1, lat2, lng2, offset) {
    lat1 = THREE.Math.degToRad(lat1);
    lng1 = THREE.Math.degToRad(lng1);
    lat2 = THREE.Math.degToRad(lat2);
    lng2 = THREE.Math.degToRad(lng2);

    var d = 2 * Math.asin(Math.sqrt(Math.pow((Math.sin((lat1 - lat2) / 2)), 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
    var A = Math.sin((1 - offset) * d) / Math.sin(d);
    var B = Math.sin(offset * d) / Math.sin(d);
    var x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    var y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    var z = A * Math.sin(lat1) + B * Math.sin(lat2);
    var lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
    var lng = Math.atan2(y, x) * 180 / Math.PI;

    return {
      lat: lat,
      lng: lng
    };
  }

  function getDistance(lat1, lon1, lat2, lon2) {
    lat1 = THREE.Math.degToRad(lat1);
    lon1 = THREE.Math.degToRad(lon1);
    lat2 = THREE.Math.degToRad(lat2);
    lon2 = THREE.Math.degToRad(lon2);

    var a = Math.pow(Math.sin(( lon2 - lon1 ) / 2.0), 2);
    var b = Math.pow(Math.sin(( lat2 - lat1 ) / 2.0), 2);
    var c = Math.sqrt(a + Math.cos(lon2) * Math.cos(lon1) * b);

    return 2 * Math.asin(c) * sphereRadius;
  }

  function showEvent(lat1, lon1, lat2, lon2, radius, color, diff) {
    // TODO You can surely optimize and refactor this :)
    $timeout(function () {
      var num_control_points = 8;
      var dist = getDistance(lat1, lon1, lat2, lon2);
      var max_altitude = 30 / (sphereRadius * 2) * dist; // The longuest the highest
      max_altitude = max_altitude + (Math.random() - 0.5) * (max_altitude / 2); // Add some randomness above and below

      var points = [];
      var i;
      var pos;
      for (i = 0; i < num_control_points + 1; i++) {
        var arc_angle = i * 180.0 / num_control_points;
        var arc_radius = radius + (Math.sin(THREE.Math.degToRad(arc_angle))) * max_altitude;
        var latlng = latlngInterPoint(lat1, lon1, lat2, lon2, i / num_control_points);
        pos = latlngPosFromLatLng(latlng.lat, latlng.lng, arc_radius);

        points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
      }

      var spline = new THREE.CatmullRomCurve3(points);
      var _class = "" + lat1 + lon1 + lat2 + lon2;

      if (origins[_class]) {
        // Make it bigger now :)
        var size = origins[_class].material.size;
        if (size < config.OriginDefaultSize*2) {
          size = config.OriginDefaultSize;
        } else if (size > config.OriginMaximumSize*2) {
          size = config.OriginMaximumSize*2;
        } else {
          size += config.OriginDefaultSize*4;
        }
        origins[_class].material.size = size;
      } else {
        var originGeometry = new THREE.Geometry();
        originGeometry.vertices.push(points[0]);
        var originMaterial = new THREE.PointsMaterial({
          color: color,
          size: config.OriginDefaultSize*4,
          map: textureLoader.load("/plugins/mapster/img/particle.png"),
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          transparent: true
        });
        var originMesh = new THREE.Points(originGeometry, originMaterial);
        scene.add(originMesh);
        origins[_class] = originMesh;
      }

      /* Add alternate points */
      var num_coords = MAX_POINTS * 3;
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array(num_coords);

      for (i = 0; i < num_coords; i += 3) {
        pos = spline.getPoint(i / num_coords);
        positions[i] = pos.x;
        positions[i + 1] = pos.y;
        positions[i + 2] = pos.z;
      }

      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setDrawRange(0, 1);

      var material = new THREE.LineBasicMaterial({color: color, linewidth: 2});
      var line = new THREE.Line(geometry, material);
      line.name = "line";
      scene.add(line);
    }, diff);
  }

  function showSpecialEvent(lat1, lon1, lat2, lon2, radius, color, diff) {
    // TODO You can surely optimize and refactor this :)
    $timeout(function () {
      var num_control_points = 8;
      var dist = getDistance(lat1, lon1, lat2, lon2);
      var max_altitude = 30 / (sphereRadius * 2) * dist; // The longuest the highest
      max_altitude = max_altitude + (Math.random() - 0.5) * (max_altitude / 2); // Add some randomness above and below

      var points = [];
      var i;
      var pos;
      for (i = 0; i < num_control_points + 1; i++) {
        var arc_angle = i * 180.0 / num_control_points;
        var arc_radius = radius + (Math.sin(THREE.Math.degToRad(arc_angle))) * max_altitude;
        var latlng = latlngInterPoint(lat1, lon1, lat2, lon2, i / num_control_points);
        pos = latlngPosFromLatLng(latlng.lat, latlng.lng, arc_radius);

        points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
      }

      var spline = new THREE.CatmullRomCurve3(points);

      /* Add alternate points */
      var num_coords = MAX_POINTS * 3;
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array(num_coords);

      for (i = 0; i < num_coords; i += 3) {
        pos = spline.getPoint(i / num_coords);
        positions[i] = pos.x;
        positions[i + 1] = pos.y;
        positions[i + 2] = pos.z;
      }

      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setDrawRange(0, 1);

      var material = new THREE.LineBasicMaterial({color: color, linewidth: 5});
      var line = new THREE.Line(geometry, material);
      line.name = "line";
      scene.add(line);
    }, diff);
  }

  /* Show the event in the log list */
  function showEventLog(event, color, diff) {
    $timeout(function () {
      // Create new row
      var logs = document.getElementById("logs");
      if (logs === null) {
        console.error("Logs table does not exists.");
        return;
      }
      var tr = logs.insertRow();
      tr.innerHTML = ("<td>" + moment(event.timestamp).format('YYYY-MM-DD HH:mm:ss') + "</td><td>" + event.coords.lat + ","
      + event.coords.lon + "</td><td>" + event.peer_ip + "</td><td style=\"color: " + color + "\">" + event.sensor + "</td>");

      // Remove extra elements
      if (logs.children.length >= config.maximumEvents) {
        logs.deleteRow(0);
      }
    }, diff);
  }

  function renderEvents(list, colors) {
    if (list === null || typeof list == "undefined") {
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

    var RefDate = new Date(list[0]["timestamp"]);
    var LastDate = RefDate;
    var count = 0;
    var index = 0;

    for (var i = 0; i < list.length; i++) {
      var date = new Date(list[i]["timestamp"]);

      /* Count should be at 0 when the condition is triggered */
      if (date > LastDate) {
        LastDate = date;
        index = 0;
      }

      /* Recount events with same timestamp */
      if (count === 0) {
        for (var j = i; j < list.length - 1; j++) {
          if (new Date(list[j]["timestamp"]) > LastDate) {
            break;
          }
          count++;
        }
      }

      /* Make events with same timestamp appear smoothly/distributively on 1 second */
      var diff = date - RefDate;
      diff = diff + 1000 / count * index;

      var color = colors[list[i]["sensor"]].color;
      var coords = list[i]["coords"];

      /* Should we display unlocated events ? */
      if ($.inArray(list[i]["sensor"], config.SpecialEffects) > -1) {
        showSpecialEvent(config.TargetCoords[0], config.TargetCoords[1], coords.lat, coords.lon, sphereRadius, color, diff);
        showEventLog(list[i], color, diff);
      } else {
        if (config.HideUnlocated) {
          var unlocated = (coords.lat | 0) === 0 && (coords.lon | 0) === 0;
          if (!unlocated) {
            showEvent(coords.lat, coords.lon, config.TargetCoords[0], config.TargetCoords[1], sphereRadius, color, diff);
            showEventLog(list[i], color, diff);
          }
        } else {
          showEvent(coords.lat, coords.lon, config.TargetCoords[0], config.TargetCoords[1], sphereRadius, color, diff);
          showEventLog(list[i], color, diff);
        }
      }
      index++;
    }
  }

  //TODO Move it in the render() one ? And rename render() to animate() ?
  function animateLines() {
    var lines = scene.children;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].name != "line") {
        continue;
      }

      var range = lines[i].geometry.drawRange;
      if (range.start >= MAX_POINTS - 1) {
        scene.remove(lines[i]);
      } else if (range.count >= MAX_POINTS) {
        lines[i].geometry.setDrawRange(range.start + 1, MAX_POINTS);
      } else {
        lines[i].geometry.setDrawRange(0, range.count + 1);
      }
    }
  }

  function animateOrigins() {
    for (var o in origins) {
      origins[o].material.size -= 0.05;
      if (origins[o].material.size <= 0) {
        // TODO Remove origins array use scene
        scene.remove(origins[o]);
        delete origins[o];
      }
    }
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = -event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
    idleTime = 0;
  }

  function onMouseMove(event) {
    mouse.x = -event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance / 1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
  }

  function onMouseUp() {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut() {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      // Support for chrome and firefox
      var delta = event.wheelDeltaY ? event.wheelDeltaY * 0.3 : -event.detail * 10;
      zoom(delta);
    }
    return false;
  }

  function render() {
    requestAnimationFrame(render);
    zoom(0);

    if (idleTime > 150) {
      /* Auto rotate when idling */
      rotation.x = (rotation.x + 0.005) % (2*Math.PI);
      rotation.y += (Math.PI / 6.0 - rotation.y) * 0.01;
      distance += (distanceTarget - distance) * 0.3;
    } else {
      /* Small rotation and zoom when creating the sphere + mouse move handle */
      rotation.x += (target.x - rotation.x) * 0.1;
      rotation.y += (target.y - rotation.y) * 0.1;
      distance += (distanceTarget - distance) * 0.3;
      idleTime++;
    }

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(sphere.position);

    animateLines();
    animateOrigins();
    renderer.render(scene, camera);
  }

  this.setConfig = setConfig;
  this.init = init;
  this.render = render;
  this.renderEvents = renderEvents;

  return this;
};

module.exports = new Globe();
