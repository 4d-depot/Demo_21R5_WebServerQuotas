

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
	