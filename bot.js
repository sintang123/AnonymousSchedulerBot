
// Author : Tang Sing Yuen
// Date   : 22 Jan 2018
// Bot    : Anonymous Scheduler Bot

var Botkit = require('botkit');

//const https = require('https');
var http = require("https");
var env = require('node-env-file');
env(__dirname + '/.env');


// Appliacation Specific Variables
var activity = "";
var spaceId = "";


var memberIDList = [];
var memberNameList = [];
var webHookList = [];

var alternativesList = [];
var requesterId = "";

var yesCount = 0;
var noCount = 0;


var bannedEmail1 = "spark-cisco-it-admin-bot@cisco.com";
var bannedEmail2 = "happyscheduler@sparkbot.io";





var controller = Botkit.sparkbot({
    debug: true,
    log: true,
    public_address: process.env.public_address,
    ciscospark_access_token: process.env.access_token,    
    secret: process.env.secret,
    json_file_store: 'path_to_json_database'
});

var lang_to_translate = "id";

var bot = controller.spawn({
});


controller.setupWebserver(process.env.PORT || 3000, function (err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function () {
        console.log("SPARK: Webhooks set up!");
    });
});

controller.hears('^hi', 'direct_message,direct_mention', function (bot, message) {
    console.log(message);

    bot.reply(message, 'Welcome! \n\n I am Anonymous Scheduler Bot. I can help you to get a sensing of how much your team is available for an upcoming activity that you might have in mind. \n\n My commands are simple to use, only **1** command is needed to get immediately start gathering feedback.\n\n- @myname -start [activity_details]');

});



controller.hears('-start *', ['direct_message','direct_mention','mention'], function (bot, message) {

    activity = "";
    spaceId = "";
    memberIDList = [];
    memberNameList = [];
    webHookList = [];
    alternativesList = [];
    requesterId = "";
    yesCount = 0;
    noCount = 0;


    //var toJson = JSON.parse(message);
    var rp = require('request-promise');

    //requesterId = message.raw_message.data.personId;;
    requesterId = " ";

    activityDetails = message.text.substr(message.text.indexOf(" ") + 1);

    spaceId = message.raw_message.data.roomId;

    // Get Room Participants ID

    var options = { method: 'GET',
      url: 'https://api.ciscospark.com/v1/memberships/?roomId=' + spaceId,
      
      headers: 
      { 'Postman-Token': 'b20053e4-6114-8415-f8bb-30f09dc1ef30',
        'Cache-Control': 'no-cache',
        Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
        'Content-type': 'application/json; charset=utf-8' } };

    rp(options)
        .then(function (parsedBody){
           var tempJson = JSON.parse(parsedBody);
           console.log(tempJson);
           for (var i = 0; i < tempJson.items.length; i++) {

             var member = tempJson.items[i];
             if (member.personEmail != bannedEmail1 && member.personEmail != bannedEmail2 && member.personId != requesterId && (member.personEmail.indexOf("sparkbot.io") == -1)){
             
             //if (member.personEmail != bannedEmail1 && member.personEmail != bannedEmail2 &&  (member.personEmail.indexOf("sparkbot.io") == -1)){
                memberIDList.push(member.personId);
                memberNameList.push(member.personDisplayName);
                console.log("Person ID " + (i+1) + " : " + member.personId);


                // Sending Personal Messages
                console.log("Sending votes..");

               var options3 = { method: 'POST',
                    url: 'https://api.ciscospark.com/v1/messages',
                    headers: 
                     { 'Postman-Token': '39ba5087-93c0-481e-373c-156d871943af',
                      'Cache-Control': 'no-cache',
                       Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
                      'Content-type': 'application/json; charset=utf-8' },
                      body: '{\n\t"toPersonId": "' + member.personId + '",\n\t"text": "Vote in Progress. \\n \\n' + activityDetails + ' \\n\\nPlease enter -yes or -no [suggestions?] "\n}' };
                      console.log(options);
                rp(options3)
                .then(function (parsedBody){
                    

                }).catch(function (err){
                        console.log(err);
                });


             }

           }
           bot.reply(message, "Voting have begun. I will notify you when all votes have been collected. \n\nIf you wish to stop collecting votes and see the results, say **-quit**");
           createWebHooks();
           
        }).catch(function (err){
            console.log(err);
        });
});




function createWebHooks(){
    var rp = require('request-promise');
    console.log("Creating WebHooks..");

    for (var z = 0; z < memberIDList.length; z++){

    var options2 = { method: 'POST',
        url: 'https://api.ciscospark.com/v1/webhooks',
        headers: 
            { 'Postman-Token': '537c81a5-e5b2-3da2-d03d-1e4d5013b5fc',
              'Cache-Control': 'no-cache',
              Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
              'Content-type': 'application/json; charset=utf-8' },
              body: '{\n\t"name": "' + memberNameList[z] + '",\n\t"targetUrl": "https://yuenyuen.localtunnel.me",\n\t"resource": "messages",\n\t"event": "created",\n\t"filter": "personId=' + memberIDList[z] + '"\n}' };
    
    console.log(options2);
    rp(options2)
        .then(function (parsedBody){
            var tempJson = JSON.parse(parsedBody);
            webHookList.push(tempJson.id);


        }).catch(function (err){
                console.log(err);
    });
    
    }

}




