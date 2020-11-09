import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import ImageLayer from 'ol/layer/Image';
import Feature from 'ol/Feature';
import {xhr} from 'ol/featureloader';
import Polygon from 'ol/geom/Polygon';
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { Draw, Modify, Snap, Select, Translate } from "ol/interaction";
import { MousePosition } from "ol/control";
import { fromLonLat, transform as tf, transformExtent } from "ol/proj";
import { createStringXY } from "ol/coordinate";
import { OSM,  Vector as VectorSource } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";

//지도 위치 + 좌표변환
const center = [127.0888, 37.1240];
const transCenter = fromLonLat(center);
var source = new VectorSource();
var vector = new VectorLayer({
  source: source,
  style: new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)"
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
  })
});


var select = new Select();
var translate = new Translate({
  features: select.getFeatures()
});
var modify = new Modify({ source: source });
var draw, snap; // global so we can remove them later
var typeSelect = document.getElementById("type");

// var extents = {
//     feature1:[tfPoint(),tfPoint(),tfPoint(),tfPoint(),tfPoint()],
//     LG: transform([14146870.51, 4456851.69, 14148050.49, 4455930.23]),
// };

var raster = new TileLayer({
  extent: [14146870.51, 4456851.69, 14148050.49, 4455930.23],
  source: new OSM()
});
  
//마우스 좌표 표시
var mousePositionCtrl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
  undefinedHTML: '&nbsp;'
});

//지도 생성
var map = new Map({
  controls : [mousePositionCtrl],
  layers: [raster, vector],
  target: "map",
  view: new View({
    center: transCenter,
    zoom: 17,
    maxZoom: 20,
    // minZoom: 17,
  })
});

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
        coords.forEach(coord => {
          console.log(tfPoint1(coord));
        });
      });
    // 도형 수정 (수정한 좌표영역 )
    }else if(value === "Modify") {
      map.addInteraction(modify);

      modify.on("modifyend", (e) => {
        const polygon = e.features.getArray()[0].getGeometry();
        const coords =  polygon.getCoordinates()[0];
        
        coords.forEach(coord => {
          console.log(tfPoint1(coord));
        });
      })
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
    }else if(value === "Load"){
      source.addFeature(polygonFeature);
    }
    else {
      map.removeInteraction(draw);
      map.removeInteraction(modify);
      map.removeInteraction(select);
      map.removeInteraction(translate);
      source.removeFeature(polygonFeature);
    }
  
}

//도형 제거
function remove() {
  var selectFeature = select.getFeatures().getArray()[0];
  console.log(selectFeature)
  source.removeFeature(selectFeature);
}

//좌표로 feature 생성
var polygonFeature = new Feature(
  new Polygon([[[14146870.51,4455930.23],[14148050.49,4455930.23],[14148050.49, 4456851.69],[14146870.51, 4456851.69],[14146870.51,4455930.23]],])
  );

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


