import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { Draw, Modify, Snap, Select, Translate } from "ol/interaction";
import { MousePosition, defaults as defaultControls, FullScreen, Zoom } from "ol/control";
import { fromLonLat, transform as tf, transformExtent, Projection } from "ol/proj";
import { createStringXY } from "ol/coordinate";
import { OSM,  Vector as VectorSource , ImageStatic} from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import Image from "ol/layer/image";
import {getCenter} from 'ol/extent';
import {extents} from './coord';
import {Point ,MultiPoint} from 'ol/geom';
import {getVectorContext} from 'ol/render';
import {easeOut} from 'ol/easing';
import {unByKey} from 'ol/Observable';

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
      width: 2
    }),
    image: new CircleStyle({
      radius: 7,
      fill: new Fill({
        color: "#ffcc33"
      })
    })
  }),
  new Style({
    image: new CircleStyle({
      radius: 0,
      fill: new Fill({
        // color: 'orange'
      }),
    }),
    geometry: function(feature) {
      // return the coordinates of the first ring of the polygon
      var coordinates = feature.getGeometry().getCoordinates()[0];
      return new MultiPoint(coordinates);
    }
  })
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
]
}
);
var translate = new Translate({
  features: select.getFeatures()
});
var modify = new Modify({ source: source });
var draw, snap; // global so we can remove them later
var typeSelect = document.getElementById("type");


var projection = new Projection({
  code: 'xkcd-image',
  units: 'pixels',
  extent: extents.LG2,
});



var raster = new TileLayer({
  // extent: [14146870.51, 4456851.69, 14148050.49, 4455930.23],
  source: new OSM()
  
});

var image = new Image({
  source: new ImageStatic({
    // url : 'http://mpole.co.kr/resource/img/mpole/LG.png',
    url : 'http://mpole.co.kr/resource/img/mpole/LG평택map_9000.png',
    crossOrigin: '',
    projection: projection,
    imageExtent: extents.LG2
  })
})
  
//마우스 좌표 표시
var mousePositionCtrl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

var viewport = document.getElementById('map');

function getMinZoom() {
  var width = viewport.clientWidth;
  return Math.ceil(Math.LOG2E * Math.log(width / 256));
}

var initialZoom = getMinZoom();
var view = new View({
  center: getCenter(extents.LG2),
  projection: projection,
  zoom: initialZoom,
  minZoom: 2,
  maxZoom: 5 
})
//지도 생성
var map = new Map({
  controls : defaultControls().extend([new FullScreen(),mousePositionCtrl]),
  layers: [  image, vector ],
  target: "map",
  view: view
});

window.addEventListener('resize', function () {
  var minZoom = getMinZoom();
  if (minZoom !== view.getMinZoom()) {
    view.setMinZoom(minZoom);
  }
});

var selectedFeatures = select.getFeatures();

//지도 기능 추가
function addInteractions() {
  var value = typeSelect.value;
  //polygone 선택 시 그리기
  if(value === "Polygon"){
        draw = new Draw({
          source: source,
          type: "Polygon"
        });
      map.addInteraction(draw);
      snap = new Snap({ source: source });
      map.addInteraction(snap);
      
      //다각형의 영역 좌표 출력
      draw.on('drawend',(e) => {
        const polygon = e.feature.getGeometry();
        const coords =  polygon.getCoordinates()[0];
        console.log(coords)
        
      });
    // 도형 수정 (수정한 좌표영역 )
    }else if(value === "Modify") {
      map.addInteraction(modify);

      
    }else if(value === "Select") {
      map.addInteraction(select);
      map.addInteraction(translate);
    }else if(value === "Remove"){
      map.addInteraction(select);
      
      select.on("select", () => {
        document.addEventListener("keydown", (e) => {
          const keyCode = e.keyCode;
          if(keyCode === 8) {
            remove()
          }
        })
      })
      //좌표로 만든 도형 추가
    }else if(value === "Area"){
      source.clear()
      var feature = loadArea()
      source.addFeature(feature);
      map.addInteraction(select);
      selecting();
    }else if(value === "Building"){
      source.clear()
      map.addInteraction(select);
      map.addInteraction(translate);
      
      var list = loadBuildings()
      source.addFeatures(list);
      selecting();
    }
    else if(value === "Road"){
      source.clear()
      map.addInteraction(select);
      map.addInteraction(translate);
      var list = loadRoads()
      source.addFeatures(list);
      selecting();
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
  select.once("select", (target) => {
    map.addInteraction(modify);
    modify.on("modifyend", (e) => {
      // const polygon = e.features.getArray()[0].getGeometry();
      // const coords =  polygon.getCoordinates()[0];
      // console.log(coords);
    })
    
    document.addEventListener("keydown", (e) => {
      const keyCode = e.keyCode;
      if(keyCode === 8) {
        remove()
        // console.log(target.selected[0])
        // source.removeFeature(target.selected[0]);
      }
    })
  })
  
}


//도형 제거
function remove() {
  var selectFeature = select.getFeatures().getArray()[0];
  // console.log(selectFeature)
  selectedFeatures.clear()
  source.removeFeature(selectFeature);
}

//건물 가져오기
var loadBuildings = () => {
  var list =[]; 
  for(var i=0; i< extents.buildings.length; i++){
    list.push(new Feature(new Polygon([extents.buildings[i]])))
  }
  return list;
}
//도로 가져오기
var loadRoads = () => {
  var list =[]; 
  for(var i=0; i< extents.roads.length; i++){
    list.push(new Feature(new Polygon([extents.roads[i]])))
  }
  return list;
}

//부지영역 가져오기
var loadArea = () => {
  var area = new Feature(new Polygon([extents.area])) 
  return area;
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


//경비실 위치 확인
const secu = document.getElementById('securities');
secu.addEventListener('click', (e)=>{
  e.preventDefault();
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