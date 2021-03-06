import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon } from "ol/style";
import { Draw, Modify, Snap, Select, Translate } from "ol/interaction";
import { MousePosition, defaults as defaultControls, FullScreen, ZoomToExtent } from "ol/control";
import { fromLonLat, transform as tf, transformExtent, Projection } from "ol/proj";
import { createStringXY } from "ol/coordinate";
import { OSM,  Vector as VectorSource , ImageStatic} from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import Image from "ol/layer/image";
import {getCenter} from 'ol/extent';
import {extents} from './coord';
import {Point ,MultiPoint, LineString} from 'ol/geom';
import {getVectorContext} from 'ol/render';
import {easeOut} from 'ol/easing';
import {unByKey} from 'ol/Observable';

var styleFunction = function (feature) {
  var geometry = feature.getGeometry();
    
    var coords = geometry.getCoordinates();
		var start = coords[0];
		var end = coords[1];
    var dx = end[0] - start[0];
    var dy = end[1] - start[1];
    var rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(
      new Style({
        geometry: new Point(end),
        image: new Icon({
          src: 'https://openlayers.org/en/v6.4.3/examples/data/arrow.png',
          // src: '../../resource/arrow.png',
          anchor: [0.75, 0.5],
          rotateWithView: true,
          rotation: -rotation,
        }),
      })
    );


  return styles;
};


//지도 위치 + 좌표변환
const center = [127.0888, 37.1240];
const transCenter = fromLonLat(center);
var source = new VectorSource();
//그리기 영역 설정
var vector = new VectorLayer({
  source: source,
  style: [
    new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.5)"
    }),
    stroke: new Stroke({
      color: "#ffcc33",
      width: 2,
      geometry: styleFunction
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: "#ffcc33"
      })
    })
  }),
  
]
});

//선택영역 설정
var select = new Select({
  style: [
    new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.8)"
    }),
    stroke: new Stroke({
      color: "#ff3333",
      width: 3
    }),
  }),
  new Style({
    image: new CircleStyle({
      radius: 3,
      fill: new Fill({
        color: '#4a0404'
      }),
    }),
    geometry: function(feature) {
      // return the coordinates of the first ring of the polygon
      var coordinates = feature.getGeometry().getCoordinates()[0];
      return new MultiPoint(coordinates);
      }
    })
  ]}
);
var translate = new Translate({
  features: select.getFeatures()
});
var modify = new Modify({ features: select.getFeatures() });
var draw, snap; // global so we can remove them later


var map_type = document.getElementById("mapType");
var typeSelect = document.getElementById("type");
var map_image = extents.mapType.skyView, extent_type;

function setMapType() {
  if(map_type.value === 'SkyView'){
    map_image = extents.mapType.skyView
    extent_type = extents.LG
  }else if(map_type.value === 'Custom') {
    map_image = extents.mapType.customMap
    extent_type = extents.LG2
  }
  var result = {extent_type: extent_type, map_image: map_image}
  return result;
}

setMapType();

map_type.onchange= function(){
  var result = setMapType();
  viewport.innerHTML = '';
  extent_type = result.extent_type;
  map_image = result.map_image;
  
  projection = new Projection({
    code: 'xkcd-image',
    units: 'pixels',
    extent: extent_type,
  });
  image = new Image({
    source: new ImageStatic({
      url : map_image,
      crossOrigin: '',
      projection: projection,
      imageExtent: extent_type
    })
  })
  tocenter = new ZoomToExtent({
    extent: extent_type,
    label: center_img
  })
  view = new View({
    center: getCenter(extent_type),
    projection: projection,
    extent: extent_type,
    zoom: 2,
    minZoom: 2,
    maxZoom: 5 
  })
  map = new Map({
    controls : defaultControls().extend([new FullScreen(), tocenter , mousePositionCtrl]),
    layers: [  image, vector ],
    target: "map",
    view: view
  });
  
};

var projection = new Projection({
  code: 'EPSG:4326',
  // units: 'pixels',
  extent: extent_type,
});



var raster = new TileLayer({
  // extent: [14146870.51, 4456851.69, 14148050.49, 4455930.23],
  source: new OSM()
  
});

var image = new Image({
  source: new ImageStatic({
    url : map_image,
    crossOrigin: '',
    projection: projection,
    imageExtent: extent_type
  })
})
  
