var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var bodyParser = require('body-parser');

function getAverage(sum,count){
    return parseFloat(sum/count);
}

function getBestProducts(bestRatedList,productsList){
    var bestProductList = [];

    for(var i = 0; i < bestRatedList.length ; i++){
        var productID = bestRatedList[i];
        for(var j = 0 ; j < productsList.length ; j++){
            console.log(productsList[j].id);
            if(productID == productsList[j].id){
                bestProductList.push(productsList[j]);
                break;
            }
        }
    }
    console.log("BPL:"+bestProductList);
    return bestProductList;
}

function calculateBestProducts(res,productList){
    request.get("http://localhost:3001/reviews/",function(error,response,body){ // Anfrage an die Rezensionen auf die eigene URL (3001 - Dienstnutzer)
               if(response.statusCode == 200){
                   var reviewList = JSON.parse(body);

                   var bestRatedList = [];
                   for(var i = 0; i < reviewList.length ; i++){
                       var productID = reviewList[i].productID;  // dient zum verbessern des Verständnis || speichert sich die derzeite Produkt ID zwischen.
                       var sum = 0;      // Die Summe der Bewertungen
                       var count = 0;
                       for(var j = 0; j < reviewList.length; j++){
                           var compareProduct = reviewList[j];

                           if(productID == compareProduct.productID){ // Überprüft die Anzahl der gleichen Produkte, um die Bewertungen zu summieren.
                               count++; // zählt wieviele gleiche Produkte existieren.
                               sum += parseInt(compareProduct.rating,10); // wandelt das Rating in ein Integer wird um.
                           }
                       }
                       var avg = getAverage(sum,count); // Berechnet den Durchschnitt der Bewertungen für die Produkte
                       if(avg >= 3.5){  // Wenn der Durschnitt der Bewertungen für ein Produkt 3.5 oder größer sind, wird dieses Produkt in die variable bestRatedList geschrieben.
                           //console.log(reviewList[i]);
                           if(bestRatedList.length > 0){
                               for(var b = 0; b < bestRatedList.length; b++){
                                   var exists = false;

                                   if(bestRatedList[b] == productID){
                                       exists = true;
                                       break;
                                   }
                                   if(exists === false){ // Falls die Produkt ID noch nicht existieren sollte, wird sie hier der Liste hinzugefügt.
                                   bestRatedList.push(productID);
                                   }
                               }
                           }
                        else{  // Falls die Liste noch keinen Eintrag hat, wird problemlos eingefügt.
                             bestRatedList.push(productID);
                        }


                       }
                   }

                   var bestProducts = getBestProducts(bestRatedList,productList);
                   if(bestProducts.length > 0){
                       res.status(200).send(bestProducts);
                   }
                   else{
                       res.status(404).send("Es gibt noch kein Produkt dessen Bewertung höher als 3.5 ist.");
                   }

               }
               else{
                   res.status(response.statusCode).send(body);
               }
           });
}

// Ressource products/ (GET) beinhaltet Anwendungslogik!
/* wenn der Parameter contain in der URL gesetzt ist also: products?contain=bestrating dann wird aus den Rezension die bestbewertesten Produkte ausgelesen*/
router.get("/",function(req,res){
    request.get("http://localhost:3000/products",function(error,response,body){ // Fragt die Produkte des Dienstgebers an.
       var productList = body;
        if(req.query.contain && req.query.contain == "bestrating"){
             calculateBestProducts(res,JSON.parse(productList)); // Ab hier beginnt die Anwendungslogik, um die bestbewertesten Produkte anzeigen zu lassen.
        }
        else{
        console.log(response.statusCode);
        if(response.statusCode === 200){
           res.status(200).send(JSON.parse(body));
        }
        else{
            res.status(404).send(body);
        }
      }
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




//Bereitstellen des Moduls um require in der app.js einbinden zu können.
module.exports = router;
