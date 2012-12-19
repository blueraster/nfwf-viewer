
function QueryController(map){
	var that= this;
	this.map = map;

	var featureLayer;
	var query = new esri.tasks.Query();
	

	var selectedSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, 
						 new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, 
						 new dojo.Color([255,0,0]), 1), new dojo.Color([255,255,0,0.25]));

	var highlightSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, 
						 new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, 
						 new dojo.Color([0,0,255]), 1), new dojo.Color([255,255,0,1]));

	/*var progressSymbol = new esri.symbol.PictureMarkerSymbol({
						    "url":"images/progress_indicator.gif",
						    "height":20,
						    "width":20,
						    "type":"esriPMS"
						  });*/

	var geometryBank = {};
	var currentlyDisplayGraphics = {};
	var homeInfoHeight=0;
	var defaultHeight=300;
	var eventsArray = [];


	

	var options = {
		where:"",
		pt:"",
		url:""
	}

	//setter
	this.set = function(name,value){
		options[name]=value;
	}

	//getter
	this.get = function(name){
		return options[name];
	}


	this.queryByGeometry = function(){

		if (app.config.progress){
			return;
		} else {
			app.config.progress=true;
		}

		//show progress
		
		/*if (app.config.mode=="theme"){
		var progressGra = new esri.Graphic(options.pt,progressSymbol);
		app.map.graphics.add(progressGra);
		}*/

		if (featureLayer==undefined){
		dojo.forEach(app.map.graphicsLayerIds,function(id){
			if (id.toUpperCase().indexOf(app.config.featuresId.toUpperCase())>-1){
				featureLayer = app.map.getLayer(id);
				featureLayer.setMaxAllowableOffset(5000);
				console.log(featureLayer);
			}

		});
		}
		var orderByFields = "Program";
		if (app.config.activeTheme==""){
			orderByFields = "PriorityTh,Program";
		}

		var content = {
						//returnGeometry:false,
						geometry: dojo.toJson(options.pt),
						where: options.where,
						geometryType:"esriGeometryPoint",
						orderByFields:orderByFields,
						f:"json",
						outFields:"*"
		             }


		dojo.io.script.get({
		  url : options.url + "/query",//"http://services.arcgis.com/wKiTqqEYQLgNM4kT/arcgis/rest/services/Footprints_web_4Dec2012/FeatureServer/0",//,
		  content: content,
		  callbackParamName : "callback",
		  handle: dojo.hitch(that,"infoWindowContentHandler"),
		  'error': function(err) {
		  	console.log(err);
		  }
		});	


	}

	this.infoWindowContentHandler = function(response){

		console.log('infoWindowContentHandler >>> Line 109');

		if (response.features.length>0) {


		var title = "";
		var content = {};
		//var contentTemplate = [];
		var listGeomQuery = [];
		var listGeomNoQuery = [];
		var listGeomSelected = [];


		var features = response.features;

		if (features.length>1){
			title = features.length + " projects";
		} else if (features.length==1) {
			title = features[0].attributes.Program;
		}

		dojo.forEach(features,function(feature){
			var id = feature.attributes[app.config.featuresUniqueField];
			var theme = feature.attributes[app.config.themeField];
			var idStr = "ID"+id;
			console.log(id);
			listGeomSelected.push(idStr);
			if (geometryBank[idStr]==undefined){
				listGeomQuery.push(id);
			} else {
				listGeomNoQuery.push(idStr);
			}
			
			if (content[theme]==undefined){
				content[theme] = [];
			}
			content[theme].push({id:idStr,attributes:feature.attributes});
			//content.push("<div id='"+idStr+"' class='clickable' onmouseover='highlightSymbol(this)' onmouseout='defaultSymbol(this)'>"+feature.attributes.Program+"<div>");
		});

		that.buildInfoWindow(content);


		console.log(listGeomQuery);

		app.map.infoWindow.setTitle(features.length + (features.length>1?" Programs found":" Program found"));
			
		if (app.config.mode=="theme") {//show identified graphics

				if (listGeomQuery.length==0){
					//clearMapGraphics();
					app.config.progress=false;
				} else {
					query.geometry = options.pt || null;
					query.where = app.config.featuresUniqueField + " IN ("+listGeomQuery.join(",")+")";
					query.maxAllowableOffset = 5000;
					featureLayer.selectFeatures(query,esri.layers.FeatureLayer.SELECTION_NEW,that.returnedFeatures);
				}

				if (listGeomNoQuery.length>0){
					that.showGraphics(listGeomNoQuery);
				}

		} else {
			app.config.progress=false;		
		}

	} else {//end if

		app.config.progress=false;		
		//clearMapGraphics();
		
	}
	}

	this.buildInfoWindow = function(contentObj){
		console.log("buildInfoWindow");

		var mainView = new dojox.mobile.View({id:"mainView","class":"mblMainView"},dojo.create("div"));
		var listView = new dojox.mobile.View({id:"programsView","class":"mblViews"},dojo.create("div"));	

		var programList = new dojox.mobile.EdgeToEdgeList({
							id:"programList","class":"mblViews"},dojo.create("ul"));

		mainView.addChild(listView);
		listView.addChild(programList);

		var totalPopupItems = 0;
		
		homeInfoHeight=0;

		for (var item in contentObj) {

		//add theme title item
		if (app.config.activeTheme=="all") {
	  	 var itemTitle = new dojox.mobile.ListItem({
	           label: item,
	           id:item+"Theme",
	           "class":"popupListTitle"
	        }, dojo.create("li"));

	  	 programList.addChild(itemTitle);
	  	 totalPopupItems++;
	  	 homeInfoHeight+=22;
	  	 }

	  	 //add all features title for the theme
		dojo.forEach(contentObj[item],function(item){

		  var infoView = new dojox.mobile.View({id:"View"+item.id,"class":"mblViews"},dojo.create("div"));

		  var text ="<div style='position:absolute;left:-8px;top:-8px'><span onclick=homeView('programsView') class='clickable'><strong> << back</strong></span>"+
		  		"<br><br></div> <div style='padding:0px'>";
		  		if ( (item.attributes.Program != null) && item.attributes.Program.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div class='popupContentItem'>" + item.attributes.Program + "</div>";
		  		}
		  		if ( (item.attributes.ImageLink != null) && item.attributes.ImageLink.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div class='popupContentItem' style='width:340px;text-align:center;overflow:hidden'><img style='max-width:340px;height:auto' src='" + item.attributes.ImageLink + "'></div>";
		  		}
		  		if ( (item.attributes.Sub_prgrm != null) && item.attributes.Sub_prgrm.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div class='popupContentItem'>" + item.attributes.Sub_prgrm + "</div>";
		  		}
		  		if ( (item.attributes.Note != null) && item.attributes.Note.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div class='popupContentItem'>" + item.attributes.Note + "</div>";
		  		}
		  		if ( (item.attributes.ShortDescr != null) && item.attributes.ShortDescr.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div class='popupContentItem'>" + item.attributes.ShortDescr + "</div>";
		  		}
		  		if ( (item.attributes.ProgramHom != null) && item.attributes.ProgramHom.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div class='popupContentItem'><a href='" + item.attributes.ProgramHom + "' target='_blank' class='clickable'>Program details</a></div>";
		  		}

	  			text+="</div>"
		  			

		  var content = new dijit.layout.ContentPane({content:text,"class":"popupContent"},dojo.create("div"));
		  infoView.addChild(content);
		 
		  //infoView.content="fdfds";
		  mainView.addChild(infoView);
		  console.log("View"+item.id);
		  var li = dojo.create("li");

          var item = new dojox.mobile.ListItem({
                   label: item.attributes.Program,
                   moveTo:"View"+item.id,
                   id:item.id,
                   "class":"popupListItem",
                   onClick:dojo.partial(that.transitionView,"View"+item.id)                   
                }, li);

         dojo.addClass(item.domNode,"clickable");

         if (app.config.mode=="theme") {
         var overEvt = dojo.connect(item.domNode,"onmouseover",function(evt){
				dojo.partial("highlightSymbol",item.id)();				
         });
       

         var outEvt = dojo.connect(item.domNode,"onmouseout",function(evt){ 	
      		dojo.partial("defaultSymbol",item.id)();
         });
         }

         
          programList.addChild(item);
          homeInfoHeight+=25;
          totalPopupItems++;

		});

		}//end for 

		//mainView.addChild(programList);
		homeInfoHeight = totalPopupItems*25;
		app.map.infoWindow.resize(350, homeInfoHeight)
		app.map.infoWindow.setContent(mainView.domNode);
		app.map.infoWindow.show(options.pt);
		
	}

	this.transitionView = function(id){
			//alert(homeInfoHeight);
			console.log(arguments);			
			var height=defaultHeight;
			if (id=="programsView"){height=homeInfoHeight}
			app.map.infoWindow.resize(400, height);
			var v = dojox.mobile.currentView;
            v.performTransition(id,1,"fade");
            //var domNode = dojo.query(".sizer.content .contentPane")[0];		
			//var cpInfoWindow = dijit.getEnclosingWidget(domNode);
			//cpInfoWindow.resize();
			
            
	}

	this.returnedFeatures = function(response,method){
		
		//get geometry we dont have yet

		var listGeomSelected = [];

		dojo.forEach(response,function(graphic){
			//graphic.show();
			var id = graphic.attributes[app.config.featuresUniqueField];
			var idStr = "ID"+id;
			listGeomSelected.push(idStr);
			geometryBank[idStr] = graphic.geometry;
			//app.map.graphics.add(graphic);

		});	

		if (listGeomSelected.length>0){
			//clearMapGraphics();
			app.config.progress=false;
			that.showGraphics(listGeomSelected);
		}

		//show graphics

		
			
	}




	this.showGraphics = function(idList){
		currentlyDisplayGraphics  = {}
		dojo.forEach(idList,function(idStr){
			console.log(idStr+"graphic added");
			var graphic = new esri.Graphic(geometryBank[idStr],selectedSymbol);
			currentlyDisplayGraphics[idStr]=graphic;
			graphic.setAttributes( {"name":idStr});
			app.map.graphics.add(graphic);
		})
	}

	this.highlightSymbol = function(idStr){
		if (currentlyDisplayGraphics[idStr]!=undefined){
		currentlyDisplayGraphics[idStr].setSymbol(highlightSymbol);
		currentlyDisplayGraphics[idStr].getDojoShape().moveToFront();
		}
		
	}

	this.defaultSymbol = function(idStr){
		if (currentlyDisplayGraphics[idStr]!=undefined){
		currentlyDisplayGraphics[idStr].setSymbol(selectedSymbol);
		}
	}

	this.queryByAttribute = function(){
		var queryTask = new esri.tasks.QueryTask(options.url);
		query.where = options.where;
		query.maxAllowableOffset = 5000;
		query.returnGeometry = true;
		query.outFields = ["*"];

		//alert(options.url);
		

		queryTask.execute(query, function(results){
			that.returnedFeatures(results.features);	
			if (results.features.length>0)	{
				var extents = esri.graphicsExtent(results.features);				
				app.map.setExtent(extents,true);

			}
		});
		

	}




}

//helper functions

function homeView(id){
	
app.controller.queryController.transitionView(id);

}

function highlightSymbol(id){
	
app.controller.queryController.highlightSymbol(id);

}

function defaultSymbol(id){

app.controller.queryController.defaultSymbol(id);

}

function clearMapGraphics(){ 

	if (app.config.mode=="theme"){		
		app.map.graphics.clear();
	}
}
