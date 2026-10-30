//%attributes = {}


#DECLARE($url : Text; $verb : Text; $cookie : Text) : 4D:C1709.HTTPRequest


var $request : 4D:C1709.HTTPRequest
var $requestObj : Object
var $headers:=New object:C1471()


$headers["Cookie"]:=$cookie

$requestObj:={method: $verb; headers: $headers}


$request:=4D:C1709.HTTPRequest.new($url; $requestObj).wait()

return $request

