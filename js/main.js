
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
      dojo.require("dojox.mobile.ListItem");
      dojo.require("dojox.mobile");
      dojo.requireIf(!dojo.isWebKit, "dojox.mobile.compat");
      
      

      function init() {
      //  esri.config.defaults.io.proxyUrl = "/arcgisserver/apis/javascript/proxy/proxy.ashx";
        //This service is for development and testing purposes only. We recommend that you create your own geometry service for use within your applications. 
       // esri.config.defaults.geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
      /* Modernizr.load({
        test: Modernizr.touch,
        yep : 'js/mouseEventsTablet.js',
        nope: 'js/mouseEventsDesktop.js'
      });*/
      esri.config.defaults.geometryService = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

       dojo.setObject("app.map");
       dojo.setObject("app.config");
       dojo.setObject("app.controller",{});
       dojo.setObject("app.model",{});
       dojo.setObject("app.vo",{});


       app.config = appConfig();       
       var conf = app.config;

      
       var webmap = conf.webmap;
       
       

        var mapDeferred = esri.arcgis.utils.createMap(webmap, "map", {
          mapOptions: {
            slider: true,
            nav:false,
            displayGraphicsOnPan:false
          },
          ignorePopups:true
        });

        mapDeferred.addCallback(function(response) {
        
          console.log(response);
           

         // app.webmap = response;
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


        });

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
            if (layer.resourceInfo.type=="Feature Layer"){
              conf.featuresURL = layer.url;
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
                 showThisTheme("all",opLayers,app.map);
              } 


          }         
 

          createBasemapGallery();
          addFullExtentButton();
      }


      function createBasemapGallery() {
        //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
        var basemapGallery = new esri.dijit.BasemapGallery({
          showArcGISBasemaps: true,         
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

       if (app.config.activeTheme=="all") {
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

      }

      function showThisProgram(program) {
       
        var qController = app.controller.queryController;

        qController.set("where",app.config.programQueryField+"='"+program+"'");  //seaturtles, apachetrout      
        qController.set("url",app.config.featuresURL);

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

          qController.set("where",app.config.activeWhere);
          qController.set("pt",pt);
          qController.set("url",app.config.featuresURL);

          qController.queryByGeometry();
  
      }

      //show map on load
      dojo.addOnLoad(init);
    