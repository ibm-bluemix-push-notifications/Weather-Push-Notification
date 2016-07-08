/**
 *
* Copyright 2016 IBM Corporation
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/**
 *  Action to Send Push Notification using IBM Push Notifications service
 *
 *  @param {string} appId - Bluemix app GUID .
 *  @param {string} appSecret - Bluemix Push Service appSecret.
 *  @param {string} apiKey - This is the username:password combination Weather Insights Service.
 *  @param {string} cloudantUserName - Your cloudant username. This is for accessing your `mood` database in cloudant.
 *  @param {object} cloudantPassword - Your cloudant password. This is for accessing your `mood` database in cloudant.
 *  @param {string} appRegion - Region where your bluemix app is hosted. Eg for US Dallas -`.ng.bluemix.net`.

 *  @return {object} whisk async.
*/

var request = require('request');

function main(message) {
    
  console.log("push trigger feed params: ", message);
  
  var appId = message.appId;
  var appSecret = message.appSecret;
  var cloudantUserName = message.cloudantUserName;
  var cloudantPassword = message.cloudantPassword;
  var appRegion = message.appRegion;
  var apiKey = message.apiKey;
  
  
  var url = "https://"+cloudantUserName+":"+cloudantPassword+"@"+cloudantUserName+".cloudant.com/weather/_design/weather/_view/new_view?all";
  console.log("url is:"+url);
  var options = {
    method: 'GET',
    url: url
  };
  request(options, function(error, response, body){
    if (error) {
     return whisk.error();
    }
    
    var obj = JSON.parse(body);
    var array = obj.rows;
    
    console.log("array :"+array);
    var array2 = [];
    array.forEach(function(item) {
      array2 = (item.value).slice();

      console.log("array 2 : ", array2[0])
      
      var body2 = {latitude: array2[0], timePeriod:"current", apiKey:apiKey, longitude: array2[1]};
      var bodyData2 = JSON.stringify(body2);
      var request2 = require('request');
      
      request2({
       method: 'get',
       uri : 'https://'+apiKey+'@twcservice.mybluemix.net/api/weather/v1/geocode/'+array2[0]+'/'+array2[1]+'/forecast/daily/3day.json?units=m&language=en-US'
       //uri: 'https://' + whisk.getAuthKey() + '@openwhisk.ng.bluemix.net/api/v1/namespaces/whisk.system/actions/weather/forecast?blocking=true&result=false',
      
       }, function(error, response, body) {
       
         if(error){
          return whisk.error();
         }
         

         var obj = JSON.parse(body);
         console.log("array 2 : "+body.toString);
         var type = obj.forecasts[0].narrative;

         //var type = obj.response.result.observation.phrase_32char;
         //console.log("trmp is : "+temp);

        console.log("array 2 : "+type);
         if(type.toLowerCase().indexOf("Cloud".toLowerCase()) > -1) {

            type = "Don't forget your jacket and umbrella."
         }
         else if (type.toLowerCase().indexOf("Sunny".toLowerCase()) > -1){

          type += "Don't forget your UV sunscreen and wayfarer."

         }else if (type.toLowerCase().indexOf("Rainy".toLowerCase()) > -1){

          type += "Don't forget your Raincoat."

         }else if (type.toLowerCase().indexOf("Shower".toLowerCase()) > -1){

          type += "Don't forget your Raincoat."

         }else if (type.toLowerCase().indexOf("Thunderstorms".toLowerCase()) > -1){

          type += "Don't forget your Raincoat."

         }else if (type.toLowerCase().indexOf("Drizzle".toLowerCase()) > -1){

          type += "Don't forget your Raincoat."

         }else if (type.toLowerCase().indexOf("Fog".toLowerCase()) > -1){

          type += "Don't forget your Raincoat."

         }
         var text = type;
         console.log("text is : "+text);
         var sendMessage = {message:{alert:text},target:{deviceIds:array2[3]}};
         var bodyData = JSON.stringify(sendMessage);
         var request3 = require('request');
         request3({
            method: 'post',
            uri: 'https://imfpush'+appRegion+'/imfpush/v1/apps/'+appId+'/messages',
            headers :{
              'appSecret': appSecret,
              'Accept': 'application/json',
              'Accept-Language': 'en-US',
              'Content-Type': 'application/json',
              'Content-Length': bodyData.length
            },
            body:bodyData
          }, function(error, response, body) {
            if(error){
             return whisk.error();
            }
            return whisk.done({pushResponse: JSON.stringify(body, undefined, 4)});
          });
       });
    });
  });
  return whisk.async();
}

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length > 0) return false;
    if (obj.length === 0) return true;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    
    return true;
}
