
shared singleton Class constructor
	
	
Function handle($incoming : 4D:C1709.IncomingMessage) : 4D:C1709.OutgoingMessage
	
	var $result:=4D:C1709.OutgoingMessage.new()
	
	
	$result.setBody("OK")
	
	Case of 
		: ($incoming.urlQuery.authenticate#Null:C1517)
			If (JSON Parse:C1218($incoming.urlQuery.authenticate))
				Session:C1714.clearPrivileges()
				Session:C1714.setPrivileges("")
			End if 
			
		: ($incoming.urlQuery.getQuotas#Null:C1517)
			If (JSON Parse:C1218($incoming.urlQuery.getQuotas))
				$result.setBody(getHostWebServerCurrentValues)
				$result.setHeader("Content-Type"; "application/json")
			End if 
			
	End case 
	
	return $result
	