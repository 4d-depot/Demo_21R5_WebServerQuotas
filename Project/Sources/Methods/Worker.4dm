//%attributes = {}


#DECLARE($signal : 4D:C1709.Signal)


WEB Server:C1674().stop()
DELAY PROCESS:C323(Current process:C322(); 60)
WEB Server:C1674().start()

While (WEB Server:C1674().isRunning=False:C215)
	DELAY PROCESS:C323(Current process:C322(); 1)
End while 

$signal.trigger()