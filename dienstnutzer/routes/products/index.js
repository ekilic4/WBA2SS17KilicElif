var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var bodyParser = require('body-parser');


function getReviewsFromFile(id){
    var path = "routes/products/json/reviews/"+id+".json";
    
    var reviews = fs.readFileSync(path).toString(); // liest die Datei synchron aus. (konvertiert zum String)
    var tempContent = reviews.substr(0,reviews.length-1); // Um das letzte Komma aus dem Inhalt der Datei zu entfernen.
      var contentObject = "["+tempContent+"]"; // Um aus den Objekten ein Array zumachen welches die Rezensionen beinhaltet.
    
    var reviewList = JSON.parse(contentObject); // parsed den Inhalt der Datei in ein JSON Objekt.
    
    if(reviews.length <= 0 ){
        reviewList = []; // wenn keine Rezension in der Liste sein sollte, wird ein leeres Objekt bzw Array ausgegeben.
    }
    return reviewList;
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

function UpdateFile(id,reviews){
    var path = "routes/products/json/reviews/"+id+".json";
     
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
    
    

// Ressource products/ (GET)
router.get("/",function(req,res){
    request.get("http://localhost:3000/products/",function(error,response,body){ // Fragt die Produkte des Dienstgebers an.
       var content = body;
    
       if(response.statusCode == 200){  // Wenn die Abfrage erfolgreich war, wird der Inhalt der Antwort in ein Objekt umgewandelt.
           content = JSON.parse(content);
       }
       res.status(response.statusCode).send(content);  // übernimmt den Statuscode der Antwort des Dienstgebers
    });
});


// Ressource products/:id (GET)
router.get("/:id",function(req,res){
    var id = req.params.id; // liest die ID aus der URL aus.
    
    request.get("http://localhost:3000/products/"+id,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
       var content = body;
    
       if(response.statusCode == 200){  // Wenn die Abfrage erfolgreich war, wird der Inhalt der Antwort in ein Objekt umgewandelt.
           content = JSON.parse(content);
       }
       res.status(response.statusCode).send(content);  // übernimmt den Statuscode der Antwort des Dienstgebers
    });
});

// Ressource products/:id/reviews (GET)
router.get("/:id/reviews",function(req,res){
   var id = req.params.id; // liest die ID aus der URL aus.
   
   request.get("http://localhost:3000/products/"+id,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
      
       switch(response.statusCode){ // überprüft die Anfrage, wenn erfolgreich 200, wenn 404 nicht erfolgreich.
           case 200: if(fs.existsSync("routes/products/json/reviews/"+id+".json")){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.
                         var reviews = getReviewsFromFile(id); // Liest die Rezensionen aus der Datei , die nach der ID benannt ist.  
                         res.status(200).send(reviews);
                      }
                     else{
                         res.status(404).send("Zu diesem Produkt wurde noch keine Rezension geschrieben.");
                     }
               
                     break;
           case 404: res.send("Das Produkt mit der ID: "+id+" existiert nicht.");
                     break;
           default: res.status(500).send(""); 
               break;
       }
       
       
   });
    
});

// Ressource products/:id/reviews (POST)
router.post("/:id/reviews",bodyParser.json(),function(req,res){
    var id = req.params.id; // liest die ID aus der URL aus.
    
    request.get("http://localhost:3000/products/"+id,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
        
        switch(response.statusCode){ // überprüft die Anfrage, wenn erfolgreich 200, wenn 404 nicht erfolgreich.
           case 200: 
                        var review = req.body;
                
                        if(fs.existsSync("routes/products/json/reviews/"+id+".json")){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.   
                         var reviews = getReviewsFromFile(id); // Liest die Rezensionen aus der Datei , die nach der ID benannt ist.
                         
                         var check = checkReviews(review.id,reviews); // true = ID existiert schon, false= ID existiert nicht. 
                         if(check === false){
                             var writeLine = JSON.stringify(review)+","; // das "," dient dazu innerhalb der JSON Datei die einzelnen Rezensionen aufzulisten.
                             fs.appendFile("routes/products/json/reviews/"+id+".json",writeLine,function(err){ // fügt eine Rezension an, writeFile würde jedes mal überschreiben.
                                if(err){console.log(err);}             
                                });
                            res.status(201).send("Rezension wurde erfolgreich erstellt.");
                         }
                        else{
                            res.status(400).send("Es existiert schon eine Rezension mit dieser ID");
                        }
               
                      }
                     else{
                         var writeLine = JSON.stringify(review)+","; // das "," dient dazu innerhalb der JSON Datei die einzelnen Rezensionen aufzulisten.
                         fs.writeFile("routes/products/json/reviews/"+id+".json",writeLine,function(err){
                           res.status(201).send("Rezension wurde erfolgreich erstellt.")  
                         });
                     }
               
                     break;
           case 404: res.send("Das Produkt mit der ID: "+id+" existiert nicht.");
                     break;
           default: res.status(500).send(""); 
               break;
       }
        
    });
    
});

