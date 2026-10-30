//%attributes = {"shared":true}


If (WEB Server:C1674().isRunning=False:C215)
	WEB Server:C1674().start()
End if 