controller.hears('-yes *', ['direct_message','direct_mention','mention'], function (bot, message) {
    //var toJson = JSON.parse(message);
    var rp = require('request-promise');


    var tempId = message.raw_message.data.personId;
    var index = memberIDList.indexOf(tempId);
    var webHookId = webHookList[index];

    console.log(memberNameList[index] + " have voted YES");
    console.log("Deleting WebHook for " + memberNameList[index]);
    var options = { method: 'DELETE',
     url: 'https://api.ciscospark.com/v1/webhooks/' + webHookId,
    headers: 
     { 'Postman-Token': '639ad82b-177a-6fcb-a26b-540f1b1331b2',
       'Cache-Control': 'no-cache',
       Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
      'Content-type': 'application/json; charset=utf-8' } };

    rp(options)
        .then(function (parsedBody){
           yesCount  = yesCount + 1;
           console.log(memberNameList[index] + "'s Webhook deleted");

           if((memberIDList.length - (yesCount + noCount)) > 0){
             checkVotingStatus(false);
           }else{
              checkVotingStatus(true);
           }

        }).catch(function (err){
            console.log(err);
        });

});

controller.hears('-no *', ['direct_message','direct_mention','mention'], function (bot, message) {
    //var toJson = JSON.parse(message);
    //var rp = require('request-promise');

   var alternatives = message.text.substr(message.text.indexOf(" ") + 1);
    console.log("ALT : " + alternatives);
   if (alternatives.length > 1 && alternatives != '-no'){
      alternativesList.push(alternatives);
    }

    var rp = require('request-promise');

    var tempId = message.raw_message.data.personId;
    var index = memberIDList.indexOf(tempId);
    var webHookId = webHookList[index];

    console.log(memberNameList[index] + " have voted NO");
    console.log("Deleting WebHook for " + memberNameList[index]);
    var options = { method: 'DELETE',
     url: 'https://api.ciscospark.com/v1/webhooks/' + webHookId,
    headers: 
     { 'Postman-Token': '639ad82b-177a-6fcb-a26b-540f1b1331b2',
       'Cache-Control': 'no-cache',
       Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
      'Content-type': 'application/json; charset=utf-8' } };

    rp(options)
        .then(function (parsedBody){
           noCount  = noCount + 1;
           console.log(memberNameList[index] + "'s Webhook deleted");

           if((memberIDList.length - (yesCount + noCount)) > 0){
             checkVotingStatus(false);
           }else{
              checkVotingStatus(true);
           }

        }).catch(function (err){
            console.log(err);
        });

});

function checkVotingStatus(forcedQuit){

    console.log("Checking Voting Status..");
    var rp = require('request-promise');
    var curCount = yesCount + noCount;

    
    if((memberIDList.length - curCount) > 0 || forcedQuit == false){
        var options3 = { method: 'POST',
            url: 'https://api.ciscospark.com/v1/messages',
            headers: 
             { 'Postman-Token': '39ba5087-93c0-481e-373c-156d871943af',
              'Cache-Control': 'no-cache',
               Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
              'Content-type': 'application/json; charset=utf-8' },
              body: '{\n\t"roomId": "' + spaceId + '",\n\t"text": "' + (memberIDList.length - curCount) + ' responses remaining"\n}' };

      rp(options3)
        .then(function (parsedBody){
           
           console.log((memberIDList.length - curCount) + " votes left.")

        }).catch(function (err){
            console.log(err);
        });

    } else{
         var options3 = { method: 'POST',
            url: 'https://api.ciscospark.com/v1/messages',
            headers: 
             { 'Postman-Token': '39ba5087-93c0-481e-373c-156d871943af',
              'Cache-Control': 'no-cache',
               Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
              'Content-type': 'application/json; charset=utf-8' },
              body: '{\n\t"roomId": "' + spaceId + '",\n\t"text": "Voting completed! ' + yesCount + ' says YES! and ' + noCount + ' have said NO! \n}' };




          rp(options3)
            .then(function (parsedBody){
               
               console.log("No: Feedback : " + alternativesList.length);

               
               // Inform Requester of any Suggestion

               var feedback = "";
               if (alternativesList.length > 0){
                feedback = "Vote have ended. Here are the feedback received from your team.\\n\\n";
                  for (var h = 0 ; h < alternativesList.length; h++){
                   feedback = feedback + "Feedback " + (h + 1) + " :\\n" + alternativesList[h] + " \\n \\n";

                 }
                 console.log(feedback);
              }else{
                 feedback = "Vote have ended. No feedback received from your team.\\n";

              }
               

              var options4 = { method: 'POST',
                      url: 'https://api.ciscospark.com/v1/messages',
                      headers: 
                       { 'Postman-Token': '39ba5087-93c0-481e-373c-156d871943af',
                        'Cache-Control': 'no-cache',
                         Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
                        'Content-type': 'application/json; charset=utf-8' },
                        body: '{\n\t"toPersonId": "' + requesterId + '",\n\t"text": "' + feedback + '"\n}' };

                rp(options4)
                  .then(function (parsedBody){
                     
                       console.log("Deleting Existing Webhooks..");
                        for(var z = 0; z < webHookList.length; z++){
                            
                            console.log("Deleting Webhook..");
                            var options = { method: 'DELETE',
                            url: 'https://api.ciscospark.com/v1/webhooks/' + webHookList[z],
                            headers: 
                             { 'Postman-Token': '639ad82b-177a-6fcb-a26b-540f1b1331b2',
                               'Cache-Control': 'no-cache',
                               Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
                              'Content-type': 'application/json; charset=utf-8' } };

                            rp(options)
                                .then(function (parsedBody){
                                  console.log(webHookList.length +  " Webhook remaining..");
                                }).catch(function (err){
                                    console.log(err);
                                });

                        }
                    


                  }).catch(function (err){
                      console.log(err);
                  });







               // Clearing variables
                activity = "";
                spaceId = "";
                memberIDList = [];
                memberNameList = [];
                webHookList = [];
                alternativesList = [] 
                requesterId = "";

                yesCount = 0;
                noCount = 0;



            }).catch(function (err){
                console.log(err);
            });


        

            

    }


}

