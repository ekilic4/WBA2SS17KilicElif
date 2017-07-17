var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var bodyParser = require('body-parser');
var http = require('http');
var faye = require('faye');


var reviewFile = __dirname+'/json/reviews.json';

function getReviewsFromFile(){
    var path = reviewFile;
    if(fs.existsSync(reviewFile)){
        
    var reviews = fs.readFileSync(path).toString(); // liest die Datei synchron aus. (konvertiert zum String)
    var tempContent = reviews.substr(0,reviews.length-1); // Um das letzte Komma aus dem Inhalt der Datei zu entfernen.
      var contentObject = "["+tempContent+"]"; // Um aus den Objekten ein Array zumachen welches die Rezensionen beinhaltet.
    
    var reviewList = JSON.parse(contentObject); // parsed den Inhalt der Datei in ein JSON Objekt.
    
    if(reviews.length == 0 ){
        reviewList = []; // wenn keine Rezension in der Liste sein sollte, wird ein leeres Objekt bzw Array ausgegeben.
    }
    return reviewList;
        
    }
    else{ // Falls die Datei nicht existieren sollte, wird ein leeres Array zurückgegeben.
        var temp = []
        return temp;
    }
}

function checkReviews(id,reviews){ // diese Funktion dient dazu, zu überprüfen ob es schon ein Eintrag mit der gegebenen ID gibt.
    var temp = false; // Standardgemäß auf false gesetzt, falls beide IDs gleich sind, wird der Wert auf true gesetzt.
    for (var i = 0 ; i < reviews.length; i++){
        if(reviews[i].id == id){
            temp = true;
            break;
        }
    }
    
    return temp;
}

function UpdateFile(reviews){
    var path = reviewFile;
     
    /* truncate kürzt den Inhalt der JSON Datei auf die angegebene Stelle, die hier 0 beträgt. Danach wird jede Rezension einzeln wieder in die Datei eingefügt.
    */
    fs.truncate(path,0, function(err){
               
      for(var i = 0 ; i < reviews.length;i++){ // schreibt jeden einzelnen Benutzer aus der Liste der Benutzer in die user.json
                 
            var writeLine = JSON.stringify(reviews[i])+",";
               
            fs.appendFile(path,writeLine, function(err){
                     
            });
        }
    });
}

// Überprüft ob die zu erstellende Rezension über die Attribute verfügt, die gefordert sind.
function checkIfValid(reviewObject){
    var attrCounter = 0;
    for(var attr in reviewObject){
        attrCounter++;
    }
    if(reviewObject.id && reviewObject.productID &&  reviewObject.message && reviewObject.rating && reviewObject.name && attrCounter == 5){
        return true;
    }
    else{
        return false;
    }
}

// Überprüft ob nur die Nachricht der zu aktualisierenden Rezension gesetzt ist.
function checkIfValidUpdate(reviewObject){
     var attrCounter = 0;
    for(var attr in reviewObject){
        attrCounter++;
    }
    if(reviewObject.message && attrCounter == 1){
        return true;
    }
    else{
        return false;
    }
}

// Ressource reviews/ (GET)
router.get("/",function(req,res){
   
    if(fs.existsSync(reviewFile)){ // Überprüft ob die Datei existiert.
        console.log("Datei existiert");
        var reviews = getReviewsFromFile(); // Liest die Rezensionen aus der Datei , die nach der ID benannt ist.
        res.status(200).send(reviews);
    }
    else{
        res.status(404).send("Es existieren noch keinerlei Rezensionen in dieser Anwendung");
    }    
});



