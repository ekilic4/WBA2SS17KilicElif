var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var bodyParser = require('body-parser');

function writeProductsIntoFile(productList){
    var localUrl = "routes/products/json/products.json"; // geht von der app.js aus.
    fs.writeFile(localUrl,JSON.stringify(productList),function(err){ // schreibt die Produktliste in die oben definierte Datei.
        
    });
}

function createProductObject(obj){ // schreibt die wichtigsten Informationen in ein Array gefüllt mit Objekten.
    var productList = [];
    for (var i = 0;i < obj.length ; i++){
        var id = obj[i].id;
        var brand = obj[i].brand;
        var name = obj[i].name;
        var price = obj[i].price;
        var description = obj[i].description;
        
        productList.push({
            id:id,
            brand:brand,
            name:name,
            price:price,
            description:description
        });
    }
    
    writeProductsIntoFile(productList); // speichert die zuvor erstellte ProductList in eine lokale Datei.
    
return productList;
}

function readProducts(){
    var products = fs.readFileSync('routes/products/json/products.json').toString(); // liest die Datei synchron aus. (konvertiert zum String)
    if(products.length < 1 ){
        products = []; // wenn keine Produkte in der Liste sein sollte, wird ein leeres Objekt bzw Array ausgegeben.
        return products;
    }
    else{
        return JSON.parse(products);
    }
    
}

function compareProducts(compareID){
    var productList = readProducts(); // liet die Produkte aus der Datei aus
    var product = false;
    
    for (var i = 0; i < productList.length ; i++){
         if(productList[i].id == compareID){ // überprüft die IDs jeweils mit einander, falls sie übereinstimmen speichere das Produkt
             product = productList[i];
         }
     }
    return product; // gib das Produkt an die aufrufende Funktion zurück.
}

// products/ (GET)
router.get('/',function(req,res){
    if(fs.existsSync('routes/products/json/products.json')){
        var productList = readProducts(); // liest die Produkte aus der Datei aus.
        
        if(productList.length > 0){   // Falls die Produktliste gefüllt ist, soll diese ausgegeben werden
        res.status(200).send(productList); // Gibt die Produkte aus.
        }
        
        else{ // Falls die Produktliste nicht gefüllt ist, sollen die Produkte aus der API geholt werden und dann in die Produktliste eingetragen werden.
            var requestUrl = 'http://makeup-api.herokuapp.com/api/v1/products.json' // Make Up API
            request.get(requestUrl, function(error,response,body){ // API Request
                var responseBody = JSON.parse(body); // Inhalt den die API liefert.
                var productList;
        
                createProductObject(responseBody);
        
                res.status(200).send(responseBody); 
        
            });
        }
       }
    else{
        res.status(404).send("Es wurden keine Produkte gefunden.");
    }
     
});

// products/:id (GET)
router.get('/:id',function(req,res){
     var id = req.params.id; // Die ID des Produktes
     
     var product = compareProducts(id); // überprüft ob das Product in der Datei vorhanden ist.
     if(product){
        res.status(200).send(product);  // gibt das Produkt aus, falls es vorhanden ist.   
     }
     else{
         res.status(404).send("Das Produkt mit der ID: "+id+" wurde nicht gefunden."); 
     }
     
     
});

//Bereitstellen des Moduls um require in der app.js einbinden zu können.
module.exports = router;