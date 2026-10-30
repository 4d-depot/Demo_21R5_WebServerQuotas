//%attributes = {"invisible":true}




var Infos; Infos2 : Collection
var objTabs : Object

ARRAY TEXT:C222(Linescode; 0)


Infos:=ds:C1482.INFO.query("PageNumber <= 9").orderBy("PageNumber").toCollection()
objTabs:=New object:C1471("values"; Infos.extract("TabTitle"); "index"; 0)

Infos2:=ds:C1482.INFO.query("PageNumber >= 10").orderBy("PageNumber").toCollection()


QUERY:C277([INFO:1]; [INFO:1]PageNumber:4>=1)
READ WRITE:C146([INFO:1])