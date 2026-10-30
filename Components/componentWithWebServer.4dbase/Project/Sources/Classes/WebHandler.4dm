
shared singleton Class constructor
	
	
Function handle($incoming : 4D:C1709.IncomingMessage) : 4D:C1709.OutgoingMessage
	
	var $result:=4D:C1709.OutgoingMessage.new()
	
	
	$result.setBody("OK")
	
	If (JSON Parse:C1218($incoming.urlQuery.getQuotas))
		$result.setBody(getHostWebServerCurrentValues)
		$result.setHeader("Content-Type"; "application/json")
	End if 
	
	
	return $result
	