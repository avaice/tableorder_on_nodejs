// load package
let http = require('http');
let url = require('url');
let fs = require('fs');
const mime = require('mime-types');

var order = [];

// variable status
var debugLv = 2;    //デバッグレベルの設定　0=off, 1=エラーログのみ, 2=すべてのログ

// initialize
let server = http.createServer();

server.on('request', function(req, res)
{
    if (req.method == 'GET')
    {
        // if req = / , set "index.html"
        var reqUrl;
        if(req.url == "/"){
            reqUrl = "/index.html";
        }else{
            reqUrl = req.url;
        }
        
        //リクエストされたファイルの読み込み試行
        fs.readFile(__dirname + reqUrl, function(err, data)
        {
            //ファイルが存在しなかった場合
            if(err){
                
                let param = url.parse(req.url, true);
                //reqパラメータがセットされていなければ
                if(!param.query["req"]){
                    //存在しないファイルのリクエストなので404を返す
                    logWrite("cannot found " + reqUrl, 1);
                    res.writeHead(404, {"Content-Type": "text/plain"});
                    res.write("404 not found");
                    res.end();
                }else{
                    logWrite(param.query["req"], 1);
                    if(param.query["req"] == "order"){
                        logWrite("get order " + reqUrl, 2);
                        fs.readFile("order_data.json", function(err, data)
                            {
                                if(err){
                                    logWrite("Error! Cannot read order json.", 1);
                                    creturn(res, "err");
                                }else{
                                    order = JSON.parse( data );
                                    setOrder(param.query["data"]);
                                    creturn(res, ""); // 第2引数はクライアント側注文完了ダイアログに表示する文字
                                }
                            });
                        
                    }else if(param.query["req"] == "history"){
                        logWrite("get history " + reqUrl, 2);
                        fs.readFile("order_data.json", function(err, data)
                            {
                                if(err){
                                    logWrite("Error! Cannot read order json.", 1);
                                    creturn(res, "err");
                                }else{
                                    order = JSON.parse( data );
                                    creturn(res, getOrder(param.query["data"]));
                                }
                            });
                        
                    }else{
                        creturn("Invalid parameter");
                    }
                    
                    
                }
                
            }else{
                //存在していれば読み込んだデータを返す
                res.writeHead(200, {'Content-Type': mime.lookup(__dirname + reqUrl)});
                res.write(data);
                res.end();
                logWrite("send " + reqUrl + " as " + mime.lookup(__dirname + reqUrl), 3);
            }
        });
        /*// get parameter
        let content = url.parse(req.url, true);
        // parameter in content.query['XX'] array
        res.write("");
        res.end();*/
    }
});

// start server
server.listen(1337, '127.0.0.1');


// システム系関数   -----------------------

function logWrite(str, lv) {
    if(debugLv >= lv){
        console.log(str);
    }
}

function creturn(res, str) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(str);
    res.end();
}



// 処理系関数        -----------------------

function setOrder(str){

    var o_info = str.split(":");

    var o_arr = o_info[1].split("-");

    o_arr.forEach(element => {
        var ele_arr = element.split("_");
        for(let i=0; i < ele_arr[1]; ++i){
            order.push([o_info[0],ele_arr[0],"0"]);
        }
    });

    var jstr = JSON.stringify( order );

    fs.writeFile('order_data.json', jstr, function(err, result) {
        if(err) logWrite("Error! Cannot write to storage.", 1);
    });
    
    logWrite(order, 2);

}

function getOrder(table){
    var response = "";
    order.forEach(element => {
        if(element[0] == table){
            response = response + element[1] + "_" + element[2] +"-";
        }
    });
    if(response == ""){
        response = "none";
    }else{
        response = response.slice( 0, -1 );
    }
    return response;
}