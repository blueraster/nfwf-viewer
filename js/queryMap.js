
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

	var progressSymbol = new esri.symbol.PictureMarkerSymbol({
						    "url":"images/progress_indicator.gif",
						    "height":20,
						    "width":20,
						    "type":"esriPMS"
						  });

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


	this.query = function(){

		if (app.config.progress){
			return;
		} else {
			app.config.progress=true;
		}

		//show progress
		var progressGra = new esri.Graphic(options.pt,progressSymbol);
		app.map.graphics.add(progressGra);
		
		if (featureLayer==undefined){
		dojo.forEach(app.map.graphicsLayerIds,function(id){
			if (id.toUpperCase().indexOf(app.config.featuresId.toUpperCase())>-1){
				featureLayer = app.map.getLayer(id);
				featureLayer.setAutoGeneralize(true);
				console.log(featureLayer);
			}

		});
		}

		

		var content = {
						returnGeometry:false,
						geometry: dojo.toJson(options.pt),
						where: options.where,
						geometryType:"esriGeometryPoint",
						f:"json",
						outFields:"*"
		             }



		dojo.io.script.get({
		  url : options.url + "/query",
		  content: content,
		  callbackParamName : "callback",
		  load: dojo.hitch(that,"infoWindowContentHandler")
		});	


	}

	this.infoWindowContentHandler = function(response){

		if (response.features.length>0) {


		var title = "";
		var content = [];
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
			var idStr = "ID"+id;
			listGeomSelected.push(idStr);
			if (geometryBank[idStr]==undefined){
				listGeomQuery.push(id);
			} else {
				listGeomNoQuery.push(idStr);
			}
			content.push({id:idStr,attributes:feature.attributes});
			//content.push("<div id='"+idStr+"' class='clickable' onmouseover='highlightSymbol(this)' onmouseout='defaultSymbol(this)'>"+feature.attributes.Program+"<div>");
		})

		that.buildInfoWindow(content);


		console.log(listGeomQuery);

		app.map.infoWindow.setTitle(features.length + " Programs found");
			

		


		if (listGeomQuery.length==0){
			app.map.graphics.clear();
			app.config.progress=false;
		} else {
			query.geometry = options.pt;
			query.where = app.config.featuresUniqueField + " IN ("+listGeomQuery.join(",")+")";
			featureLayer.selectFeatures(query,esri.layers.FeatureLayer.SELECTION_NEW,that.returnedGeometry);

		}

		if (listGeomNoQuery.length>0){
			that.showGraphics(listGeomNoQuery);
		}


	} else {//end if
		app.config.progress=false;
		app.map.graphics.clear();
	}
	}

	this.buildInfoWindow = function(contentArr){
		var mainView = new dojox.mobile.View({id:"mainView",class:"mblMainView"},dojo.create("div"));
		var listView = new dojox.mobile.View({id:"programsView",class:"mblViews"},dojo.create("div"));	

		var programList = new dojox.mobile.EdgeToEdgeList({
							id:"programList",class:"mblViews"},dojo.create("ul"));

		mainView.addChild(listView);
		listView.addChild(programList);

		dojo.forEach(contentArr,function(item){

		  var infoView = new dojox.mobile.View({id:"View"+item.id,class:"mblViews"},dojo.create("div"));

		  var text ="<div><span onclick=homeView('programsView') class='clickable'><strong> << back</strong></span><br><br></div>";
		  		if ( item.attributes.Program.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div>" + item.attributes.Program + "<br><br></div>";
		  		}
		  		
		  		if ( item.attributes.Sub_prgrm.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div>" + item.attributes.Sub_prgrm + "<br><br></div>";
		  		}
		  		if ( item.attributes.Note.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div>" + item.attributes.Note + "<br><br></div>";
		  		}
		  		if ( item.attributes.ShortDescr.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div>" + item.attributes.ShortDescr + "<br><br></div>";
		  		}
		  		if ( item.attributes.ProgramHom.replace(/^\s+|\s+$/g, "").length>0){
		  		text+="<div><a href='" + item.attributes.ProgramHom + "' target='_blank' class='clickable'>Program details</a></div>";
		  		}

	  			
		  			

		  var content = new dijit.layout.ContentPane({content:text},dojo.create("div"));
		  infoView.addChild(content);
		 
		  //infoView.content="fdfds";
		  mainView.addChild(infoView);
		  console.log("View"+item.id);
		  var li = dojo.create("li");

          var item = new dojox.mobile.ListItem({
                   label: item.attributes.Program,
                   moveTo:"View"+item.id,
                   id:item.id,
                   checkClass:"images/checkmark.png",
                   onClick:dojo.partial(that.transitionView,"View"+item.id)                   
                }, li);

         dojo.addClass(item.domNode,"clickable");


         var overEvt = dojo.connect(item.domNode,"onmouseover",function(evt){
         		console.log(item.id);
				dojo.partial("highlightSymbol",item.id)();
				//dojo.partial(that.highlightSymbol();
         });
       

         var outEvt = dojo.connect(item.domNode,"onmouseout",function(evt){   
         	console.log(item.id);
      	//   if (evt.originalTarget.offsetParent!=null)      	{
      		dojo.partial("defaultSymbol",item.id)();
        //	that.defaultSymbol(evt.originalTarget.offsetParent.id);
       //  	}
         });
         
      //   eventsArray.push(overEvt);
       //  eventsArray.push(outEvt);
         
          programList.addChild(item);

		});

		
		//mainView.addChild(programList);
		homeInfoHeight = contentArr.length*45;
		app.map.infoWindow.resize(350, homeInfoHeight)
		app.map.infoWindow.setContent(mainView.domNode);
		app.map.infoWindow.show(options.pt);

	}

	this.transitionView = function(id){

			console.log(arguments);
			var height=defaultHeight;
			if (id=="programsView"){height=homeInfoHeight}
			var v = dojox.mobile.currentView;
            v.performTransition(id,1,"slide");
            app.map.infoWindow.resize(350, height);
	}

	this.returnedGeometry = function(response,method){
		
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
			app.map.graphics.clear();
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

