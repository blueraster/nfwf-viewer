
      dojo.require("dijit.dijit"); // optimize: load dijit layer
      dojo.require("dijit.layout.BorderContainer");
      dojo.require("dijit.layout.ContentPane");
      dojo.require("esri.map");
      dojo.require("dijit.TitlePane");
      dojo.require("esri.dijit.BasemapGallery");
      dojo.require("dijit.form.RadioButton");
      dojo.require("esri.arcgis.utils");      
      dojo.require("dojo.hash");
      dojo.require("esri.tasks.query");
      dojo.require("dojox.gesture.tap");
      dojo.require("dojox.mobile.deviceTheme");      
      dojo.require("dojox.mobile.View");
      dojo.require("dojox.mobile.ScrollableView");
      dojo.require("dojox.mobile.EdgeToEdgeList");
      dojo.require("esri.dijit.Legend");
      dojo.require("dojox.mobile.ListItem");
      dojo.require("dojox.mobile");
      dojo.requireIf(!dojo.isWebKit, "dojox.mobile.compat");
      
      

      function init() {

        


      esri.config.defaults.geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

      // Proxy for use on staging
      esri.config.defaults.io.proxyUrl = 'http://staging.blueraster.com/proxy/proxy.php';

       dojo.setObject("app.map");
       dojo.setObject("app.config");
       dojo.setObject("app.controller",{});
       dojo.setObject("app.model",{});
       dojo.setObject("app.vo",{});


       app.config = appConfig();       
       var conf = app.config;
       //init viewmodel
       app.config.vmodel = new koModel();
       ko.applyBindings(app.config.vmodel);

       var webmap = conf.webmap;
       
       

        var mapDeferred = esri.arcgis.utils.createMap(webmap, "map", {
          mapOptions: {
            slider: true,
            nav:false,
            displayGraphicsOnPan:false,
            lods:[ 
              //{"level":0,"resolution":156543.033928,"scale":591657527.591555},
              //{"level":1,"resolution":78271.5169639999,"scale":295828763.795777},
              //{"level":2,"resolution":39135.7584820001,"scale":147914381.897889},
              {"level":3,"resolution":19567.8792409999,"scale":73957190.948944},
              {"level":4,"resolution":9783.93962049996,"scale":36978595.474472},
              {"level":5,"resolution":4891.96981024998,"scale":18489297.737236},
              {"level":6,"resolution":2445.98490512499,"scale":9244648.868618},
              {"level":7,"resolution":1222.99245256249,"scale":4622324.434309}
          //    {"level":8,"resolution":611.49622628138,"scale":2311162.217155},
           //   {"level":9,"resolution":305.748113140558,"scale":1155581.108577},
            //  {"level":10,"resolution":152.874056570411,"scale":577790.554289},
             // {"level":11,"resolution":76.4370282850732,"scale":288895.277144},
             // {"level":12,"resolution":38.2185141425366,"scale":144447.638572}
           //   {"level":13,"resolution":19.1092570712683,"scale":72223.819286},
          //    {"level":14,"resolution":9.55462853563415,"scale":36111.909643} 
            //{"level":15,"resolution":4.77731426794937,"scale":18055.954822},
            //{"level":16,"resolution":2.38865713397468,"scale":9027.977411},
            //{"level":17,"resolution":1.19432856685505,"scale":4513.988705},
            //{"level":18,"resolution":0.597164283559817,"scale":2256.994353},
            //{"level":19,"resolution":0.298582141647617,"scale":1128.497176}];              
              ]
          },
          ignorePopups:true
        });

        mapDeferred.addCallback(function(response) {
        
          console.log(response);
           

          app.webmap = response;
          app.map = response.map;
          
        

          conf.initExtent = app.map.extent;

          dojo.setObject("app.controller.queryController");
          app.controller.queryController = new QueryController(app.map);

          var map = response.map;

          if(map.loaded){
           
                initUI(response);

              }
              else{
                dojo.connect(map,"onLoad",function(){
                  initUI(response);
                });
          }         

          /*var layerInfo = dojo.map(response.itemInfo.itemData.operationalLayers,function(layer,index){
            console.dir(layer);
            return {layer: layer.layerObject, title: layer.layerObject.name};
          });

          if (layerInfo.length > 0) {
             var legendDijit = new esri.dijit.Legend({
               map: map,
               layerInfos: layerInfo,
             },"legend");
            
             legendDijit.startup();
          }
          */

        });// end mapDeferred.addCallback

        mapDeferred.addErrback(function(error) {
          console.log("Map creation failed: ", dojo.toJson(error));
        });
      }//init

      function  initUI(response){

          var conf = app.config;
         var opLayers = response.itemInfo.itemData.operationalLayers;
         var urlObject = esri.urlToObject(document.location.href);
        
        if (urlObject.query) {
          if (urlObject.query["program"]){
          //ignorePopups = false;
          app.config.mode="program";
          }
        }

          dojo.forEach(opLayers,function(layer){            
            if ((layer.id.toUpperCase().indexOf(conf.featuresTitle.toUpperCase())>-1) && (layer.resourceInfo.type=="Feature Layer")){                                    
              conf.featuresURL = layer.url;//.replace("https://","http://");              
            }
          })

          //resize the map when the browser resizes
          dojo.connect(window, 'resize',function(){
            app.map.resize();
          });

          dojo.connect(app.map.infoWindow, 'onHide',function(){
            clearMapGraphics();
            if (dijit.byId("mainView")){
              dijit.byId("mainView").destroyRecursive();
            }
          });
          

          //if (ignorePopups){
           dojo.connect(app.map, "onClick", mapClick); 
          //}
          

           if (app.config.mode=="program"){
            showThisProgram(urlObject.query["program"]);
            urlObject.query["theme"]="none";//force theme to be none
            app.config.activeWhere = app.config.programQueryField+"='"+urlObject.query["program"]+"'";
          } else {
              //its a theme
              if (urlObject.query){
                 showThisTheme(urlObject.query["theme"],opLayers,app.map);
              } else {             
                 showThisTheme("conservationp",opLayers,app.map);
              } 


          }         
 

          createBasemapGallery();
          addFullExtentButton();
      }


      function createBasemapGallery() {
        //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
        var basemaps = [];
        // National Geographic
        var NatGeoLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer"
        });
        var NatGeo = new esri.dijit.Basemap({
          layers: [NatGeoLayer],
          title: "National Geographic",
          thumbnailUrl: "./images/natgeo.jpg"
        });
        basemaps.push(NatGeo);
        // Light Gray Canvas Layer
        var lightGrayLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer"
        });
        var lightGrayRefLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer"
        });
        var lightGray = new esri.dijit.Basemap({
          layers: [lightGrayRefLayer,lightGrayLayer],
          title: "Light Gray Canvas",
          thumbnailUrl: "./images/light_gray_canvas.png"
        })
        basemaps.push(lightGray);
        // World Terrain with Labels
        var worldTerrainLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer"
        });
        var worldTerrainRefLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer"
        });
        var worldTerrain = new esri.dijit.Basemap({
          layers: [worldTerrainRefLayer,worldTerrainLayer],
          title: "Terrain with Labels",
          thumbnailUrl: "./images/Terrain_with_labels.png"
        })
        basemaps.push(worldTerrain);
        // Topographic Layer
        var topoLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
        });
        var topo = new esri.dijit.Basemap({
          layers: [topoLayer],
          title: "Topographic",
          thumbnailUrl: "./images/topographic.jpg"
        });
        basemaps.push(topo);
        // Imagery 
        var imageryLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
        });
        var imagery = new esri.dijit.Basemap({
          layers: [imageryLayer],
          title: "Imagery",
          thumbnailUrl: "./images/imagery.jpg"
        })
        basemaps.push(imagery);
        //Imagery with Labels
        var imageryRefLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer"
        });
        var imageryLabels = new esri.dijit.Basemap({
          layers: [imageryRefLayer,imageryLayer],
          title: "Imagery with Labels",
          thumbnailUrl: "./images/imagery_with_labels.png"
        })
        basemaps.push(imageryLabels);
        // Streets Map
        var streetsLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"
        })
        var streets = new esri.dijit.Basemap({
          layers: [streetsLayer],
          title: "Streets",
          thumbnailUrl: "./images/streets.jpg"
        });
        basemaps.push(streets);
        // Oceans
        var oceansLayer = new esri.dijit.BasemapLayer({
          url: "http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer"
        });
        var oceans = new esri.dijit.Basemap({
          layers: [oceansLayer],
          title: "Oceans",
          thumbnailUrl: "./images/oceans.jpg"
        });
        basemaps.push(oceans);

        // Add the Basemaps Array to the Basemap Gallery Widget and Start it up

        var basemapGallery = new esri.dijit.BasemapGallery({
          showArcGISBasemaps: false,
          basemaps: basemaps,         
          map: app.map
        }, "basemapGallery");

        basemapGallery.startup();

        dojo.connect(basemapGallery, "onError", function(msg) {console.log(msg)});
        dojo.connect(basemapGallery,"onLoad",function(){
            basemapGallery.select("basemap_3");
        });

      }

      function addFullExtentButton(){
                //Add Zoom to Extent buttom
        dojo.query(".esriSimpleSliderDecrementButton").forEach(function(node){
            dojo.place("<div id='fullExtentDiv'><img src='images/usa.png'/></div>",node,"before");
            dojo.connect(dojo.byId("fullExtentDiv"),"onclick",function(){
              app.map.setExtent(app.config.initExtent);
            });
        });

        dojo.query(".esriSimpleSliderDecrementButton").forEach(function(node){
          node.innerHTML = "";
          dojo.place("<img src='images/minus.png'/></div>",node);
        });
        dojo.query(".esriSimpleSliderIncrementButton").forEach(function(node){
          node.innerHTML = "";
          dojo.place("<img src='images/plus.png'/></div>",node);
        });
      }


      function showThisTheme(targetLayer,opLayers,map) {

         dojo.query("#themeList li").forEach(function(node){
          if (node.id==targetLayer){
             dojo.addClass(node,"themeSelected");
           } else {
             dojo.removeClass(node,"themeSelected");
           }         
        });

       
       app.map.infoWindow.hide();

       app.config.activeTheme = targetLayer;

       if (app.config.activeTheme=="conservationp") {
        dojo.query("#map_zoom_slider").addClass("showthemeMenu");
        dojo.query("#basemapContainer").addClass("showthemeMenu");
        dojo.style("themeMenu","display","block");
       }
       
       
       dojo.forEach(opLayers,function(layer){
        if (layer.id.toUpperCase().indexOf(targetLayer.toUpperCase())<0){
          console.log("remove " + layer.id);
          map.getLayer(layer.id).hide();          
        } else {
          console.log("keep " + layer.id);
          map.getLayer(layer.id).show();
          app.config.activeWhere = app.config.themeQueryWhere[targetLayer];      
        }
       })
       
       app.config.vmodel.activeTheme(app.config.activeTheme);

       

      }

      function showThisProgram(program) {
        
        var qController = app.controller.queryController;

        qController.set("where",app.config.programQueryField+"='"+program+"'");  //seaturtles, apachetrout      
        qController.set("url",app.config.featuresURL);
        //qController.set("url","https://services.arcgis.com/wKiTqqEYQLgNM4kT/arcgis/rest/services");

        qController.queryByAttribute();

      }

      

      function updateMap(themeID){       

        showThisTheme(themeID,app.webmap.itemInfo.itemData.operationalLayers,app.map);     

      }

      function mapClick(evt){



          if (dijit.byId("mainView")){
            dijit.byId("mainView").destroyRecursive();
          }

          clearMapGraphics();

          app.map.infoWindow.hide();

          var pt = evt.mapPoint;
          var qController = app.controller.queryController;
          pt = {x: pt.x, y: pt.y,spatialReference: {wkid: 102100 }}
          qController.set("where",app.config.activeWhere);
          qController.set("pt",pt);
          qController.set("url",app.config.featuresURL);

          qController.queryByGeometry();
  
      }

      //show map on load
      dojo.ready(init);
    