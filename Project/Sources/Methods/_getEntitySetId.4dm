//%attributes = {}


#DECLARE($request : 4D:C1709.HTTPRequest) : Text

var $entitySetTemp : Text
var $index : Integer
var $entitySetId : Text


If ($request.response.body.__ERROR=Null:C1517)
	
	$entitySetTemp:=$request.response.body.__ENTITYSET
	
	$index:=Position:C15("$entityset"; $entitySetTemp)
	$index+=11
	
	$entitySetId:=Substring:C12($entitySetTemp; $index)
	
	return $entitySetId
	
End if 