// Ressource products/:id/reviews/:revid (GET)
router.get("/:id/reviews/:revid",function(req,res){
   var id = req.params.id;
   var revID = req.params.revid;
    
    request.get("http://localhost:3000/products/"+id,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
        switch(response.statusCode){ // überprüft die Anfrage, wenn erfolgreich 200, wenn 404 nicht erfolgreich.
           case 200: if(fs.existsSync("routes/products/json/reviews/"+id+".json")){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.
                        var reviews = getReviewsFromFile(id);
                        var status = false; 
               
                        for (var i = 0; i < reviews.length; i++){
                             if(reviews[i].id == revID){ // wenn eine Rezension mit der revID gefunden wurde
                                 status = true;
                                 res.status(200).send(reviews[i]); // gib dieses aus.
                                 break; // beendet die for-schleife
                             }        
                        }    
                        if (status === false){
                            res.status(404).send("Die angeforderte Rezension konnte nicht gefunden werden.");
                        }
                     }
                 else {
                     res.status(404).send("Zu diesem Produkt wurde noch keine Rezension geschrieben.");
                 }
                
                break;
                
           case 404: res.send("Das Produkt mit der ID: "+id+" existiert nicht.");
                     break;
           default: res.status(500).send(""); 
               break;
               
        }
    });
    
});

// Ressource products/:id/reviews/:revid (PUT)
router.put("/:id/reviews/:revid",bodyParser.json(),function(req,res){
       var id = req.params.id;
       var revID = req.params.revid;
    
    request.get("http://localhost:3000/products/"+id,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
        
        switch(response.statusCode){
            case 200:if(fs.existsSync("routes/products/json/reviews/"+id+".json")){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.
                        var reviews = getReviewsFromFile(id);
                        var status = false; 
               
                        for (var i = 0; i < reviews.length; i++){
                             if(reviews[i].id == revID){ // wenn eine Rezension mit der revID gefunden wurde
                                 status = true;
                                 
                                 reviews[i].message = req.body.message; // schreibt den bearbeiteten Text, in die Message Variable der Rezension.
                                 
                                 UpdateFile(id,reviews); // Aktualisiert die Datei der Rezensionen, in dem die Datei gelöscht wird und alle Rezensionen wieder zur Datei hinzugefügt werden.
                                 res.status(201).send("Die Rezension wurde aktualisiert.");
                                 break; // beendet die for-schleife
                             }        
                        }
                        
                        
                        if (status === false){
                            res.status(404).send("Die angeforderte Rezension konnte nicht gefunden werden.");
                        }
                     }
                 else {
                     res.status(404).send("Zu diesem Produkt wurde noch keine Rezension geschrieben.");
                 }
                
                break;
               
            case 404: res.send("Das Produkt mit der ID: "+id+" existiert nicht.");
                     break;
             default: res.status(500).send(""); 
                     break;
        }
        
    });
});

// Ressource products/:id/reviews/:revid (DELETE)
router.delete("/:id/reviews/:revid",function(req,res){
           var id = req.params.id;
       var revID = req.params.revid;
    
    request.get("http://localhost:3000/products/"+id,function(error,response,body){ // Fragt die Produkte  mit der angegebenen ID des Dienstgebers an.
        switch(response.statusCode){
            case 200:if(fs.existsSync("routes/products/json/reviews/"+id+".json")){ // Überprüft ob das Produkt mit der ID , eine Datei mit Rezensionen besitzt.
                        var reviews = getReviewsFromFile(id);
                        var status = false; 
               
                        for (var i = 0; i < reviews.length; i++){
                             if(reviews[i].id == revID){ // wenn eine Rezension mit der revID gefunden wurde
                                 status = true;
                                 
                                 reviews.splice(i,1); // Löscht den Wert an der i-ten Stelle.
                                 UpdateFile(id,reviews); // Aktualisiert die Datei der Rezensionen, in dem die Datei gelöscht wird und alle Rezensionen wieder zur Datei hinzugefügt werden.
                                 res.status(201).send("Die Rezension wurde erfolgreich entfernt.");
                                 break; // beendet die for-schleife
                                 
                             }        
                        }
                        if (status === false){
                            res.status(404).send("Die angeforderte Rezension konnte nicht gefunden werden.");
                        }
                     }
                 else {
                     res.status(404).send("Zu diesem Produkt wurde noch keine Rezension geschrieben.");
                 }
                
                break;
               
            case 404: res.send("Das Produkt mit der ID: "+id+" existiert nicht.");
                     break;
             default: res.status(500).send(""); 
                     break;
        }
    });
});

//Bereitstellen des Moduls um require in der app.js einbinden zu können.
module.exports = router;