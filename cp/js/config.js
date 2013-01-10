var appConfig = (function(){



var config = {
			mode:"theme",
			initExtent:{},						
			activeTheme:"",
			activeWhere:"",
			progress:false,
			appTitle:"NFWF Viewer",
			webmap:"c8fc07d0187544fc9b262248cd5a8dd2", //fa45b6aaad244b0bb2251bb859634129
			individualThemeId:["freshwater","oceans","forests"],
			themeQueryWhere:{freshwater:"FW='y' AND ConsPrty=1",
							forests:"Forests='y' AND ConsPrty=1",
							oceans:"OceansCoas='y' AND ConsPrty=1",
							conservationp:"1=1 AND ConsPrty=1"},
			allThemesId:"conservationp",
			featuresTitle:"NFWF_ActivePrograms_9Jan2013",//webmap defines this
			featuresURL:"",//added from webmap
			featuresUniqueField:"OBJECTID",
			programQueryField:"ShortName",
			themeField:"PriorityTh",
			programTitleField:"Program"	

			}	

return config;

});