controller.hears('-quit', ['direct_message','direct_mention','mention'], function (bot, message) {
    var rp = require('request-promise');
    var myId = requesterId;
    //curCount = memberIDList.length;
    //checkVotingStatus(true);

    var curCount = yesCount + noCount;
    var text  = "";

    if (curCount == 0 ){
        text = "Voting have stopped. I'm sorry, your team is busy and have not responded yet.";
    }else{
        text = "Voting have stopped. " + curCount + " of your team members have responded and " + yesCount + " have said YES! and " + noCount + " have said NO!";
    }


    var options3 = { method: 'POST',
        url: 'https://api.ciscospark.com/v1/messages',
        headers: 
         { 'Postman-Token': '39ba5087-93c0-481e-373c-156d871943af',
          'Cache-Control': 'no-cache',
           Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
          'Content-type': 'application/json; charset=utf-8' },
          body: '{\n\t"roomId": "' + spaceId + '",\n\t"text": "' + text + '"\n}'
          
         };
        
      rp(options3)
        .then(function (parsedBody){
              console.log("HEYHEY : " + myId);

            // Inform Requester of any Suggestion

               var feedback = "";
               if (alternativesList.length > 0){
                feedback = "Vote have ended. Here are the feedback received from your team.\\n\\n";
                  for (var h = 0 ; h < alternativesList.length; h++){
                   feedback = feedback + "Feedback " + (h + 1) + " :\\n" + alternativesList[h] + " \\n \\n ";

                 }
                 console.log(feedback);
              }else{
                 feedback = "Vote have ended. No feedback received from your team.\\n";

              }
               

              var options4 = { method: 'POST',
                      url: 'https://api.ciscospark.com/v1/messages',
                      headers: 
                       { 'Postman-Token': '39ba5087-93c0-481e-373c-156d871943af',
                        'Cache-Control': 'no-cache',
                         Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
                        'Content-type': 'application/json; charset=utf-8' },
                        body: '{\n\t"toPersonId": "' + myId + '" ,\n\t"text": "' + feedback + '"\n}' };


              console.log("HeyHEY : " + options4.headers.body);
                rp(options4)
                  .then(function (parsedBody){
                     
                     
                       console.log("Deleting Existing Webhooks..");
                        for(var z = 0; z < webHookList.length; z++){
                            
                            console.log("Deleting Webhook..");
                            var options0 = { method: 'DELETE',
                            url: 'https://api.ciscospark.com/v1/webhooks/' + webHookList[z],
                            headers: 
                             { 'Postman-Token': '639ad82b-177a-6fcb-a26b-540f1b1331b2',
                               'Cache-Control': 'no-cache',
                               Authorization: 'Bearer ZWQ5MDA3ZWItYWJmYi00NTY3LWFhMmUtNzI4NWFmNjFkZGU1MzA0ZWU0MWUtMmVk',
                              'Content-type': 'application/json; charset=utf-8' } };

                            rp(options0)
                                .then(function (parsedBody){
                                  console.log(webHookList.length +  " Webhook remaining..");
                                }).catch(function (err){
                                    console.log(err);
                                });

                        }
                    


                  }).catch(function (err){
                      console.log(err);
                  });


        }).catch(function (err){
            console.log(err);
        });

    // Clearing variables



    activity = "";
    spaceId = "";
    memberIDList = [];
    memberNameList = [];
    webHookList = [];
    alternativesList = [] 
    requesterId = "";

    yesCount = 0;
    noCount = 0;
});