//마우스 좌표 표시
var mousePositionCtrl = new MousePosition({
  coordinateFormat: createStringXY(8),
  projection: 'EPSG:4326',
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

var center_img = document.createElement('img'); 

var tocenter = new ZoomToExtent({
  extent: extent_type,
  label: center_img
})

var viewport = document.getElementById('map');

function getMinZoom() {
  var width = viewport.clientWidth;
  return Math.ceil(Math.LOG2E * Math.log(width / 256));
}

var initialZoom = getMinZoom();
var view = new View({
  center: getCenter(extent_type),
  extent: extent_type,
  projection: projection,
  zoom: 4,
  minZoom: 2,
  // maxZoom: 7 
})
//지도 생성
var map = new Map({
  controls : defaultControls().extend([new FullScreen(), tocenter , mousePositionCtrl]),
  layers: [ raster , vector ],
  target: "map",
  view: view
});

//지도 사이즈에 맞춰서 minZoom 세팅
addEvent(window, 'resize', ()=>{
  var minZoom = getMinZoom();
  if (minZoom !== view.getMinZoom()) {
    view.setMinZoom(minZoom);
  }
})

//지도 기능 추가
function addInteractions() {
  var value = typeSelect.value;
  //polygone 선택 시 그리기
  if(value === "Draw"){
        draw = new Draw({
          source: source,
          type: "Polygon",
        });
      map.addInteraction(draw);
      // snap = new Snap({ source: source });
      // map.addInteraction(snap);
      
      //다각형의 영역 좌표 출력
      draw.on('drawend',(e) => {
        const polygon = e.feature.getGeometry();
        const coords =  polygon.getCoordinates()[0];
        console.log(coords)
        
      });
      
    // 도형 수정 (수정한 좌표영역 )
    }else if(value === "Area"){
      var coords = extents.area;      
      var el = extents.area_name;
      source.clear()
      var feature = loadFeatures(coords,el);
      source.addFeatures(feature);
      map.addInteraction(select);
      selecting();
    }else if(value === "Building"){
      var coords = extents.buildings;
      var el = extents.buildings_name
      source.clear()
      map.addInteraction(select);
      map.addInteraction(translate);
      
      var list = loadFeatures(coords,el);
      source.addFeatures(list);
      selecting();
    }
    else if(value === "Road"){
      var coords = extents.roads;
      var el = extents.roads_name
      source.clear()
      map.addInteraction(select);
      map.addInteraction(translate);
      var list = loadFeatures(coords,el);
      source.addFeatures(list);
      selecting();
    }else if(value === "Log_draw"){
      var coords = extents.route;
      draw = new Draw({
        source: source,
        type: "LineString",
      });
      map.addInteraction(select);
      source.clear();
      var list = loadLine(coords);
      console.log(list)
      source.addFeatures(list);
      
    }
    else {
      map.removeInteraction(draw);
      map.removeInteraction(modify);
      map.removeInteraction(select);
      map.removeInteraction(translate);
      source.clear()

    }
  
}

var selecting = () => {
  select.once("select", ()=> {
    map.addInteraction(modify);
    addEvent(document ,"keydown", (e) => {
      const keyCode = e.keyCode;
      if(keyCode === 8) remove();
    });
  })
  select.on('select',(target) => {
    if(target.deselected.length > 0) {
      console.log(target.deselected[0].getGeometry().getCoordinates())
    }
  })
}

//도형 제거
var selectFeature = select.getFeatures();
var remove = () => {
  if(selectFeature){
    source.removeFeature(selectFeature.getArray()[0])
    selectFeature.clear()
  }
}

var coordList = document.getElementById('coord_list');

//좌표 가져오기
var loadFeatures = (coords, name) => {
  coordList.innerHTML = "";
  var list =[];
  var btn , br
  coords.forEach((element, i) => {
    var feature = new Feature(new Polygon([element]));
    btn = document.createElement('button');
    br= document.createElement('br');
    btn.setAttribute('value', feature.ol_uid);
    btn.setAttribute('class', 'btnList');
    btn.innerText = name[i];
    list.push(feature);
    coordList.append(btn,br);
    console.log(feature)
    addEvent(btn, "click", (e)=> {
      e.preventDefault();
      selectFeature.clear()
      var features = source.getFeatureByUid(e.target.value);
      selectFeature.push(features)
    })
  }); 
  return list;
}

//경로 가져오기
var loadLine = (coords) => {
  coordList.innerHTML = "";
  var list =[];
  coords.forEach((element) => {
    
    var route = new Feature(new LineString(element));
    list.push(route);
  }); 
  return list;
}


/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  map.removeInteraction(modify);
  map.removeInteraction(select);
  addInteractions();
};

addInteractions();

//경비실 위치 확인
const secu = document.getElementById('securities');

addEvent(secu, 'click', (e) => {
  typeSelect.value = 'None'
  e.preventDefault();
  source.clear()
  showPoint(extents.security1)
  showPoint(extents.security2)
  showPoint(extents.security3)
})
source.on('addfeature', function (target) {
  flash(target.feature);
});

function showPoint(coord){
  var geom = new Point(coord);
  var feature = new Feature(geom);
  source.addFeature(feature);
}

var duration = 3000;
function flash(feature) {
  var start = new Date().getTime();
  var listenerKey = image.on('postrender', animate);

  function animate(event) {
    var vectorContext = getVectorContext(event);
    var frameState = event.frameState;
    var flashGeom = feature.getGeometry().clone();
    var elapsed = frameState.time - start;
    var elapsedRatio = elapsed / duration;
    // radius will be 5 at start and 30 at end.
    var radius = easeOut(elapsedRatio) * 25 + 5;
    var opacity = easeOut(1 - elapsedRatio);

    var style = new Style({
      image: new CircleStyle({
        radius: radius,
        stroke: new Stroke({
          color: 'rgba(255, 0, 0, ' + opacity + ')',
          width: 0.25 + opacity,
        }),
      }),
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
    if (elapsed > duration) {
      unByKey(listenerKey);
      return;
    }
    // tell OpenLayers to continue postrender animation
    map.render();
  }
}

function addEvent(elem, event, func ) {
  if (!!window.attachEvent) { elem.attachEvent('on' + event, func); }
  else  { elem.addEventListener(event, func, false); }
}





// 사각영역 좌표변환
function transform(extent) {
  return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

// 좌표변환 3857 -> 4326
function tfPoint1(coord) {
  return tf(coord, 'EPSG:3857', 'EPSG:4326');
}
// 좌표변환 4326 -> 3857
function tfPoint2(coord) {
  return tf(coord, 'EPSG:4326', 'EPSG:3857');
}