// Ressource reviews/ (POST)
router.post("/",bodyParser.json(),function(req,res){
    var reviewObject = req.body;
    var check = checkIfValid(reviewObject);
    if(check){
        request.get("http://localhost:3000/products/"+reviewObject.productID,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
        
        switch(response.statusCode){ // überprüft die Anfrage, wenn erfolgreich 200, wenn 404 nicht erfolgreich.
           case 200: 
                        var productName = JSON.parse(body).name; // Speichert den Produktnamen um ihn später über Faye auszugeben.
                
                        if(fs.existsSync(reviewFile)){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.   
                         var reviews = getReviewsFromFile(); // Liest die Rezensionen aus der Datei , die nach der ID benannt ist.
                         
                         var check = checkReviews(reviewObject.id,reviews); // true = ID existiert schon, false= ID existiert nicht. 
                         if(check === false){
                             var writeLine = JSON.stringify(reviewObject)+","; // das "," dient dazu innerhalb der JSON Datei die einzelnen Rezensionen aufzulisten.
                             fs.appendFile(reviewFile,writeLine,function(err){ // fügt eine Rezension an, writeFile würde jedes mal überschreiben.
                                if(err){console.log(err);}             
                                });
                            res.status(201).send("Rezension wurde erfolgreich erstellt.");
                             // FAYE PUB
                             client.publish('/message', {
                                text:  "Es wurde eine neue Rezension zu "+productName+" verfasst."
                            });
                         }
                        else{
                            res.status(400).send("Es existiert schon eine Rezension mit dieser ID");
                        }
               
                      }
                     else{
                         var writeLine = JSON.stringify(reviewObject)+","; // das "," dient dazu innerhalb der JSON Datei die einzelnen Rezensionen aufzulisten.
                         fs.writeFile(reviewFile,writeLine,function(err){
                           res.status(201).send("Rezension wurde erfolgreich erstellt.") 
                             client.publish('/message', {
                                text:  "Es wurde eine neue Rezension zu "+productName+" verfasst."
                            });
                         });
                     }
                     break;
           case 404: res.send("Das Produkt mit der ID: "+reviewObject.productID+" existiert nicht.");
                     break;
           default: res.status(500).send(""); 
               break;
       }
    });
    }
    else{
        res.status(406).send("Kein Gültiges Rezensionsobjekt\nBeachten sie , das ID,PRODUCTID,MESSAGE,RATING & NAME gesetzt sind");
    }
    
});

// Ressource products/:id/reviews/:revid (GET)
router.get("/:id",function(req,res){
   var id = req.params.id;
   var reviewList = getReviewsFromFile();
   
   var exists = false;
   for(var i = 0; i < reviewList.length ; i++){
       if(reviewList[i].id == id){
           exists = true;
           res.status(200).send(reviewList[i]);
           break;
       }
   }
   if(exists === false){
       res.status(404).send("Es wurde kein Produkt mit der ID: "+id+" gefunden.");
   }
   
    
});

// Ressource products/:id/reviews/:revid (PUT)
router.put("/:id",bodyParser.json(),function(req,res){
       var reviewObject = req.body;

    var check = checkIfValidUpdate(reviewObject);
    if(check){
    if(fs.existsSync(reviewFile)){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.
                        var reviews = getReviewsFromFile();
                        var status = false; 
               
                        for (var i = 0; i < reviews.length; i++){
                             if(reviews[i].id == req.params.id){ // Überprüft ob die Rezension mit der angeforderten ID existiert.
                                 status = true;
                                 
                                 reviews[i].message = req.body.message; // schreibt den bearbeiteten Text, in die Message Variable der Rezension.
                                 
                                 UpdateFile(reviews); // Aktualisiert die Datei der Rezensionen, in dem die Datei gelöscht wird und alle Rezensionen wieder zur Datei hinzugefügt werden.
                                 res.status(201).send("Die Rezension wurde aktualisiert.");
                                 break; // beendet die for-schleife
                             }        
                        }
                        
                        
                        if (status === false){
                            res.status(404).send("Die angeforderte Rezension wurde nicht gefunden.");
                        }
                     }
                 else {
                     res.status(404).send("Es existieren noch keinerlei Rezensionen in dieser Anwendung.");
                 }
    }
    else{
         res.status(406).send("Ungültiges Objekt, bitte beachten sie dass nur die MESSAGE gesetzt sein darf.");
    }
});

// Ressource products/:id/reviews/:revid (DELETE)
router.delete("/:id",function(req,res){
        if(fs.existsSync(reviewFile)){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.
            var reviews = getReviewsFromFile();
            var status = false; 
               
            for (var i = 0; i < reviews.length; i++){
                if(reviews[i].id == req.params.id){ // wenn eine Rezension mit der ID aus der URL gefunden wurde
                   status = true;
                    
                    reviews.splice(i,1); // Löscht den Wert an der i-ten Stelle.
                    UpdateFile(reviews); // Aktualisiert die Datei der Rezensionen, in dem die Datei gelöscht wird und alle Rezensionen wieder zur Datei hinzugefügt werden.
                    res.status(200).send("Die Rezension wurde erfolgreich entfernt.");
                    break; // beendet die for-schleife
                                 
                }        
            }
            if (status === false){
                res.status(404).send("Die angeforderte Rezension konnte nicht gefunden werden.");
                }
            }
            else {
                res.status(404).send("Es existieren noch keinerlei Rezensionen in dieser Anwendung.");
            }
                
});
// ------------FAYE----------------
/* Aus der Dokumentation entnommen */
var server = http.createServer();
var bayeux = new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
});
bayeux.attach(server);
server.listen(8000);


/* Serverseitiger Client */
var client = new faye.Client('http://localhost:8000/faye');

client.subscribe('/message',function(message){
    console.log(message.text);
});

//Bereitstellen des Moduls um require in der app.js einbinden zu können.
module.exports = router;