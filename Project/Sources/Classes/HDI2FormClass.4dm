

Class constructor
	
	This:C1470.quotaNames:=New collection:C1472()
	
	This:C1470.quotaNames.push("inBytesPerMin")
	This:C1470.quotaNames.push("outBytesPerMin")
	
	This:C1470.quotaNames.push("inBytesPerHour")
	This:C1470.quotaNames.push("outBytesPerHour")
	
	This:C1470.quotaNames.push("nbRequestsPerMin")
	This:C1470.quotaNames.push("nbRequestsPerHour")
	
	This:C1470.quotaNames.push("inBytesPerMinPerSession")
	This:C1470.quotaNames.push("outBytesPerMinPerSession")
	
	This:C1470.quotaNames.push("inBytesPerHourPerSession")
	This:C1470.quotaNames.push("outBytesPerHourPerSession")
	
	This:C1470.quotaNames.push("nbRequestsPerMinPerSession")
	This:C1470.quotaNames.push("nbRequestsPerHourPerSession")
	
	This:C1470.quotaNames.push("nbSessions")
	This:C1470.quotaNames.push("nbGuestSessions")
	
	This:C1470.quotaNames.push("nbEntitySetsPerSession")
	
	
	
Function formEventHandler($formEventCode : Integer)
	
	Case of 
			
		: ($formEventCode=On Load:K2:1)
			
			InitInfo
			
			startComponentWebServer
			
			If (Not:C34(WEB Server:C1674().isRunning))
				WEB Server:C1674().start()
				DELAY PROCESS:C323(Current process:C322; 60)
			End if 
			
			Form:C1466.proposedQuotas:={inBytesPerMin: 10000; outBytesPerMin: 20000; nbRequestsPerMin: 10; nbRequestsPerMinPerSession: 4}
			
			This:C1470.resetQuotas()
			
			Form:C1466.quotas:=This:C1470.getQuotas()
			
			
		: ($formEventCode=On Page Change:K2:54)
			
			Form:C1466.proposedQuotas:={inBytesPerMin: 10000; outBytesPerMin: 20000; nbRequestsPerMin: 10; nbRequestsPerMinPerSession: 4}
			
			Form:C1466.quotas:=This:C1470.getQuotas()
			
		: (Form event code:C388=On Close Box:K2:21)
			If (Is Windows:C1573 && Application info:C1599().SDIMode)
				QUIT 4D:C291
			Else 
				CANCEL:C270
			End if 
			
	End case 
	
	
	
Function applyQuota($quotaName : Text; $quotaValue : Integer)
	
	var $webServerQuotas:=WEB Server:C1674().quotas
	
	//TRACE
	
	$webServerQuotas[$quotaName]:=$quotaValue
	
	Form:C1466.quotas:=This:C1470.getQuotas()
	
	
	
	
Function getQuotas() : Object
	
	var $name : Text
	
	var $result:={}
	
	var $webServerQuotas:=WEB Server:C1674().quotas
	
	For each ($name; $webServerQuotas)
		If ($name#"currentValues")
			$result[$name]:=$webServerQuotas[$name]
		End if 
	End for each 
	
	return $result
	
	
	
Function resetQuotas()
	
	var $name : Text
	
	var $webServerQuotas:=WEB Server:C1674().quotas
	
	For each ($name; This:C1470.quotaNames)
		$webServerQuotas[$name]:=Null:C1517
	End for each 
	
	
	
Function resetThisQuota($quotaName : Text)
	
	var $webServerQuotas:=WEB Server:C1674().quotas
	
	
	$webServerQuotas[$quotaName]:=Null:C1517
	
	Form:C1466.quotas:=This:C1470.getQuotas()
	
	
	
	
	