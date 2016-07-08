/*
 * Copyright 2015-2016 IBM Corporation
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

import UIKit
import BMSPush
import BMSCore

class ViewController: UIViewController {

    @IBOutlet var activityIndiactor: UIActivityIndicatorView!
    override func viewDidLoad() {
        super.viewDidLoad()
        activityIndiactor.stopAnimating()
        activityIndiactor.hidden = true
               // Do any additional setup after loading the view, typically from a nib.
         regPush();
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    override func viewWillAppear(animated: Bool) {
        
        let appDelegate = UIApplication.sharedApplication().delegate as! AppDelegate
        if appDelegate.valueSet == true {
            
            self.view.userInteractionEnabled = false
            activityIndiactor.hidden = false
            activityIndiactor.startAnimating()

            registerForWeather()
            appDelegate.valueSet = false
        }
    }
    
    func regPush(){
        
        let types = UIApplication.sharedApplication().isRegisteredForRemoteNotifications();
        if (types == false) {
            let settings = UIUserNotificationSettings(forTypes: [.Alert, .Badge, .Sound], categories: nil)
            UIApplication.sharedApplication().registerUserNotificationSettings(settings)
            UIApplication.sharedApplication().registerForRemoteNotifications()
        }
    }
    
    func registerForWeather() {
        
        var devId = String()
        let authManager  = BMSClient.sharedInstance.authorizationManager
        devId = authManager.deviceIdentity.id!
        
        let dict:NSMutableDictionary = NSMutableDictionary()
        var devIdArray = [String]()
        devIdArray.append(devId);
        let appDelegate = UIApplication.sharedApplication().delegate as! AppDelegate

        dict.setValue(devIdArray, forKey: "deviceIds")
        dict.setValue(String(format:"%.2f",appDelegate.latitude), forKey:"latitude")
        dict.setValue(String(format:"%.2f",appDelegate.longitude), forKey: "longitude")
        dict.setValue(appDelegate.timezone, forKey: "timezone")
        
        
        let randomId = randomString(3);
        let db = NSBundle.mainBundle().objectForInfoDictionaryKey("CloudantName") as! String;
        let userName = NSBundle.mainBundle().objectForInfoDictionaryKey("cloudantUserName") as! String;
        let authData = NSBundle.mainBundle().objectForInfoDictionaryKey("cloudantPermission") as! String;
        
        
        // here "jsonData" is the dictionary encoded in JSON data
        let jsonData = try! NSJSONSerialization.dataWithJSONObject(dict, options: NSJSONWritingOptions.PrettyPrinted)
        let data = authData.dataUsingEncoding(NSUTF8StringEncoding);
        let base64 = data!.base64EncodedStringWithOptions([])
        
        var url = String();
        url = "https://\(userName).cloudant.com/\(db)/\(randomId)";
        
        let request = NSMutableURLRequest(URL: NSURL(string: url)!);
        request.HTTPMethod = "PUT"
        request.setValue("Basic \(base64)", forHTTPHeaderField: "Authorization")
        request.HTTPBody = jsonData;
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let task = NSURLSession.sharedSession().dataTaskWithRequest(request) { data, response, error in
            guard error == nil && data != nil else {
                // check for fundamental networking error
                print("error=\(error)")
                return
            }
            if let httpStatus = response as? NSHTTPURLResponse where httpStatus.statusCode != 200 {
                // check for http errors
                print("statusCode should be 201, but is \(httpStatus.statusCode)")
                print("response = \(response)")
            }
            
            dispatch_after(DISPATCH_TIME_NOW, dispatch_get_main_queue(), { ()->() in
                
                self.activityIndiactor.stopAnimating()
                self.activityIndiactor.hidden = true
            })
            self.view.userInteractionEnabled = true
            let responseString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print("responseString = \(responseString)")
            
        }
        task.resume()
       
        
    }
    func randomString(length: Int) -> String {
        let allowedChars = "abc12345"
        let allowedCharsCount = UInt32(allowedChars.characters.count)
        
        var string = ""
        for _ in (0..<length) {
            let randomNum = Int(arc4random_uniform(allowedCharsCount))
            let newCharacter = allowedChars[allowedChars.startIndex.advancedBy(randomNum)]
            string += String(newCharacter)
        }
        return string
    }


}

