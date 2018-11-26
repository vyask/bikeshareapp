


var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB();
var response = { // for API gateway integration this type of response is required.
        	"statusCode": 200,
        	"headers": {
            		"my_header": "my_value"
        	},
        	"body": "OK",
        	"isBase64Encoded": false
    	};;



exports.gbikeHandler = (event, context, callback) => {

    // need to use queryStringParameters for Lambdaproxy integration, if testing lambda without apigateway make sure input is structured accordingly
    var location = event.queryStringParameters.Location;
    var userid = event.queryStringParameters.Userid;
    if(location == undefined || userid == undefined) {
	console.log("Location and Userid are required inputs");
	response.body = "Location and Userid are required inputs";
	callback(null,response);
    }
    console.log("input locationid:"+location+",user:"+userid);
    var qry = {
        TableName: "bikelocations",
        "KeyConditionExpression": "LocationId=:a1",
        "FilterExpression":"#Stts=:a2",
        ExpressionAttributeNames:{
            "#Stts": "Status"
        },
        "ExpressionAttributeValues": {
            ":a1":{"S":location},
            ":a2":{"N":"0"}
        }
    };
    
    docClient.query(qry, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
		response.body = "Incorrect Input, check and retry";
            callback(null,response);
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data));
            let item = data.Items[0]; // pick the 1st free bike
            if(updateBikeLocations(item.BikeId,item.LocationId,userid) && putBikeRides(item.BikeId.S,item.LocationId.S,userid))
	    		response.body = JSON.stringify(data.Items[0]);
	else response.body = "Error in Input, Retry";
            callback(null,response);

        }
    });

};

function  updateBikeLocations( bikeid,locationid,userid) 
{
    console.log("in update");
       var updateqry = {
            TableName: "bikelocations",
            ExpressionAttributeValues: {":a3":{"N":"1"},":a4":{"N":"0"}},
            Key: { "LocationId":locationid,"BikeId":bikeid},
            UpdateExpression: "Set #Stts = :a3",
            ExpressionAttributeNames: { "#Stts": "Status"},
            ConditionExpression: "#Stts = :a4"
     };
     
    console.log("Attempting a conditional update...");
    docClient.updateItem(updateqry, function(err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
		response.body = "Unable to update bike status, check input and retry";
		return false;
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
	return true;
}

function  putBikeRides(bikeid,locationid,userid)
{
    var curdate = new Date().toString();
    var params = {
            TableName: "bikerides",
            Item: {
            "UserId":{"S":userid},
            "BikeId":{"S":bikeid},
            "pickuplocation":{"S":locationid},
            "pickuptime":{"S":curdate},
            "droplocation":{"S":"Not Yet"},
            "droptime":{"S":"Not Yet"}
            }
    };
    docClient.putItem(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		response.body = "Unable to update ride status, check input and retry";
		return false;
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
    });
	return true;
}
