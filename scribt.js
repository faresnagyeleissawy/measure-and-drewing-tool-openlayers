// class of map
class OlMap {
  constructor(
    map_div,
    zoom = 7,
    center = [3471016.883024078, 3507935.144251259]
  ) {
    this.map = new ol.Map({
      target: map_div,
      view: new ol.View({
        center: ol.proj.transform(
          [31.231255160736538, 30.045877615975883],
          "EPSG:4326",
          "EPSG:3857"
        ),
        zoom: zoom,
      }),
      layers: [],
    });
  }
}

// basemaps layers import
const lightmap = new ol.layer.Tile({
  source: new ol.source.OSM(),
  visible: true,
  title: "lightMap",
});
const grayMap = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png",
    tilePixelRatio: 2,
    maxZoom: 20,
  }),
  visible: false,
  title: "grayMap",
});
//add basemaps layer to map
basemap = new OlMap("map");
basemap.map.addLayer(lightmap);
basemap.map.addLayer(grayMap);

//

// make a group of basemap layers
const basemapGroup = new ol.layer.Group({
  layers: [lightmap, grayMap],
});
// add event listener to radio inputs
const changers = document.querySelectorAll("input");
changers.forEach((changer) => {
  changer.addEventListener("change", function (element) {
    const layer_name = element.target.id;
    // read id attribute from html elemnt equal layer name
    basemapGroup.getLayers().forEach((layer) => {
      // set true visible for selected layer
      if (layer_name === layer.get("title")) {
        layer.setVisible(true);
        // console.log(layer_name);
      } else {
        layer.setVisible(false);
      }
    });
  });
});
// class of vectorlayer
class VectorLayer {
  //Constructor accepts title of vector layer and map object
  constructor(title) {
    this.layer = new ol.layer.Vector({
      title: title,
      source: new ol.source.Vector({}),
    });
  }
}

drawlayer = new VectorLayer("drawLayer").layer;
basemap.map.addLayer(drawlayer);
let ISdraw = true;
let drawInteraction;
let drawType = "Point";

//function to creat drowinteraction
function createdrawInteraction(featureType, layer) {
  return new ol.interaction.Draw({
    type: featureType,
    source: layer.getSource(),
    style: new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({ color: "rgba(255, 255, 255, 0.2)" }),
        stroke: new ol.style.Stroke({ color: "rgba(0, 0, 0, 0.7)", width: 2 }),
        radius: 5,
      }),
      fill: new ol.style.Fill({ color: "rgba(255, 255, 255, 0.2)" }),
      stroke: new ol.style.Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        lineDash: [10, 10],
        width: 2,
      }),
    }),
  });
}
// ///

//////
drawOption = document.querySelector(".dropDwon");
drawOption.addEventListener("change", (e) => {
  const selecteDrawType = e.target.value;
  drawType = selecteDrawType;
  array = document.querySelectorAll(".pop");
  for (i = 0; i < array.length; i++) {
    array[i].innerHTML = "";
  }

  if (!ISdraw) {
    basemap.map.removeInteraction(drawInteraction);
    drawInteraction = createdrawInteraction(drawType, drawlayer);
    basemap.map.addInteraction(drawInteraction);
  }
});
// ////////////////////////// handel draw btn/////////////////////////////////
const drowbtn = document.querySelector(".drowbtn");
drowbtn.addEventListener("click", (e) => {
  if (ISdraw) {
    drawInteraction = createdrawInteraction(drawType, drawlayer);
    basemap.map.addInteraction(drawInteraction);
    ISdraw = false;
  } else {
    basemap.map.removeInteraction(drawInteraction);
    ISdraw = true;
  }
});

const formatLength = function (line) {
  const length = line.getLength();
  let output;
  if (length > 100) {
    output = Math.round((length / 1000) * 100) / 100 + " " + "km";
  } else {
    output = Math.round(length * 100) / 100 + " " + "m";
  }
  return output;
};
// /////
const formatArea = function (polygon) {
  const area = polygon.getArea();
  let output;
  if (area > 10000) {
    output = Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
  } else {
    output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
  }
  return output;
};

/////// handel mearsure btn and logic/////////////////////////////////////////////////

measurelayer = new VectorLayer("measurelayer").layer;
basemap.map.addLayer(measurelayer);
const measurebtn = document.querySelector(".measurebtn");
measurebtn.addEventListener("click", (e) => {
  if (ISdraw) {
    //point location
    if (drawType == "Point") {
      drawInteraction = createdrawInteraction(drawType, measurelayer);
      creatpopupwithchlick(0, "Point");

      //line and length
    } else if (drawType == "LineString") {
      drawInteraction = createdrawInteraction(drawType, measurelayer);
      popnew = creatPopupDynamic();
      drawInteraction.on("drawstart", (e) => {
        fet = e.feature.getGeometry().on("change", (e) => {
          const geom = e.target;
          length = formatLength(geom);
          element.style.display = "block";
          element.innerHTML = length;
          creatpopupwithchlick(1, "LineString", length);

          tooltipCoord = geom.getLastCoordinate();
          popnew.setPosition(tooltipCoord);
        });
      });

      //poligon area
    } else {
      drawInteraction = createdrawInteraction(drawType, measurelayer);
      popnew = creatPopupDynamic();
      drawInteraction.on("drawstart", (e) => {
        fet = e.feature.getGeometry().on("change", (e) => {
          const geom = e.target;
          area = formatArea(geom);
          element.style.display = "block";
          element.innerHTML = area;
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
          popnew.setPosition(tooltipCoord);
          drawInteraction.on("drawend", (e) => {});
        });
      });
    }
    basemap.map.addInteraction(drawInteraction);
    ISdraw = false;
  } else {
    basemap.map.removeInteraction(drawInteraction);
    ISdraw = true;
  }
});

//function to creat dynamic popup in point
function creatPopupDynamic() {
  const popnew = new ol.Overlay({
    element: document.getElementById("popdyn"),
    offset: [15, 0],
    positioning: "center-left",
  });
  basemap.map.addOverlay(popnew);
  element = document.getElementById("popdyn");
  return popnew;
}

// /////function to add popup in every point
function creatpopupwithchlick(index, draw, value) {
  id = index;
  basemap.map.on("click", (e) => {
    let newpopup = "popup" + id;
    let insertedpop = "<div class='pop' id='" + newpopup + "'></div>";
    document
      .querySelector("#popup")
      .insertAdjacentHTML("afterend", insertedpop);
    const popup = new ol.Overlay({
      element: document.getElementById(newpopup),
      offset: [15, 0],
      positioning: "center-left",
    });
    basemap.map.addOverlay(popup);
    element = document.getElementById(newpopup);
    popup.setPosition(e.coordinate);
    el = document.querySelector("#popup");
    ele = document.querySelector("#popup0");
    if (draw == "Point") {
      element.innerHTML = e.coordinate;
    } else if (draw == "LineString") {
      element.innerHTML = value;
      id++;
    } else {
      element.innerHTML = value;
      id++;
    }
  });
}

let removeInteractions = () => {
  basemap.map
    .getInteractions()
    .getArray()
    .forEach((interaction) => {
      basemap.map.removeInteraction(interaction);
    });
};

var clearbtn = document.querySelector(".clear");
clearbtn.addEventListener("click", (e) => {
  removeInteractions();
  basemap.map.getOverlays().clear();
  measurelayer.getSource().clear();
  drawlayer.getSource().clear();
});
// ////////////////////
