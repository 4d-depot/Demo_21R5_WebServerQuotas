

shared singleton Class constructor
	
	
Function handle($incoming : 4D:C1709.IncomingMessage) : 4D:C1709.OutgoingMessage
	
	var $files : Collection
	
	var $result:=4D:C1709.OutgoingMessage.new()
	
	Case of 
			
		: (($incoming.verb="GET") && ($incoming.urlQuery.size#Null:C1517))
			$files:=Folder:C1567("/RESOURCES/files/").files()
			
			$result.setBody(This:C1470.buildContent(Num:C11($incoming.urlQuery.size)))
			$result.setHeader("Content-Type"; "text/plain")
			
		: (($incoming.verb="POST") && ($incoming.urlQuery.authenticate#Null:C1517))
			
			If (Bool:C1537($incoming.urlQuery.authenticate="true"))
				Session:C1714.setPrivileges("")
			End if 
			
			
	End case 
	
	return $result
	
	
Function buildContent($size : Integer) : Text
	
	var $i : Integer
	
	var $result:=""
	
	For ($i; 1; $size)
		$result+="A"
	End for 
	
	return $result
	
	
	
Function createEntitySetsOnNewSession($incoming : 4D:C1709.IncomingMessage) : 4D:C1709.OutgoingMessage
	
	var $result:=4D:C1709.OutgoingMessage.new()
	var $entitySets:=New collection:C1472()
	var $createEntitySetUrl:="http://localhost/rest/SomeData?$method=entityset"
	
	var $request : 4D:C1709.HTTPRequest
	var $statusText : Text
	
	
	var $cookie:=""
	var $status:=200
	var $i:=1
	
	While (($i<=Num:C11($incoming.urlQuery.size)) && ($status=200))
		$request:=_sendRequestWithCookie($createEntitySetUrl; HTTP GET method:K71:1; $cookie)
		$cookie:=_getRequestSessionCookie($request)
		$status:=$request.response.status
		$statusText:=$request.response.statusText
		$entitySets.push(_getEntitySetId($request))
		$i+=1
	End while 
	
	If ($status=200)
		$result.setBody({sessionCookie: $cookie; entiySetIds: $entitySets})
		$result.setHeader("Content-Type"; "application/json")
	Else 
		$result.setBody({status: $status; statusText: $statusText})
	End if 
	
	return $result