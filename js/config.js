var appConfig = (function(){



var config = {
			mode:"theme",
			initExtent:{},						
			activeTheme:"",
			activeWhere:"",
			progress:false,
			appTitle:"NFWF Viewer",
			webmap:"fa45b6aaad244b0bb2251bb859634129",
			individualThemeId:["freshwater","oceans","forests"],
			themeQueryWhere:{freshwater:"FW='y'",
							forests:"Forests='y'",
							oceans:"OceansCoas='y'",
							all:"1=1"},
			allThemesId:"all",
			featuresId:"activeprograms",
			featuresURL:"",
			featuresUniqueField:"OBJECTID_1",
			programQueryField:"ShortName",
			themeField:"PriorityTh",
			programTitleField:"Program"	

			}	

return config;

});